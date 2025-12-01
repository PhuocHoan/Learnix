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

export interface EnrollmentResponse {
  isEnrolled: boolean;
  progress: {
    id: string;
    completedLessonIds: string[];
    lastAccessedAt: string;
  } | null;
}

export const coursesApi = {
  getAllCourses: async (limit?: number): Promise<Course[]> => {
    const params = limit ? { limit } : undefined;
    const response = await api.get("/courses", { params });
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
