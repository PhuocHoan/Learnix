import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import axios from 'axios';

export interface ExecutionResult {
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  language: string;
  version: string;
}

@Injectable()
export class ExercisesService {
  private readonly pistonApiUrl = 'https://emkc.org/api/v2/piston';

  async executeCode(language: string, code: string): Promise<ExecutionResult> {
    try {
      // Basic language mapping if needed. Piston supports most standard names.
      const response = await axios.post(`${this.pistonApiUrl}/execute`, {
        language,
        version: '*', // Use latest available version
        files: [
          {
            content: code,
          },
        ],
      });

      return response.data as ExecutionResult;
    } catch (error) {
      console.error('Code execution failed:', error);
      throw new HttpException(
        'Failed to execute code service',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async validateSubmission(
    language: string,
    code: string,
    expectedOutput: string,
  ): Promise<{ success: boolean; output: string }> {
    const result = await this.executeCode(language, code);
    const actualOutput = result.run.output.trim();
    const expected = expectedOutput.trim();

    const success = actualOutput === expected;

    return {
      success,
      output: actualOutput,
    };
  }
}
