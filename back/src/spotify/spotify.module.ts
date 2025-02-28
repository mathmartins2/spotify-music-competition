import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SpotifyService } from './spotify.service';
import { SpotifyController } from './spotify.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SpotifyCronService } from './spotify.cron.service';
import { AuthModule } from '../auth/auth.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register(),
    forwardRef(() => AuthModule),
  ],
  providers: [SpotifyService, SpotifyCronService],
  controllers: [SpotifyController],
  exports: [SpotifyService],
})
export class SpotifyModule {} 