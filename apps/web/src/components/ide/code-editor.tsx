import { useRef } from 'react';

import MonacoEditor, { type OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  initialValue: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  theme?: 'vs-dark' | 'light';
  readOnly?: boolean;
  onMount?: OnMount;
  id?: string;
}

export function CodeEditor({
  initialValue,
  language,
  onChange,
  theme = 'vs-dark',
  readOnly = false,
  onMount,
  id = 'default',
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure TS/JS defaults globally for this monaco instance
    // These only need to be set once, but setting them on mount ensures they are ready
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Configure Node.js environment types for TS/JS
    // Includes Learnix stdin helpers: input(), print() (JS), println() (TS)
    const nodeLibs = `
      declare var STDIN: string;
      declare function readline(): string;
      
      // Learnix stdin helpers
      declare function input(): string;
      declare function print(...args: any[]): void;
      declare function println(...args: any[]): void;

      declare module "fs" {
        export function readFileSync(path: number | string, options?: any): any;
        export function writeFileSync(path: string, data: any, options?: any): void;
      }
      declare module "path" {
         export function join(...paths: string[]): string;
      }
    `;

    // Set for both TS and JS
    const libUri = 'ts:filename/node-env.d.ts';
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      nodeLibs,
      libUri,
    );
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      nodeLibs,
      libUri,
    );

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      checkJs: true,
      allowJs: true,
      lib: ['esnext', 'dom', 'es2015'],
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowSyntheticDefaultImports: true,
      baseUrl: '.',
    });

    // Enable validation but ignore specific "missing module" errors common in web-ide
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    onMount?.(editor, monaco);
  };

  return (
    <div className="h-full w-full rounded-md border border-border relative z-0">
      <MonacoEditor
        height="100%"
        width="100%"
        language={language}
        value={initialValue}
        theme={theme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        path={`file:///${id}-${language}.${language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : language}`}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          padding: { top: 16, bottom: 16 },
          automaticLayout: true,
          fixedOverflowWidgets: true,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          lineNumbersMinChars: 3,
          wordWrap: 'off',
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabSize: 4,
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
          parameterHints: {
            enabled: true,
          },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            horizontalScrollbarSize: 10,
            verticalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
}
