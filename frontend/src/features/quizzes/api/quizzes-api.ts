import { api } from "@/lib/api";

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  status: "draft" | "ai_generated" | "approved";
  aiGenerated: boolean;
  questions: Question[];
  createdAt: string;
}

export interface GenerateQuizRequest {
  lessonText: string;
  numberOfQuestions: number;
  title: string;
}

export const quizzesApi = {
  generateQuiz: async (data: GenerateQuizRequest): Promise<Quiz> => {
    const response = await api.post("/quizzes/generate", data);
    return response.data;
  },

  getMyQuizzes: async (): Promise<Quiz[]> => {
    const response = await api.get("/quizzes/my-quizzes");
    return response.data;
  },

  getQuiz: async (id: string): Promise<Quiz> => {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  approveQuiz: async (id: string): Promise<Quiz> => {
    const response = await api.patch(`/quizzes/${id}/approve`);
    return response.data;
  },

  updateQuestion: async (
    questionId: string,
    data: Partial<Question>,
  ): Promise<Question> => {
    const response = await api.patch(`/quizzes/questions/${questionId}`, data);
    return response.data;
  },

  deleteQuestion: async (questionId: string): Promise<void> => {
    await api.delete(`/quizzes/questions/${questionId}`);
  },
};
