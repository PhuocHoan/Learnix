import { useEffect, useState } from 'react';

import { GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/contexts/use-auth';

// Cookie utility for setting the auth token
function setAuthCookie(token: string) {
  const isProduction = window.location.hostname !== 'localhost';
  const cookieOptions = [
    `access_token=${token}`,
    'path=/',
    `max-age=${24 * 60 * 60}`, // 24 hours
    isProduction ? 'secure' : '',
    'samesite=lax',
  ]
    .filter(Boolean)
    .join('; ');
  document.cookie = cookieOptions;
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if token is in URL (cross-domain OAuth flow)
        const token = searchParams.get('token');

        if (token) {
          // Set token as cookie on frontend domain
          setAuthCookie(token);

          // Clear token from URL for security (without triggering navigation)
          window.history.replaceState({}, '', '/auth/callback');
        }

        // Refresh user state from server (which will use the cookie)
        const user = await refreshUser();

        // If user doesn't have a role, redirect to select-role
        if (!user?.role) {
          // Force full page reload to ensure clean state
          window.location.href = '/select-role';
        } else {
          // Force full page reload to ensure clean state
          window.location.href = '/dashboard';
        }
      } catch {
        setError('Authentication failed. Please try again.');
        // Redirect to login after a short delay
        setTimeout(() => {
          void navigate('/login');
        }, 2000);
      }
    };

    void handleCallback();
  }, [refreshUser, navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-destructive/10 rounded-xl">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero">
      <div className="text-center animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 gradient-primary rounded-xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-bold text-foreground">Learnix</span>
        </div>
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="font-medium">Signing you in...</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Please wait while we complete authentication
        </p>
      </div>
    </div>
  );
}

export default AuthCallbackPage;
