import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
@UseGuards(JwtAuthGuard)
export class SpotifyController {
  constructor(private spotifyService: SpotifyService) {}

  @Post('update-score')
  async updateScore(@Req() req) {
    return this.spotifyService.updateUserScores(req.user.id);
  }
} 