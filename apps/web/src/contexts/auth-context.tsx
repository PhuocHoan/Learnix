import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { authApi } from '@/features/auth/api/auth-api';

import { AuthContext } from './auth-context-types';

import type { User } from './auth-context-types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check if user is authenticated by calling the profile endpoint
  // The HTTP-only cookie is sent automatically with the request
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const userData = await authApi.getProfile();
      setUser(userData);
      return userData;
    } catch (error: unknown) {
      setUser(null);

      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : '';

      if (errorMessage?.toLowerCase().includes('blocked')) {
        void navigate('/blocked');
      }

      return null;
    }
  }, [navigate]);

  useEffect(() => {
    // On mount, check if user is authenticated via cookie
    const timer = setTimeout(() => {
      void refreshUser().finally(() => {
        setIsLoading(false);
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshUser]);

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout(); // This clears the HTTP-only cookie on the server
    } catch {
      // Even if the API call fails, clear local state
    }
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
