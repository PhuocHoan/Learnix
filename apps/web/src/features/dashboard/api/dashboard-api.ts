import { api } from '@/lib/api';

export interface DashboardStats {
  coursesEnrolled?: number;
  hoursLearned?: number;
  averageScore?: number;
  coursesCreated?: number;
  totalStudents?: number;
  averageRating?: number;
  totalUsers?: number;
  totalCourses?: number;
  activeStudents?: number;
  totalEnrollments?: number;
  newStudentsCount?: number;
  newUsersCount?: number;
  newCoursesCount?: number;
}

export interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  course?: string;
  timestamp: string;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  getProgress: async (): Promise<{ currentCourses: CourseProgress[] }> => {
    const response = await api.get<{ currentCourses: CourseProgress[] }>(
      '/dashboard/progress',
    );
    return response.data;
  },

  getActivity: async (): Promise<{ activities: Activity[] }> => {
    const response = await api.get<{ activities: Activity[] }>(
      '/dashboard/activity',
    );
    return response.data;
  },
};
