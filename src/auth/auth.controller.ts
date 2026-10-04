import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Public } from './public.decorator';
import { TokenService } from './token.service';

const AUTH_COOKIE = 'auth_token';

@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('google-login')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async loginWithGoogle(
    @Body() body: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginWithGoogle(body.idToken);

    response.cookie(AUTH_COOKIE, result.accessToken, {
      ...this.cookieOptions(),
      maxAge: this.tokenService.getTtlSeconds() * 1000,
    });

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE, this.cookieOptions());
  }

  private cookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/',
    };
  }
}
