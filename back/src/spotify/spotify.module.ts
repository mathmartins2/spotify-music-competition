import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SpotifyService } from './spotify.service';
import { SpotifyController } from './spotify.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SpotifyCronService } from './spotify.cron.service';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 5 * 60 * 1000, // 5 minutos
      max: 100, // máximo de 100 itens em cache
    }),
  ],
  providers: [SpotifyService, SpotifyCronService],
  controllers: [SpotifyController],
  exports: [SpotifyService],
})
export class SpotifyModule {} 