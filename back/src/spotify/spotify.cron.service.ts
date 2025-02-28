import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface SpotifyPlayHistoryItem {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    duration_ms: number;
  };
  played_at: string;
  played_ms?: number;
}

@Injectable()
export class SpotifyCronService implements OnModuleInit {
  private readonly logger = new Logger(SpotifyCronService.name);
  private rateLimitDelay = 100; 

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Running initial track check on startup...');
    await this.trackRecentPlays();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async trackRecentPlays() {
    this.logger.log('🎵 Starting track recent plays check...');

    const users = await this.prisma.user.findMany();
    this.logger.log(`👥 Found ${users.length} users to check`);

    for (const user of users) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      try {
        this.logger.debug(`📊 Checking plays for ${user.displayName || user.email}`);
        
        const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
          params: {
            limit: 50,
            after: Date.now() - 5 * 60 * 1000,
          },
        });

        const tracks = response.data.items;
        this.logger.debug(`🎵 Found ${tracks.length} recent tracks from Spotify`);

        const existingPlays = await this.prisma.trackPlay.findMany({
          where: {
            userId: user.id,
            playedAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000),
            },
          },
          select: { trackId: true, playedAt: true },
        });

        const existingPlayIds = new Set(
          existingPlays.map(play => `${play.trackId}-${play.playedAt.getTime()}`)
        );

        const newTracks = tracks.filter((item: SpotifyPlayHistoryItem) => 
          !existingPlayIds.has(`${item.track.id}-${new Date(item.played_at).getTime()}`)
        );

        if (newTracks.length > 0) {
          this.logger.log(`🆕 Found ${newTracks.length} new tracks for ${user.displayName || user.email}`);
          
          await Promise.all(
            newTracks.map((item: SpotifyPlayHistoryItem) => {
              const effectiveDuration = Math.min(
                item.track.duration_ms,
                item.played_ms || Math.max(30000, item.track.duration_ms)
              );

              this.logger.debug(
                `💿 Saving: ${item.track.name} (${Math.round(effectiveDuration/1000)}s played)`
              );

              return this.prisma.trackPlay.create({
                data: {
                  userId: user.id,
                  trackId: item.track.id,
                  trackName: item.track.name,
                  duration: effectiveDuration,
                  playedAt: new Date(item.played_at),
                },
              });
            })
          );

          this.logger.log(`✅ Saved ${newTracks.length} plays for ${user.displayName || user.email}`);
          await this.cacheManager.del(`user_score:${user.id}`);
        } else {
          this.logger.debug(`😴 No new tracks for ${user.displayName || user.email}`);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          this.logger.warn(`🔄 Token expired for ${user.displayName || user.email}, refreshing...`);
          // Implementar refresh do token
          // await this.authService.refreshToken(user);
          continue; // Tenta novamente na próxima execução
        }
        this.logger.error(`❌ Error tracking plays: ${error.message}`);
      }
    }

    this.logger.log('✨ Track recent plays check completed');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldPlays() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.prisma.trackPlay.deleteMany({
      where: {
        playedAt: {
          lt: thirtyDaysAgo
        }
      }
    });
    
    this.logger.log('🧹 Cleaned up plays older than 30 days');
  }

  private async checkSpotifyConnection(user: any): Promise<boolean> {
    try {
      await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      });
      return true;
    } catch {
      return false;
    }
  }
} 