import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/use-auth';
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
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['student', 'instructor', 'admin'] },
  { icon: BookOpen, label: 'Browse Courses', href: '/courses', roles: ['student', 'instructor', 'admin'] },
  { icon: GraduationCap, label: 'My Learning', href: '/my-learning', roles: ['student'] },
  { icon: Settings, label: 'Settings', href: '/settings', roles: ['student', 'instructor', 'admin'] },
];

const instructorItems = [
  { icon: Wand2, label: 'AI Quiz Generator', href: '/instructor/quiz-generator', roles: ['instructor', 'admin'] },
];

const adminItems = [
  { icon: Shield, label: 'Admin Dashboard', href: '/admin', roles: ['admin'] },
  { icon: Users, label: 'User Management', href: '/admin/users', roles: ['admin'] },
  { icon: BarChart3, label: 'System Stats', href: '/admin/stats', roles: ['admin'] },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    onClose();
  };

  const allItems = [
    ...sidebarItems.filter(item => !item.roles || user && item.roles.includes(user.role)),
    ...(user?.role === 'instructor' || user?.role === 'admin' ? instructorItems : []),
    ...(user?.role === 'admin' ? adminItems : []),
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-600 dark:text-red-400';
      case 'instructor': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      default: return 'bg-green-500/10 text-green-600 dark:text-green-400';
    }
  };

  return (
    <aside className={cn(
      "fixed lg:sticky top-0 left-0 z-50 w-72 lg:w-64 bg-card border-r border-border h-screen flex flex-col transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Logo Section */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 gradient-primary rounded-xl">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Learnix</h1>
            <p className="text-xs text-muted-foreground">Learning Platform</p>
          </div>
        </div>
        {/* Close button for mobile */}
        <button 
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                getRoleBadgeColor(user.role)
              )}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Navigation
        </p>
        {allItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
              <span className="flex-1 font-medium">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}

        {/* Instructor Section */}
        {(user?.role === 'instructor' || user?.role === 'admin') && instructorItems.length > 0 && (
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
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
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
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
