import type { ReactNode } from 'react';

import { GraduationCap, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/contexts/use-auth';

interface RoleSelectionGuardProps {
  children: ReactNode;
}

/**
 * Guard component for the role selection page.
 * - Allows authenticated users WITHOUT a role to access the page
 * - Redirects authenticated users WITH a role to dashboard
 * - Redirects unauthenticated users to login
 */
export function RoleSelectionGuard({ children }: RoleSelectionGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect users who already have a role to dashboard
  if (user?.role) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allow authenticated users without a role to access the page
  return <>{children}</>;
}
