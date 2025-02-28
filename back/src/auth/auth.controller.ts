import { Controller, Get, Req, UseGuards, Logger, Res, Post, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(private authService: AuthService) {}

  @Get('spotify')
  @UseGuards(AuthGuard('spotify'))
  spotifyAuth() {
  }

  @Get('spotify/callback')
  @UseGuards(AuthGuard('spotify'))
  async spotifyAuthCallback(@Req() req, @Res() res) {
    try {
      const result = await this.authService.login(req.user);
      res.redirect(`${process.env.FRONTEND_URL}/callback?code=${result.access_token}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
  }

  @Post('refresh')
  async refreshToken(@Req() req) {
    const oldToken = req.headers.authorization?.split(' ')[1];
    if (!oldToken) {
      throw new UnauthorizedException('No token provided');
    }

    return this.authService.refreshToken(oldToken);
  }
} 