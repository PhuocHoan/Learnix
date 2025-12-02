import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Settings,
  LogOut,
  Shield,
  Wand2,
  ChevronRight,
  Users,
  BarChart3,
  X,
  Home,
  Library,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/use-auth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define interface to support optional properties
interface SidebarItem {
  icon: typeof Home;
  label: string;
  href: string;
  roles?: string[];
  excludeRoles?: string[]; // Added property for exclusion
}

const sidebarItems: SidebarItem[] = [
  // Add Home for everyone
  {
    icon: Home,
    label: 'Home',
    href: '/',
    roles: [], // Empty array or undefined means public
  },
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['student', 'instructor', 'admin'],
  },
  {
    icon: Library,
    label: 'My Learning',
    href: '/my-learning',
    roles: ['student', 'instructor', 'admin'], // All authenticated users can learn
  },
  {
    icon: BookOpen,
    label: 'Browse Courses',
    href: '/courses',
    roles: [], // Public for everyone (guests and all roles)
  },
  {
    icon: Settings,
    label: 'Settings',
    href: '/settings',
    roles: ['student', 'instructor', 'admin'],
  },
];

const instructorItems = [
  {
    icon: Wand2,
    label: 'AI Quiz Generator',
    href: '/instructor/quiz-generator',
    roles: ['instructor', 'admin'],
  },
];

const adminItems = [
  { icon: Shield, label: 'Admin Dashboard', href: '/admin', roles: ['admin'] },
  {
    icon: Users,
    label: 'User Management',
    href: '/admin/users',
    roles: ['admin'],
  },
  {
    icon: BarChart3,
    label: 'System Stats',
    href: '/admin/stats',
    roles: ['admin'],
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async (): Promise<void> => {
    await logout();
    void navigate('/');
  };

  const handleNavClick = () => {
    onClose();
  };

  return (
    <aside
      className={cn(
        'fixed lg:sticky top-0 left-0 z-50 w-72 lg:w-64 bg-card border-r border-border h-screen flex flex-col transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="p-2 gradient-primary rounded-xl">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Learnix</h1>
            <p className="text-xs text-muted-foreground">Learning Platform</p>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Navigation
        </p>
        {sidebarItems
          .filter((item) => {
            // UPDATED FILTER LOGIC
            // 1. If user has a role that is in excludeRoles, hide it
            if (user?.role && item.excludeRoles?.includes(user.role)) {
              return false;
            }
            // 2. Standard inclusion logic
            return (
              !item.roles ||
              item.roles.length === 0 ||
              (user?.role && item.roles.includes(user.role))
            );
          })
          .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform',
                    isActive && 'scale-110',
                  )}
                />
                <span className="flex-1 font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}

        {/* Instructor Section */}
        {(user?.role === 'instructor' || user?.role === 'admin') &&
          instructorItems.length > 0 && (
            <>
              <p className="px-3 py-2 mt-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Instructor Tools
              </p>
              {instructorItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-transform',
                        isActive && 'scale-110',
                      )}
                    />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                );
              })}
            </>
          )}

        {/* Admin Section */}
        {user?.role === 'admin' && adminItems.length > 0 && (
          <>
            <p className="px-3 py-2 mt-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administration
            </p>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform',
                      isActive && 'scale-110',
                    )}
                  />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout Button - ONLY IF LOGGED IN */}
      {user && (
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
