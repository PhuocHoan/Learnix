import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/use-auth';
import { loginSchema, authApi, type LoginData } from '../api/auth-api';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export function LoginForm() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    try {
      setError(null);
      // Login sets HTTP-only cookie automatically
      await authApi.login(data);
      // Refresh user state from server (cookie is sent automatically)
      const user = await refreshUser();
      // If user doesn't have a role, redirect to select-role
      if (!user?.role) {
        navigate('/select-role');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Failed to login';
      setError(errorMessage || 'Failed to login');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            {...register('email')}
            type="email" 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all"
            placeholder="john@example.com"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.email.message}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Password</label>
          <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            {...register('password')}
            type="password" 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all"
            placeholder="••••••••"
          />
        </div>
        {errors.password && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.password.message}
          </p>
        )}
      </div>
      
      <button 
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 gradient-primary text-white rounded-xl hover:opacity-90 transition-all font-semibold disabled:opacity-50 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
