import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy, Profile } from 'passport-github2';

/**
 * GitHub App Authentication Strategy
 *
 * Uses GitHub App OAuth flow (not legacy OAuth App).
 * GitHub Apps provide:
 * - Granular permissions
 * - Higher rate limits
 * - Better security with short-lived tokens
 *
 * Setup: Create a GitHub App at https://github.com/settings/apps
 * Required permissions: read:user, user:email
 */
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      // GitHub App Client ID (not OAuth App)
      clientID:
        configService.get<string>('GITHUB_APP_CLIENT_ID') ?? 'placeholder',
      // GitHub App Client Secret
      clientSecret:
        configService.get<string>('GITHUB_APP_CLIENT_SECRET') ?? 'placeholder',
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ??
        'http://localhost:3000/auth/github/callback',
      // Scopes for GitHub App OAuth
      scope: ['read:user', 'user:email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: Record<string, unknown>) => void,
  ): void {
    const { displayName, emails, photos } = profile;
    // Profile values from GitHub may be null at runtime despite type definitions
    const user = {
      email: emails?.[0]?.value ?? '',
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      fullName: displayName ?? profile.username ?? '',
      avatarUrl: photos?.[0]?.value ?? '',
      providerId: profile.id,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}
