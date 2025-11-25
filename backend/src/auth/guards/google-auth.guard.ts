import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor() {
    super({
      // Force Google to show account selector every time
      // This prevents session caching issues
      prompt: 'select_account',
      accessType: 'offline', // Get refresh token
    });
  }
}
