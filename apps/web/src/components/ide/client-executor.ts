// Define types for global libraries loaded via CDN
declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>;
    Babel: any;
    React: any;
    ReactDOM: any;
  }
}

// Singleton to hold the Pyodide instance

// Configuration for common JS libraries
const SUPPORTED_JS_LIBRARIES: Record<
  string,
  { url: string; globalVar: string }
> = {
  lodash: {
    url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
    globalVar: '_',
  },
  moment: {
    url: 'https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js',
    globalVar: 'moment',
  },
  axios: {
    url: 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
    globalVar: 'axios',
  },
  uuid: {
    url: 'https://cdn.jsdelivr.net/npm/uuid@8.3.2/dist/umd/uuid.min.js',
    globalVar: 'uuid',
  },
};

async function loadJsLibrary(name: string) {
  const lib = SUPPORTED_JS_LIBRARIES[name];
  if (!lib) return;

  if ((window as any)[lib.globalVar]) return; // Already loaded

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = lib.url;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`Failed to load library: ${name} `));
    document.head.appendChild(script);
  });
}

/**
 * Executes JavaScript/React code using Babel/eval
 */
async function executeJavaScript(
  code: string,
  _stdin: string,
): Promise<{ stdout: string; stderr: string; Component?: any }> {
  // Capture console.log
  let stdoutBuffer = '';
  // eslint-disable-next-line no-console
  const originalLog = console.log;
  // eslint-disable-next-line no-console
  const originalError = console.error;

  // eslint-disable-next-line no-console
  console.log = (...args) => {
    stdoutBuffer += args.map((a) => String(a)).join(' ') + '\n';
    originalLog(...args);
  };

  // Create a safe(r) execution scope
  // We need to expose React and ReactDOM for the transpiled code
  // Assuming React/ReactDOM are available on window or imported in the context

  // Transform JSX if it looks like React
  let runnableCode = code;

  // Using Babel Standalone for transformation
  if (!window.Babel) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Babel'));
      document.head.appendChild(script);
    });
  }

  try {
    // 1. Scan for imports of supported libraries
    const importRegex =
      /import\s+.*\s+from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g;
    let match;
    const librariesToLoad = new Set<string>();

    while ((match = importRegex.exec(code)) !== null) {
      const libName = match[1] ?? match[2];
      if (libName && SUPPORTED_JS_LIBRARIES[libName]) {
        librariesToLoad.add(libName);
      }
    }

    // 2. Load detected libraries
    await Promise.all(Array.from(librariesToLoad).map(loadJsLibrary));

    // 3. Transpile JSX/ES6
    const transform = window.Babel.transform(code, {
      presets: ['react', 'env'],
      filename: 'main.tsx',
    });
    runnableCode = transform.code;

    // Execute
    // We expect the code to 'export default' a component for React rendering
    // or just run for JS output.
    // To handle 'import', we need to strip them or mock 'require'

    // Very basic 'require' shim
    const requireShim = (module: string) => {
      if (module === 'react') return window.React;
      if (module === 'react-dom') return window.ReactDOM;

      // Check for supported libs
      if (SUPPORTED_JS_LIBRARIES[module]) {
        const globalVar = SUPPORTED_JS_LIBRARIES[module].globalVar;
        return (window as any)[globalVar];
      }

      throw new Error(
        `Module ${module} not found in playground.Supported external modules: ${Object.keys(SUPPORTED_JS_LIBRARIES).join(', ')} `,
      );
    };

    // Construct a function to run the code and return exports
    // We assume the user code might assign to 'exports' or return a value
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const func = new Function(
      'require',
      'React',
      'exports',
      'console',
      runnableCode,
    );
    const exports: any = {};

    // Custom console stub to capture this run's output
    const consoleStub = {
      ...console,
      log: (...args: any[]) => {
        stdoutBuffer += args.join(' ') + '\n';
      },
      error: (...args: any[]) => {
        stdoutBuffer += '[ERROR] ' + args.join(' ') + '\n';
      },
    };

    func(requireShim, window.React, exports, consoleStub);

    // If default export exists, it's likely a component
    const Component = exports.default;

    return { stdout: stdoutBuffer, stderr: '', Component };
  } catch (error: any) {
    return { stdout: stdoutBuffer, stderr: String(error) };
  } finally {
    // eslint-disable-next-line no-console
    console.log = originalLog;
    // eslint-disable-next-line no-console
    console.error = originalError;
  }
}

export async function executeClientSide(
  language: string,
  code: string,
  stdin: string,
): Promise<{ stdout: string; stderr: string; Component?: any }> {
  // Client-side execution for React (if specifically labeled as such)
  // Note: Standard 'javascript'/'typescript' now goes to Piston for Node/Deno execution per user request.
  if (language === 'react') {
    // Check if it has imports or JSX that imply React
    return executeJavaScript(code, stdin);
  }

  // Backend execution for other languages (Python, JS, TS, Java, C++, etc.)
  try {
    const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
    const response = await fetch(`${API_URL}/code-execution/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language,
        sourceCode: code,
        stdin,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message ?? 'Execution failed');
    }

    const result = await response.json();
    return {
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error: any) {
    return { stdout: '', stderr: `Execution Error: ${error.message} ` };
  }
}
