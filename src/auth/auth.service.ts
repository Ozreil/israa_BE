import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { DatabaseService } from '../database/database.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly googleClientId: string;
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly db: DatabaseService,
    private readonly tokenService: TokenService,
  ) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      throw new Error('GOOGLE_CLIENT_ID must be set');
    }

    this.googleClientId = googleClientId;
  }

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
    let payload: TokenPayload | undefined;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google id token');
    }

    if (!payload?.email || payload.email_verified !== true) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    return {
      email: payload.email,
      name: payload.name ?? payload.email.split('@')[0],
    };
  }
}
