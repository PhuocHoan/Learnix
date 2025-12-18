import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

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
    return cookies.access_token;
  }

  // Fallback to Authorization header (for API clients, testing, etc.)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
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
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'supersecretkey',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    return user;
  }
}
