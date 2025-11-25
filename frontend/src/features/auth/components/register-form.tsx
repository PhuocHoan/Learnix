import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerSchema, authApi, type RegisterData } from '../api/auth-api';
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export function RegisterForm() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    try {
      setError(null);
      await authApi.register(data);
      // Redirect to login after successful registration
      navigate('/login?registered=true');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Failed to register';
      setError(errorMessage || 'Failed to register');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Full Name</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            {...register('fullName')}
            type="text" 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all"
            placeholder="John Doe"
          />
        </div>
        {errors.fullName && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.fullName.message}
          </p>
        )}
      </div>

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
        <label className="text-sm font-medium text-foreground">Password</label>
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
        <p className="text-xs text-muted-foreground">
          Must be at least 6 characters
        </p>
      </div>
      
      <button 
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 gradient-primary text-white rounded-xl hover:opacity-90 transition-all font-semibold disabled:opacity-50 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}
