// Client executor for code execution
// React/JSX execution returns iframe src for preview, other languages use backend API

interface ExecutionResult {
  stdout: string;
  stderr: string;
  iframeSrc?: string; // For React preview
}

// Library configuration using Map for type-safe access
const SUPPORTED_JS_LIBRARIES = new Map<
  string,
  { url: string; globalVar: string }
>([
  [
    'lodash',
    {
      url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
      globalVar: '_',
    },
  ],
  [
    'moment',
    {
      url: 'https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js',
      globalVar: 'moment',
    },
  ],
  [
    'axios',
    {
      url: 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
      globalVar: 'axios',
    },
  ],
  [
    'uuid',
    {
      url: 'https://cdn.jsdelivr.net/npm/uuid@8.3.2/dist/umd/uuid.min.js',
      globalVar: 'uuid',
    },
  ],
]);

function createReactPreviewSrc(code: string): string {
  // Detect library imports
  const importRegex =
    /import\s+.*\s+from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g;
  let match: RegExpExecArray | null;
  const libraryScripts: string[] = [];

  while ((match = importRegex.exec(code)) !== null) {
    const libName = match[1] ?? match[2];
    const libConfig = libName ? SUPPORTED_JS_LIBRARIES.get(libName) : null;
    if (libConfig) {
      libraryScripts.push(`<script src="${libConfig.url}"></script>`);
    }
  }

  // Escape the code for embedding in HTML
  const escapedCode = code
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/<\/script>/gi, '<\\/script>');

  // Build iframe content with React and Babel
  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
          * { box-sizing: border-box; }
        </style>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        ${libraryScripts.join('\n')}
      </head>
      <body>
        <div id="root"></div>
        <script>
          window.onerror = function(msg, url, line) {
            document.getElementById('root').innerHTML = '<pre style="color:red;">' + msg + '</pre>';
          };
          
          window.onload = function() {
            try {
              // Strip React/ReactDOM imports
              var codeToTranspile = \`${escapedCode}\`
                .replace(/import\\s+React[^;]*from\\s*['"]react['"];?/g, '')
                .replace(/import\\s+ReactDOM[^;]*from\\s*['"]react-dom['"];?/g, '')
                .replace(/import\\s*{[^}]*}\\s*from\\s*['"]react['"];?/g, '')
                .replace(/import\\s*{[^}]*}\\s*from\\s*['"]react-dom['"];?/g, '');
              
              // Transpile with Babel
              var transpiledCode = Babel.transform(codeToTranspile, {
                presets: ['react', 'env'],
                sourceType: 'module'
              }).code;
              
              // Execute with hooks available
              var exports = {};
              var module = { exports: exports };
              var { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer, memo, forwardRef, createContext } = React;
              (new Function('React', 'ReactDOM', 'exports', 'module', 'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext', 'useReducer', 'memo', 'forwardRef', 'createContext', transpiledCode))(
                React, ReactDOM, exports, module, useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer, memo, forwardRef, createContext
              );
              
              // Find and render component
              var ComponentToRender = 
                exports.default ||
                module.exports.default ||
                (typeof Counter !== 'undefined' ? Counter : null) ||
                (typeof App !== 'undefined' ? App : null);
              
              if (ComponentToRender) {
                ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ComponentToRender));
              } else {
                document.getElementById('root').innerHTML = '<p style="color:gray;">No component to render. Export default a component or define App/Counter.</p>';
              }
            } catch (error) {
              document.getElementById('root').innerHTML = '<pre style="color:red;">' + String(error) + '</pre>';
            }
          };
        </script>
      </body>
    </html>
  `;

  // Create blob URL
  const blob = new Blob([iframeContent], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

export async function executeClientSide(
  language: string,
  code: string,
  stdin: string,
): Promise<ExecutionResult> {
  // Detect if code is React (explicit 'react' language OR imports from 'react')
  const isReactCode =
    language === 'react' ||
    ((language === 'javascript' || language === 'typescript') &&
      /import\s+.*\s+from\s+['"]react['"]/.test(code));

  // Client-side execution for React - return iframe src for preview
  if (isReactCode) {
    const iframeSrc = createReactPreviewSrc(code);
    return {
      stdout: '[React Preview] Component rendered in preview tab',
      stderr: '',
      iframeSrc,
    };
  }

  // Backend execution for other languages (Python, JS, TS, Java, C++, etc.)
  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

  try {
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
      const errorData: { message?: string } = await response.json();
      throw new Error(errorData.message ?? 'Execution failed');
    }

    const result: { stdout: string; stderr: string } = await response.json();
    return {
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown execution error';
    return { stdout: '', stderr: `Execution Error: ${errorMessage}` };
  }
}
