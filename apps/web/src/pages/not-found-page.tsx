import { GraduationCap, Home, Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * 404 Not Found page component.
 * Displays a user-friendly message when users navigate to non-existent URLs.
 */
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <Card className="max-w-md w-full text-center p-8 animate-fade-in">
        {/* Illustration */}
        <div className="mb-8">
          <div className="relative mx-auto w-32 h-32">
            {/* Background circle */}
            <div className="absolute inset-0 rounded-full bg-muted/50" />
            {/* Icon container */}
            <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-12 h-12 text-primary/60" strokeWidth={1.5} />
            </div>
            {/* 404 badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              404
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been
          moved. Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back Home
            </Link>
          </Button>
          <Button variant="primary" asChild>
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        {/* Footer branding */}
        <div className="mt-8 pt-6 border-t border-border">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="p-1.5 gradient-primary rounded-lg">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Learnix</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default NotFoundPage;
