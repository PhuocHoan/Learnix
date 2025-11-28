import axios from "axios";
import { config } from "@/lib/config";

const API_URL = config.apiUrl;

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
}

export interface CourseProgress {
  id: number;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export interface Activity {
  id: number;
  type: string;
  title: string;
  course?: string;
  timestamp: string;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getProgress: async (): Promise<{ currentCourses: CourseProgress[] }> => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/dashboard/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getActivity: async (): Promise<{ activities: Activity[] }> => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/dashboard/activity`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
