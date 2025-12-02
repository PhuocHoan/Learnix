import { useState } from 'react';

import { Outlet } from 'react-router-dom';

import { Header } from './header';
import { Sidebar } from './sidebar';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={handleOverlayClick}
          onKeyDown={handleOverlayKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
