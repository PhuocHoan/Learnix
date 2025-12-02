import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { Request } from 'express';
import { Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

// Custom extractor that tries cookie first, then falls back to Bearer token
const cookieExtractor = (req: Request): string | null => {
  const logger = new Logger('JwtCookieExtractor');

  // First try to get token from HTTP-only cookie
  const cookies = req.cookies as Record<string, string> | undefined;
  if (cookies?.access_token) {
    logger.debug('Token found in cookie');
    return cookies.access_token;
  }

  // Fallback to Authorization header (for API clients, testing, etc.)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    logger.debug('Token found in Authorization header');
    return authHeader.substring(7);
  }

  // Log cookie header for debugging (only in development)
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`Cookie header: ${req.headers.cookie ?? 'none'}`);
    logger.debug(`Cookies parsed: ${JSON.stringify(cookies ?? {})}`);
  }

  logger.debug('No token found in cookie or Authorization header');
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
