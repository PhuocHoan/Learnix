import { api } from '@/lib/api';

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  position: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'ai_generated' | 'approved';
  aiGenerated: boolean;
  questions: Question[];
  createdAt: string;
}

export interface GenerateQuizRequest {
  lessonText: string;
  numberOfQuestions: number;
  title: string;
}

export interface CreateQuizData {
  title: string;
  description?: string;
  lessonId: string;
  courseId?: string;
}

export interface CreateQuestionData {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  responses: Record<string, string>;
  completedAt: string;
}

export interface SubmitQuizRequest {
  answers: Record<string, string>;
}

export const quizzesApi = {
  createQuiz: async (data: CreateQuizData): Promise<Quiz> => {
    const response = await api.post<Quiz>('/quizzes', data);
    return response.data;
  },

  createQuestion: async (
    quizId: string,
    data: CreateQuestionData,
  ): Promise<Question> => {
    const response = await api.post<Question>(
      `/quizzes/${quizId}/questions`,
      data,
    );
    return response.data;
  },

  getQuizByLessonId: async (lessonId: string): Promise<Quiz> => {
    const response = await api.get<Quiz>(`/quizzes/by-lesson/${lessonId}`);
    return response.data;
  },

  generateQuiz: async (data: GenerateQuizRequest): Promise<Quiz> => {
    const response = await api.post<Quiz>('/quizzes/generate', data);
    return response.data;
  },

  getMyQuizzes: async (): Promise<Quiz[]> => {
    const response = await api.get<Quiz[]>('/quizzes/my-quizzes');
    return response.data;
  },

  getQuiz: async (id: string): Promise<Quiz> => {
    const response = await api.get<Quiz>(`/quizzes/${id}`);
    return response.data;
  },

  approveQuiz: async (id: string): Promise<Quiz> => {
    const response = await api.patch<Quiz>(`/quizzes/${id}/approve`);
    return response.data;
  },

  updateQuestion: async (
    questionId: string,
    data: Partial<Question>,
  ): Promise<Question> => {
    const response = await api.patch<Question>(
      `/quizzes/questions/${questionId}`,
      data,
    );
    return response.data;
  },

  deleteQuestion: async (questionId: string): Promise<void> => {
    await api.delete(`/quizzes/questions/${questionId}`);
  },

  reorderQuestions: async (
    quizId: string,
    questionIds: string[],
  ): Promise<void> => {
    await api.patch(`/quizzes/${quizId}/reorder-questions`, { questionIds });
  },

  submitQuiz: async (
    quizId: string,
    answers: Record<string, string>,
  ): Promise<QuizSubmission> => {
    const response = await api.post<QuizSubmission>(`/quizzes/${quizId}/submit`, {
      answers,
    });
    return response.data;
  },

  saveProgress: async (
    quizId: string,
    answers: Record<string, string>,
  ): Promise<QuizSubmission> => {
    const response = await api.post<QuizSubmission>(
      `/quizzes/${quizId}/save-progress`,
      { answers },
    );
    return response.data;
  },

  getSubmission: async (quizId: string): Promise<QuizSubmission | null> => {
    try {
      const response = await api.get<QuizSubmission | null>(
        `/quizzes/${quizId}/submission`,
      );
      return response.data ?? null;
    } catch (error) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
