import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from './token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{
        headers: Record<string, string | undefined>;
        user?: unknown;
      }>();

    const header = request.headers.authorization;
    const cookieToken = this.extractCookieToken(request.headers.cookie);
    const token =
      header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : cookieToken;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const payload = this.tokenService.verify(token);

    request.user = {
      userId: payload.sub,
      email: payload.email,
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
