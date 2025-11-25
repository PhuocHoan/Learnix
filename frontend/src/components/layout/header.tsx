import { Bell, Search, Moon, Sun, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/use-auth';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

// Get initial theme from DOM (set by main.tsx before React mounts)
const getInitialTheme = () => {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
};

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [hasNotifications] = useState(true);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left: Menu & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full group hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search courses, quizzes, or lessons..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all"
          />
          <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-muted-foreground bg-background border border-border rounded-md">
            ⌘K
          </kbd>
        </div>
        {/* Mobile search button */}
        <button className="sm:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Search">
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 sm:p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button 
          className="relative p-2 sm:p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {hasNotifications && (
            <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse-soft" />
          )}
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 ml-1 sm:ml-2 border-l border-border">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-foreground">
              {getGreeting()}, {user?.name || user?.email.split('@')[0]}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role || 'Student'}
            </p>
          </div>
          <button className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-semibold",
            "gradient-primary shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all"
          )}>
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </button>
        </div>
      </div>
    </header>
  );
}
