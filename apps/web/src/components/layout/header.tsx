import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  Clock,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/use-auth';
import { coursesApi, type Course } from '@/features/courses/api/courses-api';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

// Get initial theme from DOM
const getInitialTheme = () => {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
};

// Recent searches storage key
const RECENT_SEARCHES_KEY = 'learnix_recent_searches';
const MAX_RECENT_SEARCHES = 5;

// Get recent searches from localStorage
const getRecentSearches = (): string[] => {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) {
      return [];
    }
    const parsed: unknown = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed as string[];
    }
    return [];
  } catch {
    return [];
  }
};

// Save search to recent searches
const saveRecentSearch = (query: string) => {
  if (!query.trim()) {
    return;
  }
  const recent = getRecentSearches();
  const filtered = recent.filter(
    (s) => s.toLowerCase() !== query.toLowerCase(),
  );
  const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
};

// Clear recent searches
const clearRecentSearches = () => {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
};

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [hasNotifications] = useState(true);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync recent searches from localStorage (uses callback pattern to avoid setState in effect body)
  const syncRecentSearches = () => {
    const stored = getRecentSearches();
    if (JSON.stringify(stored) !== JSON.stringify(recentSearches)) {
      setRecentSearches(stored);
    }
  };

  // Use focus handler to refresh recent searches (avoids sync setState in effect)
  const handleSearchFocus = () => {
    syncRecentSearches();
    setIsSearchFocused(true);
  };

  // Keyboard shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to close
      if (e.key === 'Escape' && isSearchFocused) {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['course-search', debouncedQuery],
    queryFn: () =>
      coursesApi.getAllCourses({ search: debouncedQuery, limit: 5 }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  const suggestions = searchResults?.data ?? [];
  const showDropdown =
    isSearchFocused && (searchQuery || recentSearches.length > 0);

  // Handle search submit
  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        return;
      }
      saveRecentSearch(query);
      setRecentSearches(getRecentSearches());
      setIsSearchFocused(false);
      setSearchQuery('');
      void navigate(`/courses?search=${encodeURIComponent(query)}`);
    },
    [navigate],
  );

  // Handle course click
  const handleCourseClick = useCallback(
    (course: Course) => {
      saveRecentSearch(course.title);
      setRecentSearches(getRecentSearches());
      setIsSearchFocused(false);
      setSearchQuery('');
      void navigate(`/courses/${course.id}`);
    },
    [navigate],
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const totalItems = suggestions.length + (searchQuery ? 1 : 0); // +1 for "See all results"

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex === -1 || selectedIndex === suggestions.length) {
        // Search for the query
        handleSearch(searchQuery);
      } else if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        // Navigate to course - use safe array access
        const selectedCourse = suggestions.at(selectedIndex);
        if (selectedCourse) {
          handleCourseClick(selectedCourse);
        }
      }
    }
  };

  // Clear a recent search
  const handleClearRecent = (searchToClear: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== searchToClear);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Clear all recent searches
  const handleClearAllRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 18) {
      return 'Good afternoon';
    }
    return 'Good evening';
  };

  return (
    <header className="h-16 border-b border-border bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/60 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-0 sm:hidden bg-background/95 backdrop-blur-md z-20 flex flex-col px-4 pt-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSearch(searchQuery);
                    setIsMobileSearchOpen(false);
                  }
                }}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all"
              />
            </div>
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Mobile search results */}
          <div className="flex-1 overflow-y-auto pb-4">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isSearching && suggestions.length > 0 && (
              <div className="space-y-1">
                {suggestions.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => {
                      handleCourseClick(course);
                      setIsMobileSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {course.title}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {course.level} •{' '}
                        {course.instructor?.fullName ?? course.instructor?.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Left: Menu & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Search with Dropdown */}
        <div
          ref={searchContainerRef}
          className="relative w-full hidden sm:block"
        >
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onFocus={handleSearchFocus}
              onKeyDown={handleKeyDown}
              placeholder="Search courses..."
              className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-muted-foreground bg-background border border-border rounded-md">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Recent Searches (when no query) */}
              {!searchQuery && recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Recent Searches
                    </span>
                    <button
                      onClick={handleClearAllRecent}
                      className="text-xs text-primary hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left group"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{search}</span>
                      <X
                        className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                        onClick={(e) => handleClearRecent(search, e)}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trending/Popular (when no query and no recent) */}
              {!searchQuery && recentSearches.length === 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Popular Searches
                    </span>
                  </div>
                  {['React', 'JavaScript', 'Python', 'Machine Learning'].map(
                    (term) => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left"
                      >
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{term}</span>
                      </button>
                    ),
                  )}
                </div>
              )}

              {/* Search Results */}
              {searchQuery && suggestions.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Courses
                    </span>
                  </div>
                  {suggestions.map((course, index) => (
                    <button
                      key={course.id}
                      onClick={() => handleCourseClick(course)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        selectedIndex === index
                          ? 'bg-primary/10'
                          : 'hover:bg-muted',
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {course.title}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {course.level} •{' '}
                          {course.instructor?.fullName ??
                            course.instructor?.name}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                  {/* See all results */}
                  <button
                    onClick={() => handleSearch(searchQuery)}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-3 py-3 mt-1 rounded-lg text-sm font-medium text-primary transition-colors',
                      selectedIndex === suggestions.length
                        ? 'bg-primary/10'
                        : 'hover:bg-muted',
                    )}
                  >
                    See all results for "{searchQuery}"
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* No results */}
              {searchQuery &&
                debouncedQuery === searchQuery &&
                suggestions.length === 0 &&
                !isSearching && (
                  <div className="p-6 text-center">
                    <Search className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No courses found for "{searchQuery}"
                    </p>
                    <button
                      onClick={() => handleSearch(searchQuery)}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      Browse all courses
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Mobile search button */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="sm:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground"
          aria-label="Search"
        >
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

        {user ? (
          /* Logged In State */
          <>
            <button
              className="relative p-2 sm:p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {hasNotifications && (
                <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse-soft" />
              )}
            </button>

            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 ml-1 sm:ml-2 border-l border-border">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-foreground">
                  {getGreeting()},{' '}
                  {user?.fullName ?? user?.name ?? user?.email.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role ?? 'Student'}
                </p>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
                aria-label="Go to settings"
              >
                {(user?.avatarUrl ?? user?.oauthAvatarUrl) ? (
                  <img
                    src={user.avatarUrl ?? user.oauthAvatarUrl}
                    alt={user?.fullName ?? user?.name ?? 'User avatar'}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-semibold cursor-pointer',
                      'gradient-primary shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all',
                    )}
                  >
                    {user?.fullName?.charAt(0).toUpperCase() ??
                      user?.name?.charAt(0).toUpperCase() ??
                      user?.email?.charAt(0).toUpperCase() ??
                      'U'}
                  </div>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Guest State */
          <div className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 sm:ml-2 border-l border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="hidden sm:flex"
            >
              Log in
            </Button>
            <Button size="sm" onClick={() => navigate('/register')}>
              Sign up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
