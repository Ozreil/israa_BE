import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

type TokenPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

@Injectable()
export class TokenService {
  private readonly secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
  private readonly ttlSeconds = 60 * 60 * 24 * 7;

  sign(userId: string, email: string) {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: userId,
      email,
      iat: now,
      exp: now + this.ttlSeconds,
    };

    const encoded = this.base64urlEncode(JSON.stringify(payload));
    const signature = this.signValue(encoded);
    return `${encoded}.${signature}`;
  }

  verify(token: string): TokenPayload {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid token format');
    }

    const expectedSignature = this.signValue(encodedPayload);
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Invalid token signature');
    }

    let payload: TokenPayload;

    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return payload;
  }

  private signValue(value: string) {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }

  private base64urlEncode(value: string) {
    return Buffer.from(value).toString('base64url');
  }
}
