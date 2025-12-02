import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
}

export function Input({
  className,
  leftIcon,
  rightIcon,
  error,
  ...props
}: InputProps) {
  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {leftIcon}
        </div>
      )}
      <input
        className={cn(
          'w-full py-2.5 rounded-xl border bg-muted/50 text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background',
          'transition-all duration-200',
          leftIcon ? 'pl-10' : 'pl-4',
          rightIcon ? 'pr-10' : 'pr-4',
          error
            ? 'border-destructive focus:ring-destructive/50 focus:border-destructive'
            : 'border-border',
          className,
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {rightIcon}
        </div>
      )}
    </div>
  );
}
