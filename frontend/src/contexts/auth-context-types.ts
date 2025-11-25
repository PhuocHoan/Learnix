import { createContext } from 'react';

export interface User {
  userId: string;
  email: string;
  role: string | null;
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
