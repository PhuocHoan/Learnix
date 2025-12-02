import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { Request } from 'express';
import { Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
}

// Custom extractor that tries cookie first, then falls back to Bearer token
const cookieExtractor = (req: RequestWithCookies): string | null => {
  // First try to get token from HTTP-only cookie
  if (req.cookies.access_token) {
    return req.cookies.access_token;
  }
  // Fallback to Authorization header (for API clients, testing, etc.)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'supersecretkey',
    });
  }

  validate(payload: JwtPayload): { id: string; email: string; role: string } {
    // Return 'id' instead of 'userId' to match User entity property
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
