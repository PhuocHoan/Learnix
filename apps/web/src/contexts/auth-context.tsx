import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api/auth-api';

import { AuthContext } from './auth-context-types';

import type { User } from './auth-context-types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is authenticated by calling the profile endpoint
  // The HTTP-only cookie is sent automatically with the request
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const userData = await authApi.getProfile();
      setUser(userData);
      return userData;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // On mount, check if user is authenticated via cookie
    void authApi
      .getProfile()
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

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
