// Extend Express Request to include user property from Passport.js
// Using a generic type to avoid circular import issues with OAuthProfile
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        displayName?: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
        provider?: string;
        emails?: { value: string; verified?: boolean }[];
        photos?: { value: string }[];
      };
    }
  }
}

export {};
