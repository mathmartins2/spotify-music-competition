import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import { SpotifyService } from '../spotify/spotify.service';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);
  constructor(private prisma: PrismaService, private spotifyService: SpotifyService) {}

  async createGroup(name: string, userId: string) {
    this.logger.log(`Creating group "${name}" for user ${userId}`);
    const group = await this.prisma.group.create({
      data: {
        name,
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });
    this.logger.log(`Group created with ID: ${group.id}`);
    return group;
  }

  async getUserGroups(userId: string) {
    this.logger.log(`Fetching groups for user ${userId}`);
    return this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getGroupWithMembers(groupId: string) {
    this.logger.log(`Fetching details for group ${groupId}`);
    
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                photoUrl: true,
              },
            },
            recommendations: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          },
        },
      },
    });

    if (!group) {
      this.logger.error(`Group ${groupId} not found`);
      throw new NotFoundException('Group not found');
    }

    // Atualiza os scores antes de retornar
    await Promise.all(
      group.members.map(async (member) => {
        await this.spotifyService.updateUserScores(member.userId);
      })
    );

    // Busca os dados atualizados e ordena
    const updatedMembers = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            photoUrl: true,
          },
        },
        recommendations: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: { score: 'desc' },
    });

    // Adiciona o rank
    const membersWithRank = updatedMembers.map((member, index) => ({
      ...member,
      rank: index + 1,
    }));

    return {
      ...group,
      members: membersWithRank,
    };
  }

  async joinGroup(groupId: string, userId: string) {
    this.logger.log(`User ${userId} attempting to join group ${groupId}`);
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      this.logger.error(`Group ${groupId} not found`);
      throw new NotFoundException('Group not found');
    }

    const alreadyMember = group.members.some(member => member.userId === userId);
    if (alreadyMember) {
      this.logger.warn(`User ${userId} is already a member of group ${groupId}`);
      throw new ConflictException('User is already a member of this group');
    }

    const member = await this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        group: true,
      },
    });

    this.logger.log(`User ${userId} joined group ${groupId}`);
    return member;
  }

  async generateInviteCode(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const code = crypto
      .createHash('md5')
      .update(`${groupId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 8);

    return { code, groupId };
  }

  async joinByCode(code: string, userId: string) {
    const groupId = code;
    return this.joinGroup(groupId, userId);
  }

  async recommendTrack(memberId: string, track: any) {
    return this.prisma.trackRecommendation.create({
      data: {
        memberId,
        trackId: track.id,
        trackName: track.name,
        trackArtist: track.artists[0].name,
        trackImage: track.album.images[0]?.url,
        trackUrl: track.external_urls.spotify,
      },
    });
  }

  async getRecommendations(memberId: string) {
    return this.prisma.trackRecommendation.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
    });
  }
} 