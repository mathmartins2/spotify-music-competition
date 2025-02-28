import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-spotify';
import { AuthService } from './auth.service';

@Injectable()
export class SpotifyStrategy extends PassportStrategy(Strategy, 'spotify') {
  private readonly logger = new Logger(SpotifyStrategy.name);

  constructor(private authService: AuthService) {
    super({
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: process.env.SPOTIFY_CALLBACK_URL,
      scope: ['user-read-email', 'user-read-private', 'user-read-recently-played', 'user-top-read', 'user-read-currently-playing'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    try {
      this.logger.log(`Attempting to authenticate Spotify user: ${profile?.id}`);
      
      if (!profile || !profile.id) {
        throw new Error('Spotify profile not found');
      }

      const user = await this.authService.validateUser({
        spotifyId: profile.id,
        email: profile.emails?.[0]?.value,
        accessToken,
        refreshToken,
        displayName: profile.displayName,
        photoUrl: profile.photos?.[0]?.value,
      });

      this.logger.log(`User authenticated successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`, error.stack);
      throw error;
    }
  }
} 