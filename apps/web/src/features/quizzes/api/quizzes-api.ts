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
};
