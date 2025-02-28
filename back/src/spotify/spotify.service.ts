import { Injectable, Logger, Inject, UnauthorizedException, forwardRef } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { Cache } from 'cache-manager';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  private async handleSpotifyRequest(userId: string, request: () => Promise<any>) {
    try {
      return await request();
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expirado, tenta renovar
        const newToken = await this.authService.refreshSpotifyToken(userId);
        
        // Atualiza o token na request e tenta novamente
        const user = await this.prisma.user.update({
          where: { id: userId },
          data: { accessToken: newToken },
        });

        // Refaz a request com o novo token
        return await request();
      }
      throw error;
    }
  }

  async updateUserScores(userId: string) {
    const cacheKey = `user_score:${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    this.logger.log(`Starting score update for user ${userId}`);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { groups: true },
    });

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const plays = await this.prisma.trackPlay.findMany({
        where: {
          userId,
          playedAt: {
            gte: startOfDay,
          },
        },
      });

      const totalMinutes = plays.reduce((total, play) => {
        return total + (play.duration / 60000);
      }, 0);

      const score = Math.round(totalMinutes);
      this.logger.log(`Score calculated: ${score} (${totalMinutes.toFixed(2)} minutes from ${plays.length} plays today)`);

      const updates = await Promise.all(
        user.groups.map(async (membership) => {
          await this.updateMemberTopTrack(membership.id);
          await this.updateMemberCurrentTrack(membership.id);
          return this.prisma.groupMember.update({
            where: { id: membership.id },
            data: { score: score },
          });
        }),
      );

      const result = {
        totalMinutesListened: totalMinutes,
        totalTracks: plays.length,
        score,
        updatedGroups: updates.length,
      };

      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(`Error updating scores: ${error.message}`);
      throw error;
    }
  }

  async updateMemberTopTrack(memberId: string) {
    try {
      const member = await this.prisma.groupMember.findUnique({
        where: { id: memberId },
        include: { user: true },
      });

      if (!member) return;

      this.logger.log(`Updating top track for member ${memberId}`);

      const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
        headers: {
          Authorization: `Bearer ${member.user.accessToken}`,
        },
        params: {
          limit: 1,
          time_range: 'short_term',
        },
      });

      const topTrack = response.data.items[0];
      if (topTrack) {
        this.logger.log(`Found top track: ${topTrack.name}`);
        await this.prisma.groupMember.update({
          where: { id: memberId },
          data: {
            topTrackId: topTrack.id,
            topTrackName: topTrack.name,
            topTrackArtist: topTrack.artists[0].name,
            topTrackImage: topTrack.album.images[0]?.url,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error updating top track: ${error.message}`);
    }
  }

  async updateMemberCurrentTrack(memberId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { id: memberId },
      include: { user: true }
    });

    if (!member) return;

    try {
      const currentTrack = await this.getCurrentTrack(member.user.id);
      
      if (currentTrack) {
        await this.prisma.groupMember.update({
          where: { id: memberId },
          data: {
            currentTrackId: currentTrack.id,
            currentTrackName: currentTrack.name,
            currentTrackArtist: currentTrack.artists[0].name,
            currentTrackImage: currentTrack.album.images[0]?.url,
            lastUpdated: new Date(),
          }
        });
      }
    } catch (error) {
      this.logger.error(`Failed to update current track for member ${memberId}`, error);
      throw error;
    }
  }

  async getGroupWithMembers(groupId: string) {
    const cacheKey = `group:${groupId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (result) {
      await this.cacheManager.set(cacheKey, result);
    }
    return result;
  }

  async searchTracks(query: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: query,
        type: 'track',
        limit: 10
      },
      headers: {
        Authorization: `Bearer ${user.accessToken}`
      }
    });

    return response.data.tracks.items;
  }

  async getCurrentTrack(userId: string) {
    return this.handleSpotifyRequest(userId, async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      return response.data?.item;
    });
  }

  async getTrack(trackId: string) {
    try {
      // Obter o primeiro usuário para fazer a requisição
      const user = await this.prisma.user.findFirst({
        where: {
          accessToken: {
            not: ''
          }
        }
      });
      
      if (!user) {
        throw new Error('Nenhum usuário com token disponível');
      }
      
      return this.handleSpotifyRequest(user.id, async () => {
        const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        });
        return response.data;
      });
    } catch (error) {
      this.logger.error(`Erro ao obter faixa: ${error.message}`);
      throw error;
    }
  }

  async getArtist(artistId: string) {
    try {
      // Obter o primeiro usuário para fazer a requisição
      const user = await this.prisma.user.findFirst({
        where: {
          accessToken: {
            not: ''
          }
        }
      });
      
      if (!user) {
        throw new Error('Nenhum usuário com token disponível');
      }
      
      return this.handleSpotifyRequest(user.id, async () => {
        const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        });
        return response.data;
      });
    } catch (error) {
      this.logger.error(`Erro ao obter artista: ${error.message}`);
      throw error;
    }
  }
} 