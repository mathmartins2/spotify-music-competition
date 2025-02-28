import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { Cache } from 'cache-manager';

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

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
    const cacheKey = `current_track:${memberId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const member = await this.prisma.groupMember.findUnique({
        where: { id: memberId },
        include: { user: true },
      });

      if (!member) {
        this.logger.error(`Member ${memberId} not found`);
        return;
      }

      this.logger.log(`Updating current track for ${member.user.displayName}`);

      try {
        const currentResponse = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            Authorization: `Bearer ${member.user.accessToken}`,
          },
        });

        if (currentResponse.data && currentResponse.data.item) {
          const track = currentResponse.data.item;
          this.logger.log(`Found current track for ${member.user.displayName}: ${track.name}`);
          
          await this.prisma.groupMember.update({
            where: { id: memberId },
            data: {
              currentTrackId: track.id,
              currentTrackName: track.name,
              currentTrackArtist: track.artists[0].name,
              currentTrackImage: track.album.images[0]?.url,
              lastUpdated: new Date(),
            },
          });
          const result = {
            currentTrackId: track.id,
            currentTrackName: track.name,
            currentTrackArtist: track.artists[0].name,
            currentTrackImage: track.album.images[0]?.url,
            lastUpdated: new Date(),
          };
          await this.cacheManager.set(cacheKey, result);
          return result;
        }
      } catch (error) {
        if (error.response?.status === 204) {
          this.logger.log(`No track currently playing for ${member.user.displayName}`);
        } else {
          this.logger.error(`Error fetching current track: ${error.message}`);
        }
      }

      const recentResponse = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
        headers: {
          Authorization: `Bearer ${member.user.accessToken}`,
        },
        params: {
          limit: 1,
        },
      });

      const track = recentResponse.data.items[0]?.track;
      if (track) {
        this.logger.log(`Found recent track: ${track.name} by ${track.artists[0].name}`);
        
        await this.prisma.groupMember.update({
          where: { id: memberId },
          data: {
            currentTrackId: track.id,
            currentTrackName: track.name,
            currentTrackArtist: track.artists[0].name,
            currentTrackImage: track.album.images[0]?.url,
            lastUpdated: new Date(),
          },
        });
        const result = {
          currentTrackId: track.id,
          currentTrackName: track.name,
          currentTrackArtist: track.artists[0].name,
          currentTrackImage: track.album.images[0]?.url,
          lastUpdated: new Date(),
        };
        await this.cacheManager.set(cacheKey, result);
        return result;
      } else {
        this.logger.warn('No recent tracks found');
      }
    } catch (error) {
      this.logger.error(`Error in updateMemberCurrentTrack: ${error.message}`);
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
} 