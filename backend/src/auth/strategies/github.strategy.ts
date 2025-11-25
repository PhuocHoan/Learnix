import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || 'placeholder',
      clientSecret:
        configService.get<string>('GITHUB_CLIENT_SECRET') || 'placeholder',
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ||
        'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: Record<string, unknown>) => void,
  ): void {
    const { displayName, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value ?? '',
      fullName: displayName || profile.username || '',
      avatarUrl: photos?.[0]?.value ?? '',
      providerId: profile.id,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}
