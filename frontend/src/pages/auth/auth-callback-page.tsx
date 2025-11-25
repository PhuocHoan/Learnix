import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/use-auth';
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // OAuth callback sets HTTP-only cookie on the server side
    // We just need to refresh the user state from the server
    const handleCallback = async () => {
      try {
        const user = await refreshUser();
        
        // If user doesn't have a role, redirect to select-role
        if (!user?.role) {
          // Force full page reload to ensure clean state
          window.location.href = '/select-role';
        } else {
          // Force full page reload to ensure clean state
          window.location.href = '/dashboard';
        }
      } catch (error) {
        setError('Authentication failed. Please try again.');
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login'), 2000);
      }
    };
    
    handleCallback();
  }, [refreshUser, navigate]);

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
          <p className="text-sm text-muted-foreground mt-2">Redirecting to login...</p>
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
        <p className="text-sm text-muted-foreground mt-2">Please wait while we complete authentication</p>
      </div>
    </div>
  );
}
