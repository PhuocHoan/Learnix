import type { Course } from '@/features/courses/api/courses-api';
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
  userGrowth: { date: string; count: number }[];
  courseGrowth: { date: string; count: number }[];
  enrollmentGrowth: { date: string; count: number }[];
  revenueGrowth: { date: string; count: number }[];
  avgCompletionRate: number;
  totalRevenue: number;
  activeInstructors: number;
  categoryDistribution: { name: string; value: number }[];
}

export interface GetUsersFilters {
  role?: string;
  sortBy?: 'createdAt' | 'fullName' | 'email';
  sortOrder?: 'ASC' | 'DESC';
  isActive?: boolean;
  isEmailVerified?: boolean;
  search?: string;
}

export const adminApi = {
  getAllUsers: async (filters: GetUsersFilters = {}): Promise<User[]> => {
    const response = await api.get<User[]>('/admin/users', { params: filters });
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

  getPendingCourses: async (): Promise<Course[]> => {
    const response = await api.get<Course[]>('/courses/admin/pending');
    return response.data;
  },

  approveCourse: async (id: string): Promise<void> => {
    await api.patch(`/courses/${id}/approve`);
  },

  rejectCourse: async (id: string): Promise<void> => {
    await api.patch(`/courses/${id}/reject`);
  },
};
