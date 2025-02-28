import { Controller, Post, UseGuards, Req, Get, Query, Param, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpotifyService } from './spotify.service';
import { Logger } from '@nestjs/common';

@Controller('spotify')
@UseGuards(JwtAuthGuard)
export class SpotifyController {
  private readonly logger = new Logger(SpotifyController.name);

  constructor(private spotifyService: SpotifyService) {}

  @Post('update-score')
  async updateScore(@Req() req) {
    return this.spotifyService.updateUserScores(req.user.id);
  }

  @Get('search')
  async searchTracks(@Query('q') query: string, @Req() req) {
    return this.spotifyService.searchTracks(query, req.user.id);
  }

  @Get('track-genre/:trackId')
  async getTrackGenre(@Param('trackId') trackId: string) {
    try {
      // Obter informações da faixa
      const trackInfo = await this.spotifyService.getTrack(trackId);
      
      if (!trackInfo || !trackInfo.artists || !trackInfo.artists.length) {
        this.logger.warn(`Faixa não encontrada ou sem artistas: ${trackId}`);
        return { genres: [] };
      }
      
      // Obter informações do artista
      const artistId = trackInfo.artists[0].id;
      if (!artistId) {
        this.logger.warn(`ID do artista não encontrado para a faixa: ${trackId}`);
        return { genres: [] };
      }
      
      const artistInfo = await this.spotifyService.getArtist(artistId);
      
      if (!artistInfo || !artistInfo.genres) {
        this.logger.warn(`Informações do artista não encontradas: ${artistId}`);
        return { genres: [] };
      }
      
      // Retornar os gêneros do artista
      return { genres: artistInfo.genres || [] };
    } catch (error) {
      this.logger.error(`Erro ao obter gênero da faixa: ${error.message}`);
      throw new HttpException('Erro ao obter gênero da faixa', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 