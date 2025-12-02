import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  oauthAvatarUrl: string | null;
  role: 'guest' | 'student' | 'instructor' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
}

export const adminApi = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/admin/users');
    return response.data;
  },

  updateUserRole: async (userId: string, role: string): Promise<User> => {
    const response = await api.patch<User>(`/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  },

  updateUserStatus: async (
    userId: string,
    isActive: boolean,
  ): Promise<User> => {
    const response = await api.patch<User>(`/admin/users/${userId}/status`, {
      isActive,
    });
    return response.data;
  },

  getSystemStats: async (): Promise<SystemStats> => {
    const response = await api.get<SystemStats>('/admin/stats');
    return response.data;
  },
};
