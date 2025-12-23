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
    execute: async (language: string, code: string): Promise<ExecutionResult> => {
        const response = await api.post<ExecutionResult>('/exercises/execute', { language, code });
        return response.data;
    },

    submit: async (language: string, code: string, expectedOutput: string): Promise<ExecutionResult> => {
        const response = await api.post<ExecutionResult>('/exercises/submit', { language, code, expectedOutput });
        return response.data;
    }
};
