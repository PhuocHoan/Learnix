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

  async executeCode(
    language: string,
    code: string,
    stdin?: string,
  ): Promise<ExecutionResult> {
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
        stdin: stdin ?? '',
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
    expectedOutput?: string,
    testCode?: string,
  ): Promise<{ success: boolean; output: string }> {
    // If testCode is provided, we use Unit Test Grading (append testCode to source)
    if (testCode) {
      // For compiled languages like Java/C++, simply concatenating might fail if imports/main function structure matches wrong.
      // But for interpreted languages (JS/Python), concatenation works well for basic script-based testing.
      // For checking logic, we rely on the testCode throwing an error (exit code != 0) on failure.

      const fullCode = `${code}\n\n${testCode}`;
      const result = await this.executeCode(language, fullCode);

      const actualOutput = result.run.output.trim();
      // Success if exit code is 0.
      // Piston returns run.code. 0 = success, 1 = error/crash.
      const success = result.run.code === 0;

      return {
        success,
        output: actualOutput,
      };
    }

    // Fallback to legacy String Matching
    if (expectedOutput !== undefined) {
      const result = await this.executeCode(language, code);
      const actualOutput = result.run.output.trim();
      const expected = expectedOutput.trim();

      const success = actualOutput === expected;

      return {
        success,
        output: actualOutput,
      };
    }

    // No validation criteria provided
    return { success: false, output: 'No validation criteria provided' };
  }
}
