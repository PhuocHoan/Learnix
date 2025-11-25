import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/features/auth/api/auth-api';
import { AuthContext } from './auth-context-types';
import type { User } from './auth-context-types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated by calling the profile endpoint
  // The HTTP-only cookie is sent automatically with the request
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getProfile();
      setUser(userData);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // On mount, check if user is authenticated via cookie
    authApi.getProfile()
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const logout = async () => {
    try {
      await authApi.logout(); // This clears the HTTP-only cookie on the server
    } catch {
      // Even if the API call fails, clear local state
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
