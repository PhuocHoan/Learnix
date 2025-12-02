import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') ?? 'placeholder',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') ?? 'placeholder',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ??
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { name, emails, photos, id } = profile;
    const user = {
      email: emails?.[0]?.value ?? '',
      fullName: `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim(),
      avatarUrl: photos?.[0]?.value ?? '',
      providerId: id,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}
