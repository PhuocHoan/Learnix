import { useState, useEffect } from 'react';

import { AlertCircle, CheckCircle2, Loader2, Link2 } from 'lucide-react';

import { cn, validateUrlReachability } from '@/lib/utils';

import { Input } from './input';

interface UrlInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onUrlChange: (url: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  supportedText?: string;
  placeholder?: string;
}

export function UrlInput({
  value,
  onUrlChange,
  onValidationChange,
  supportedText,
  placeholder = 'Paste external URL here...',
  className,
  ...props
}: UrlInputProps) {
  const [validationStatus, setValidationStatus] = useState<{
    state: 'idle' | 'validating' | 'success' | 'error';
    message?: string;
  }>({ state: 'idle' });

  useEffect(() => {
    if (!value.trim()) {
      const timer = setTimeout(() => {
        setValidationStatus({ state: 'idle' });
        onValidationChange?.(true); // Empty is valid unless required
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      void (async () => {
        setValidationStatus({ state: 'validating' });
        const result = await validateUrlReachability(value);
        if (result.reachable) {
          setValidationStatus({ state: 'success' });
          onValidationChange?.(true);
        } else {
          setValidationStatus({
            state: 'error',
            message: result.message ?? 'Link is unreachable or corrupted',
          });
          onValidationChange?.(false);
        }
      })();
    }, 800);

    return () => clearTimeout(timer);
  }, [value, onValidationChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Link2 className="w-4 h-4" />
        </div>
        <Input
          {...props}
          value={value}
          onChange={(e) => onUrlChange(e.target.value)}
          className={cn(
            'pl-10 pr-10',
            validationStatus.state === 'error' &&
              'border-destructive focus-visible:ring-destructive',
            validationStatus.state === 'success' &&
              'border-green-500 focus-visible:ring-green-500',
          )}
          placeholder={placeholder}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {validationStatus.state === 'validating' && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {validationStatus.state === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          {validationStatus.state === 'error' && (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
        </div>
      </div>

      {validationStatus.state === 'error' && (
        <p className="text-xs text-destructive font-medium ml-1">
          {validationStatus.message}
        </p>
      )}

      {supportedText && (
        <p className="text-xs text-muted-foreground font-medium ml-1">
          {supportedText}
        </p>
      )}
    </div>
  );
}
