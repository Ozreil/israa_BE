import {
  Body,
  Controller,
  Post,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { TokenService } from './token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('google-login')
  async loginWithGoogle(
    @Body(ValidationPipe) body: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginWithGoogle(body.idToken);
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookie('auth_token', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: this.tokenService.getTtlSeconds() * 1000,
      path: '/',
    });

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }
}
