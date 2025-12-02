import { useEffect, useState } from 'react';

import { GraduationCap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/api/auth-api';

type ActivationStatus = 'loading' | 'success' | 'error';

export function ActivatePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<ActivationStatus>(() =>
    token ? 'loading' : 'error',
  );
  const [message, setMessage] = useState(() =>
    token ? '' : 'Invalid activation link. No token provided.',
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const activateAccount = async () => {
      try {
        const response = await authApi.activate(token);
        setStatus('success');
        // Handle both first-time activation and already-activated scenarios
        setMessage(response.message || 'Account activated successfully!');
      } catch (error: unknown) {
        setStatus('error');
        const errorMessage =
          error instanceof Error && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : 'Failed to activate account';
        // Check if the error message indicates the account might already be activated
        const finalMessage = errorMessage ?? 'Failed to activate account';
        setMessage(finalMessage);
      }
    };

    void activateAccount();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background gradient-hero">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 gradient-primary rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">Learnix</span>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Activating Your Account
              </h1>
              <p className="text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-500/10 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Account Activated!
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Link to="/login">
                <Button className="w-full gradient-primary text-white">
                  Go to Login
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-destructive/10 rounded-full">
                  <XCircle className="w-12 h-12 text-destructive" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Activation Failed
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Link to="/register">
                  <Button className="w-full gradient-primary text-white">
                    Register Again
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivatePage;
