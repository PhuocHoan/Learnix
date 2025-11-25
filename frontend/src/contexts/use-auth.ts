import { useContext } from 'react';
import { AuthContext } from './auth-context-types';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Re-export types for convenience
export type { User, AuthContextType } from './auth-context-types';
