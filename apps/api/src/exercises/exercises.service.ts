import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(ExercisesService.name);
  private readonly pistonApiUrl = 'https://emkc.org/api/v2/piston';

  async executeCode(
    language: string,
    code: string,
    stdin?: string,
  ): Promise<ExecutionResult> {
    try {
      // Prepend Type Shims for JS/TS to avoid Piston compilation errors and provide HackerRank-style helpers
      const commonPolyfills = `
const fs = require('fs');
const _stdin = fs.readFileSync(0, 'utf-8');
const _lines = _stdin.trim().split('\\n');
let _lineIdx = 0;
// Global helpers mimicking HackerRank/CodeForces environment
global.readline = () => _lines[_lineIdx++] || '';
global.print = console.log;
global.STDIN = _stdin;
`;

      let preparedCode = code;

      if (language === 'typescript') {
        const tsShim = `
// Environment Shims
declare var require: any;
declare var process: any;
declare var global: any;
declare var STDIN: string;
declare function readline(): string;
declare function print(...args: any[]): void;

declare module "fs" {
    export function readFileSync(path: any, encoding?: any): any;
    export function writeFileSync(path: any, data: any, encoding?: any): void;
}
declare module "path" {
    export function join(...paths: string[]): string;
}

// Runtime Polyfills
${commonPolyfills}
`;
        preparedCode = `${tsShim}\n${code}`;
      } else if (language === 'javascript') {
        // Just inject runtime polyfills for JS
        preparedCode = `${commonPolyfills}\n${code}`;
      }

      // Basic language mapping if needed. Piston supports most standard names.
      const response = await axios.post(`${this.pistonApiUrl}/execute`, {
        language,
        version: '*', // Use latest available version
        files: [
          {
            content: preparedCode,
          },
        ],
        stdin: stdin ?? '',
      });

      return response.data as ExecutionResult;
    } catch (error) {
      this.logger.error('Code execution failed:', error);
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
