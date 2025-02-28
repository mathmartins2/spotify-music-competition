import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SpotifyService } from 'src/spotify/spotify.service';
import { SpotifyModule } from '../spotify/spotify.module';

@Module({
  imports: [
    PrismaModule,
    SpotifyModule,
    CacheModule.register({
      ttl: 5 * 60 * 1000, // 5 minutos
      max: 100,
    }),
  ],
  controllers: [GroupsController],
  providers: [GroupsService, SpotifyService],
})
export class GroupsModule {} 