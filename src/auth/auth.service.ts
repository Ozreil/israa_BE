import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { TokenService } from './token.service';

type GoogleTokenInfo = {
  email?: string;
  name?: string;
  email_verified?: string;
  aud?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly tokenService: TokenService,
  ) {}

  async loginWithGoogle(idToken: string) {
    const googleUser = await this.verifyGoogleToken(idToken);

    const user = await this.db.user.upsert({
      where: { email: googleUser.email },
      update: {
        fullName: googleUser.name,
      },
      create: {
        fullName: googleUser.name,
        email: googleUser.email,
        passwordHash: 'GOOGLE_AUTH',
        role: UserRole.PATIENT,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const accessToken = this.tokenService.sign(
      user.id,
      user.email ?? googleUser.email,
    );
    return { accessToken, user };
  }

  private async verifyGoogleToken(idToken: string) {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google id token');
    }

    const data = (await response.json()) as GoogleTokenInfo;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!data.email || data.email_verified !== 'true') {
      throw new UnauthorizedException('Google account email is not verified');
    }

    if (googleClientId && data.aud !== googleClientId) {
      throw new UnauthorizedException('Google token audience mismatch');
    }

    return {
      email: data.email,
      name: data.name ?? data.email.split('@')[0],
    };
  }
}
