import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../database/database.service';
import type { AuthUser } from './current-user.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { TokenService } from './token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUser;
    }>();

    const header = request.headers.authorization;
    const cookieToken = this.extractCookieToken(request.headers.cookie);
    const token = header?.startsWith('Bearer ')
      ? header.slice('Bearer '.length)
      : cookieToken;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const payload = this.tokenService.verify(token);

    // Role is read from the database on every request so promotions and
    // demotions take effect immediately instead of waiting for token expiry.
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    request.user = {
      userId: user.id,
      email: user.email ?? payload.email,
      role: user.role,
    };

    return true;
  }

  private extractCookieToken(cookieHeader?: string) {
    if (!cookieHeader) {
      return undefined;
    }

    for (const part of cookieHeader.split(';')) {
      const [name, ...valueParts] = part.trim().split('=');
      if (name === 'auth_token') {
        return decodeURIComponent(valueParts.join('='));
      }
    }

    return undefined;
  }
}
