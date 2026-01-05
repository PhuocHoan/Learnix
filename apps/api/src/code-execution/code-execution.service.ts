import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ExecutionRequest {
  language: string;
  sourceCode: string;
  stdin?: string;
}

export interface ExecutionResponse {
  stdout: string;
  stderr: string;
  code: number;
  output: string;
}

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);
  private readonly PISTON_API_URL = 'https://emkc.org/api/v2/piston';

  // Map our language IDs to Piston runtimes
  private readonly LANGUAGE_MAP: Record<
    string,
    { language: string; version: string }
  > = {
    'c++': { language: 'cpp', version: '10.2.0' },
    c: { language: 'c', version: '10.2.0' },
    csharp: { language: 'csharp', version: '6.12.0' },
    java: { language: 'java', version: '15.0.2' },
    rust: { language: 'rust', version: '1.68.2' },
    go: { language: 'go', version: '1.16.2' },
    python: { language: 'python', version: '3.10.0' }, // Fallback/Test
    javascript: { language: 'javascript', version: '18.15.0' }, // Fallback/Test
    typescript: { language: 'typescript', version: '5.0.3' }, // Fallback/Test
  };

  private readonly EXPRESS_MOCK = `
// --- LEARNIX MOCK ENVIRONMENT ---
// This is a simulated environment for Express.js

// Initialize a global store for testing purposes
global.__LEARNIX_MOCK__ = {
    routes: [],
    listening: false,
    port: null
};

// Helper for Instructors to write easy tests
global.LearnixTest = {
    expectRoute: (method, path) => {
        const found = global.__LEARNIX_MOCK__.routes.some(r => 
            r.method === method.toUpperCase() && r.path === path
        );
        if (!found) {
            throw new Error(\`❌ Test Failed: Expected route "\${method.toUpperCase()} \${path}" to be defined, but it was not found.\`);
        }
    },
    expectListening: (port) => {
        if (!global.__LEARNIX_MOCK__.listening) {
            throw new Error("❌ Test Failed: Expected server to be listening (app.listen), but it wasn't called.");
        }
        if (port && global.__LEARNIX_MOCK__.port !== port) {
             throw new Error(\`❌ Test Failed: Expected server to listen on port \${port}, but it is listening on \${global.__LEARNIX_MOCK__.port}.\`);
        }
    }
};

var require = (moduleName) => {
    if (moduleName === 'express') {
        const app = () => ({
            listen: (port, cb) => {
                console.log(\`\\x1b[32m[MOCK SERVER] Server running at http://localhost:\${port}\\x1b[0m\`);
                console.log('\\x1b[33m[NOTE] This is a simulation. No real network port is opened.\\x1b[0m');
                
                global.__LEARNIX_MOCK__.listening = true;
                global.__LEARNIX_MOCK__.port = port;
                
                if (cb) cb();
                return { close: () => {} };
            },
            get: (path, cb) => {
                console.log(\`[MOCK] Registered GET \${path}\`);
                global.__LEARNIX_MOCK__.routes.push({ method: 'GET', path });
            },
            post: (path, cb) => {
                console.log(\`[MOCK] Registered POST \${path}\`);
                global.__LEARNIX_MOCK__.routes.push({ method: 'POST', path });
            },
            put: (path, cb) => {
                console.log(\`[MOCK] Registered PUT \${path}\`);
                global.__LEARNIX_MOCK__.routes.push({ method: 'PUT', path });
            },
            delete: (path, cb) => {
                console.log(\`[MOCK] Registered DELETE \${path}\`);
                global.__LEARNIX_MOCK__.routes.push({ method: 'DELETE', path });
            },
            use: (arg1, arg2) => {
                const path = typeof arg1 === 'string' ? arg1 : '/';
                console.log(\`[MOCK] Registered Middleware on \${path}\`);
                global.__LEARNIX_MOCK__.routes.push({ method: 'USE', path });
            },
            all: (path, cb) => {
                console.log(\`[MOCK] Registered ALL \${path}\`);
                global.__LEARNIX_MOCK__.routes.push({ method: 'ALL', path });
            },
        });
        app.static = () => {};
        app.json = () => {};
        app.urlencoded = () => {};
        return app;
    }
    try {
        return module.require(moduleName);
    } catch (e) {
        console.warn(\`[WARNING] Module '\${moduleName}' not installed in this playground.\`);
        return {};
    }
};
// --------------------------------
`;

  // JS/TS Stdin helpers - defines print() and input() functions like HackerRank
  private readonly JS_STDIN_HELPERS = `
// --- LEARNIX STDIN HELPERS ---
// HackerRank-style print() and input() functions

const __inputLines = (typeof __stdin !== 'undefined' ? __stdin : '').split('\\n');
let __inputIndex = 0;

function input() {
    if (__inputIndex >= __inputLines.length) {
        return '';
    }
    return __inputLines[__inputIndex++];
}

function print(...args) {
    console.log(...args);
}
// --------------------------------
`;

  // TypeScript version with type declarations - using const/arrow to avoid overload issues
  // Note: renamed 'print' to 'println' to avoid conflict with DOM's window.print()
  private readonly TS_STDIN_HELPERS = `
// --- LEARNIX STDIN HELPERS ---
// HackerRank-style println() and input() functions

const __inputLines: string[] = (typeof __stdin !== 'undefined' ? __stdin : '').split('\\n');
let __inputIndex: number = 0;

const input = (): string => {
    if (__inputIndex >= __inputLines.length) {
        return '';
    }
    return __inputLines[__inputIndex++];
};

const println = (...args: any[]): void => {
    console.log(...args);
};
// --------------------------------
`;

  async executeCode(request: ExecutionRequest): Promise<ExecutionResponse> {
    const { language, sourceCode, stdin } = request;
    const config = this.LANGUAGE_MAP[language.toLowerCase()] ?? {
      language,
      version: '*',
    };

    // Use a mutable variable for sourceCode modification
    let originalSourceCode = sourceCode;

    // Inject stdin helpers for JS/TS (print and input functions)
    if (language === 'javascript' || language === 'typescript') {
      // Pass stdin as __stdin variable for the input() function
      const stdinInjection = `const __stdin = ${JSON.stringify(stdin ?? '')};\n`;
      const helpers =
        language === 'typescript'
          ? this.TS_STDIN_HELPERS
          : this.JS_STDIN_HELPERS;
      originalSourceCode = stdinInjection + helpers + '\n' + originalSourceCode;
    }

    // Inject Mock if using Express in JS/TS
    // Regex to detect require('express') with any quote style or spacing
    const expressRegex = /require\s*\(\s*['"]express['"]\s*\)/;

    if (
      (language === 'javascript' || language === 'typescript') &&
      expressRegex.test(sourceCode)
    ) {
      this.logger.log('Injecting Express Mock Shim');
      // We prepend the Express mock to the already-modified code
      originalSourceCode = this.EXPRESS_MOCK + '\n' + originalSourceCode;
    }

    this.logger.log(
      `Executing code for language: ${language} mapped to ${config.language}`,
    );

    try {
      // Define Piston execution result interface locally or use 'any' with care if untyped lib
      interface PistonResponse {
        run: {
          stdout: string;
          stderr: string;
          code: number;
          output: string;
        };
      }

      const response = await axios.post<PistonResponse>(
        `${this.PISTON_API_URL}/execute`,
        {
          language: config.language,
          version: config.version,
          files: [
            {
              content: originalSourceCode,
            },
          ],
          stdin: stdin ?? '',
        },
      );

      const { run } = response.data;

      return {
        stdout: run.stdout,
        stderr: run.stderr,
        code: run.code,
        output: run.output,
      };
    } catch (rawError: unknown) {
      interface AxiosErrorShape {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      }
      const error = rawError as AxiosErrorShape;
      const errorMessage =
        error.response?.data?.message ?? error.message ?? 'Unknown Error';

      this.logger.error(
        `Execution failed: ${errorMessage}`,
        error.response?.data,
      );

      throw new Error(errorMessage);
    }
  }
}
