import { useEffect, useState } from 'react';

import { GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/contexts/use-auth';

/**
 * Set auth cookie with proper SameSite and Secure flags.
 * This cookie will be sent with requests to /api/* which are proxied to backend.
 */
function setAuthCookie(token: string): void {
  const isSecure = window.location.protocol === 'https:';
  const maxAge = 24 * 60 * 60; // 24 hours in seconds

  // Build cookie string with proper attributes
  // - path=/: Available for all paths
  // - max-age: 24 hours in seconds
  // - SameSite=Lax: Allows cookie on top-level navigations (OAuth redirects)
  // - Secure: Only sent over HTTPS (required in production)
  let cookieString = `access_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;

  if (isSecure) {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if token is in URL (OAuth callback from backend)
        const token = searchParams.get('token');

        if (token) {
          // Set token as cookie on frontend domain
          // This cookie will be forwarded by Vercel rewrites to backend
          setAuthCookie(token);

          // Clear token from URL for security (without triggering navigation)
          window.history.replaceState({}, '', '/auth/callback');
        }

        // Small delay to ensure cookie is set before making API call
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Refresh user state from server (cookie is sent automatically via withCredentials)
        const user = await refreshUser();

        // Redirect based on user role status
        if (!user?.role) {
          window.location.href = '/select-role';
        } else {
          window.location.href = '/dashboard';
        }
      } catch {
        setError('Authentication failed. Please try again.');
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
