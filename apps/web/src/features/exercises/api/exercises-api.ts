import { api } from '@/lib/api';

export interface ExecutionResult {
  run: {
    stdout: string;
    stderr: string;
    code: number;
    output: string;
  };
  language: string;
  version: string;
}

export const exercisesApi = {
  execute: async (
    language: string,
    code: string,
    stdin?: string,
  ): Promise<ExecutionResult> => {
    const response = await api.post<ExecutionResult>('/exercises/execute', {
      language,
      code,
      stdin,
    });
    return response.data;
  },

  submit: async (
    language: string,
    code: string,
    expectedOutput?: string,
    testCode?: string,
  ): Promise<ExecutionResult> => {
    const response = await api.post<ExecutionResult>('/exercises/submit', {
      language,
      code,
      expectedOutput,
      testCode,
    });
    return response.data;
  },
};
