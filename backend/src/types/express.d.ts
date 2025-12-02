import { type OAuthProfile } from '../auth/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: OAuthProfile;
    }
  }
}

export {};
