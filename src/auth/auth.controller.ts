import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google-login')
  loginWithGoogle(@Body(ValidationPipe) body: GoogleLoginDto) {
    return this.authService.loginWithGoogle(body.idToken);
  }
}
