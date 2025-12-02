import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { AuthContext } from './auth-context-types';
import { useAuth } from './use-auth';

import type { AuthContextType } from './auth-context-types';

// Mock auth API
vi.mock('@/features/auth/api/auth-api', () => ({
  authApi: {
    getProfile: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('useAuth hook', () => {
  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');

    consoleSpy.mockRestore();
  });

  it('returns auth context when used within AuthProvider', () => {
    const mockContextValue: AuthContextType = {
      user: {
        userId: '1',
        email: 'test@example.com',
        role: 'student',
        name: 'Test User',
      },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toEqual(mockContextValue);
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('returns null user when not authenticated', () => {
    const mockContextValue: AuthContextType = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('shows loading state', () => {
    const mockContextValue: AuthContextType = {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('provides logout function', async () => {
    const mockLogout = vi.fn();
    const mockContextValue: AuthContextType = {
      user: { userId: '1', email: 'test@example.com', role: 'student' },
      isLoading: false,
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
  });

  it('provides refreshUser function', async () => {
    const mockRefreshUser = vi.fn().mockResolvedValue({
      userId: '1',
      email: 'test@example.com',
    });
    const mockContextValue: AuthContextType = {
      user: { userId: '1', email: 'test@example.com', role: 'student' },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: mockRefreshUser,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(mockRefreshUser).toHaveBeenCalled();
  });

  it('correctly identifies admin user', () => {
    const mockContextValue: AuthContextType = {
      user: {
        userId: '1',
        email: 'admin@example.com',
        role: 'admin',
        name: 'Admin User',
      },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.role).toBe('admin');
  });

  it('correctly identifies instructor user', () => {
    const mockContextValue: AuthContextType = {
      user: {
        userId: '1',
        email: 'instructor@example.com',
        role: 'instructor',
        name: 'Instructor User',
      },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.role).toBe('instructor');
  });

  it('handles user with no role (pending role selection)', () => {
    const mockContextValue: AuthContextType = {
      user: {
        userId: '1',
        email: 'new@example.com',
        role: null,
        name: 'New User',
      },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.role).toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles user with avatar URL', () => {
    const mockContextValue: AuthContextType = {
      user: {
        userId: '1',
        email: 'test@example.com',
        role: 'student',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.avatarUrl).toBe(
      'https://example.com/avatar.jpg',
    );
  });
});

describe('AuthProvider Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('provides query client context', () => {
    const mockContextValue: AuthContextType = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockContextValue}>
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBeDefined();
  });
});
