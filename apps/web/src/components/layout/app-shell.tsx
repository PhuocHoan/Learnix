import { Outlet } from 'react-router-dom';

import { Footer } from './footer';
import { Header } from './header';

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/**
 * Container component for pages that need centered content with max-width.
 * Use this wrapper in individual pages for consistent Udemy/Coursera-style layout.
 */
export function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8 ${className}`}
    >
      {children}
    </div>
  );
}
