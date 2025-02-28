import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SpotifyStrategy } from './spotify.strategy';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyService } from '../spotify/spotify.service';
import { CacheModule } from '@nestjs/cache-manager';
import { SpotifyModule } from '../spotify/spotify.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    CacheModule.register({
      ttl: 5 * 60 * 1000,
      max: 100,
    }),
    SpotifyModule,
  ],
  providers: [AuthService, SpotifyStrategy, JwtStrategy, PrismaService, SpotifyService],
  controllers: [AuthController],
})
export class AuthModule {} 