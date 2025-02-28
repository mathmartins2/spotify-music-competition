import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SpotifyService } from 'src/spotify/spotify.service';
import { SpotifyModule } from '../spotify/spotify.module';
import { AuthModule } from '../auth/auth.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => SpotifyModule),
    forwardRef(() => AuthModule),
    CacheModule.register({
      ttl: 5 * 60 * 1000, 
      max: 100,
    }),
  ],
  controllers: [GroupsController],
  providers: [GroupsService, SpotifyService],
  exports: [GroupsService],
})
export class GroupsModule {} 