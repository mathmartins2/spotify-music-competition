import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyService } from '../spotify/spotify.service';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => SpotifyService))
    private spotifyService: SpotifyService,
  ) {}

  async validateUser(userData: {
    spotifyId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    displayName?: string;
    photoUrl?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { spotifyId: userData.spotifyId },
    });

    if (!existingUser) {
      return this.prisma.user.create({
        data: userData,
      });
    }

    return this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
        displayName: userData.displayName,
        photoUrl: userData.photoUrl,
      },
    });
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Atualiza o score e as músicas
    await this.spotifyService.updateUserScores(user.id);

    const groups = await this.prisma.groupMember.findMany({
      where: { userId: user.id },
    });

    await Promise.all(
      groups.map(group => this.spotifyService.updateMemberCurrentTrack(group.id))
    );

    return { access_token };
  }

  async refreshToken(oldToken: string) {
    try {
      // Decodifica o token antigo para pegar o userId
      const decoded = this.jwtService.verify(oldToken);
      
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Refresh do token do Spotify
      const spotifyResponse = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: user.refreshToken,
        }), {
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Atualiza os tokens no banco
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: spotifyResponse.data.access_token,
          refreshToken: spotifyResponse.data.refresh_token || user.refreshToken,
        },
      });

      // Gera novo JWT
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshSpotifyToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.refreshToken) {
      throw new UnauthorizedException('No refresh token available');
    }

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: user.refreshToken,
          client_id: process.env.SPOTIFY_CLIENT_ID!,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
        }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token } = response.data;

      // Atualiza os tokens no banco
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token ?? user.refreshToken, // Mantém o antigo se não receber um novo
        },
      });

      return access_token;
    } catch (error) {
      throw new UnauthorizedException('Failed to refresh token');
    }
  }
} 