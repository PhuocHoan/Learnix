import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { decryptTokenFromCookie } from '../utils/token-encryption';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (req: Request) => this.extractToken(req),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'supersecretkey',
    });
  }

  private extractToken(req: Request): string | null {
    // First try to get token from HTTP-only cookie
    const cookies = req.cookies as Record<string, string> | undefined;
    if (cookies?.access_token) {
      const tokenEncryptionSecret =
        this.configService.get<string>('OAUTH_TOKEN_COOKIE_SECRET') ??
        this.configService.get<string>('JWT_SECRET') ??
        'dev-secret-key';

      const decryptedToken = decryptTokenFromCookie(
        cookies.access_token,
        tokenEncryptionSecret,
      );

      if (decryptedToken) {
        return decryptedToken;
      }

      // If decryption fails, it might be an old unencrypted token
      // or just an invalid cookie. We return the value as is and
      // let Passport-JWT attempt to validate it (which will fail if it's still encrypted).
      // However, for security, we should probably ONLY return if it was successfully decrypted
      // if we want to enforce encryption.
      // But during transition, returning the cleartext (if it IS cleartext) is safer for users.
      // Actually, if decryptTokenFromCookie returns null, it means it wasn't a valid encrypted packet.
      return cookies.access_token;
    }

    // Fallback to Authorization header (for API clients, testing, etc.)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Log cookie header for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`Cookie header: ${req.headers.cookie ?? 'none'}`);
      this.logger.debug(`Cookies parsed: ${JSON.stringify(cookies ?? {})}`);
    }

    return null;
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
