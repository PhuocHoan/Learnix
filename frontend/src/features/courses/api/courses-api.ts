import { api } from "@/lib/api";
import type { User } from "@/contexts/auth-context-types";

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "text";
  durationSeconds: number;
  isFreePreview: boolean;
  orderIndex: number;
  videoUrl?: string;
  content?: string;
}

export interface CourseSection {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  price: number;
  level: "beginner" | "intermediate" | "advanced";
  isPublished: boolean;
  tags?: string[];
  instructor: User;
  sections?: CourseSection[];
  createdAt: string;
}

export interface CoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  tags?: string;
  sort?: "price" | "date";
  order?: "ASC" | "DESC";
}

export interface CoursesResponse {
  data: Course[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EnrollmentResponse {
  isEnrolled: boolean;
  progress: {
    id: string;
    completedLessonIds: string[];
    lastAccessedAt: string;
  } | null;
}

export const coursesApi = {
  getAllCourses: async (params?: CoursesParams): Promise<CoursesResponse> => {
    const response = await api.get("/courses", { params });
    // Check if backend returns array (legacy) or object (new pagination)
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        meta: {
          total: response.data.length,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      };
    }
    return response.data;
  },

  getTags: async (): Promise<string[]> => {
    const response = await api.get("/courses/tags");
    return response.data;
  },

  getCourse: async (id: string): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  enroll: async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  getEnrollment: async (courseId: string): Promise<EnrollmentResponse> => {
    const response = await api.get(`/courses/${courseId}/enrollment`);
    return response.data;
  },

  completeLesson: async (courseId: string, lessonId: string) => {
    const response = await api.post(
      `/courses/${courseId}/lessons/${lessonId}/complete`,
    );
    return response.data;
  },
};
