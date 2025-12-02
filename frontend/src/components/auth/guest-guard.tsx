import type { ReactNode } from 'react';

import { GraduationCap, Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/use-auth';

interface GuestGuardProps {
  children: ReactNode;
}

/**
 * Guard component that prevents authenticated users from accessing guest-only routes.
 * Redirects authenticated users to the dashboard.
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
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
            <span className="font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard (or the page they came from)
  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from
      ?.pathname;
    const redirectTo = from ?? '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  // Allow guest users to access the page
  return <>{children}</>;
}
