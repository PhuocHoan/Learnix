import type { User } from '@/contexts/auth-context-types';
import { api } from '@/lib/api';

export interface Lesson {
  id: string;
  title: string;
  type: 'standard' | 'quiz';
  content: LessonBlock[]; // Now an array of blocks
  durationSeconds: number;
  isFreePreview: boolean;
  orderIndex: number;
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
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'pending' | 'published' | 'rejected';
  isPublished: boolean;
  tags?: string[];
  instructor: User;
  sections?: CourseSection[];
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  tags?: string;
  sort?: 'price' | 'date';
  order?: 'ASC' | 'DESC';
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
  isInstructor: boolean;
  isAdmin: boolean;
  hasAccess: boolean;
  progress: {
    id: string;
    completedLessonIds: string[];
    lastAccessedAt: string;
  } | null;
}

/** Enrolled course with progress (for My Learning page) */
export interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  level: string;
  instructor: {
    id: string;
    fullName: string;
  };
  progress: number;
  totalLessons: number;
  completedLessons: number;
  status: 'in-progress' | 'completed';
  isArchived: boolean;
  lastAccessedAt: string;
  enrolledAt: string;
}

export interface EnrolledCoursesParams {
  archived?: boolean;
  status?: 'all' | 'in-progress' | 'completed';
}

/** Recommended course with matching tags and score */
export interface RecommendedCourse {
  course: Course;
  matchingTags: string[];
  score: number;
}

export interface CreateCourseData {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  tags?: string[];
  thumbnailUrl?: string;
}

export interface CreateLessonData {
  title: string;
  type?: 'standard' | 'quiz';
  content: LessonBlock[];
  durationSeconds: number;
  isFreePreview: boolean;
  orderIndex: number;
}

export type BlockType = 'text' | 'video' | 'image' | 'code' | 'file';

export interface LessonBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    language?: string;
    filename?: string;
    size?: number;
    caption?: string;
    videoSource?: 'upload' | 'url';
  };
  orderIndex: number;
}

export const coursesApi = {
  getAllCourses: async (params?: CoursesParams): Promise<CoursesResponse> => {
    const response = await api.get<Course[] | CoursesResponse>('/courses', {
      params,
    });
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
    const response = await api.get<string[]>('/courses/tags');
    return response.data;
  },

  getCourse: async (id: string): Promise<Course> => {
    const response = await api.get<Course>(`/courses/${id}`);
    return response.data;
  },

  enroll: async (
    courseId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      `/courses/${courseId}/enroll`,
    );
    return response.data;
  },

  getEnrollment: async (courseId: string): Promise<EnrollmentResponse> => {
    const response = await api.get<EnrollmentResponse>(
      `/courses/${courseId}/enrollment`,
    );
    return response.data;
  },

  completeLesson: async (
    courseId: string,
    lessonId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      `/courses/${courseId}/lessons/${lessonId}/complete`,
    );
    return response.data;
  },

  /** Get all enrolled courses for the current user (My Learning) */
  getEnrolledCourses: async (
    params?: EnrolledCoursesParams,
  ): Promise<EnrolledCourse[]> => {
    const response = await api.get<EnrolledCourse[]>('/courses/enrolled', {
      params,
    });
    return response.data;
  },

  /** Archive a course (hide from main list, preserve progress) */
  archiveCourse: async (
    courseId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch<{ success: boolean; message: string }>(
      `/courses/${courseId}/archive`,
    );
    return response.data;
  },

  /** Unarchive a course (restore to main list) */
  unarchiveCourse: async (
    courseId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch<{ success: boolean; message: string }>(
      `/courses/${courseId}/unarchive`,
    );
    return response.data;
  },

  /** Get course recommendations based on enrolled course tags */
  getRecommendations: async (limit = 6): Promise<RecommendedCourse[]> => {
    const response = await api.get<RecommendedCourse[]>(
      '/courses/recommendations',
      {
        params: { limit },
      },
    );
    return response.data;
  },

  getInstructorCourses: async (): Promise<Course[]> => {
    const response = await api.get<Course[]>('/courses/instructor/my-courses');
    return response.data;
  },

  createCourse: async (data: CreateCourseData): Promise<Course> => {
    const response = await api.post<Course>('/courses', data);
    return response.data;
  },

  updateCourse: async (
    id: string,
    data: Partial<CreateCourseData> & { isPublished?: boolean },
  ): Promise<Course> => {
    const response = await api.patch<Course>(`/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  createSection: async (
    courseId: string,
    title: string,
    orderIndex: number,
  ): Promise<CourseSection> => {
    const response = await api.post<CourseSection>(
      `/courses/${courseId}/sections`,
      { title, orderIndex },
    );
    return response.data;
  },

  deleteSection: async (sectionId: string): Promise<void> => {
    await api.delete(`/courses/sections/${sectionId}`);
  },

  createLesson: async (
    sectionId: string,
    data: CreateLessonData,
  ): Promise<Lesson> => {
    const response = await api.post<Lesson>(
      `/courses/sections/${sectionId}/lessons`,
      data,
    );
    return response.data;
  },

  updateLesson: async (
    lessonId: string,
    data: Partial<CreateLessonData>,
  ): Promise<Lesson> => {
    const response = await api.patch<Lesson>(
      `/courses/lessons/${lessonId}`,
      data,
    );
    return response.data;
  },

  deleteLesson: async (lessonId: string) => {
    await api.delete(`/courses/lessons/${lessonId}`);
  },

  reorderSections: async (
    courseId: string,
    sectionIds: string[],
  ): Promise<void> => {
    await api.post(`/courses/${courseId}/sections/reorder`, { sectionIds });
  },

  reorderLessons: async (
    sectionId: string,
    lessonIds: string[],
  ): Promise<void> => {
    await api.post(`/courses/sections/${sectionId}/lessons/reorder`, {
      lessonIds,
    });
  },

  submitForApproval: async (id: string): Promise<Course> => {
    const response = await api.patch<Course>(`/courses/${id}/submit`);
    return response.data;
  },
};
