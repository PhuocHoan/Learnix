import { useRef } from 'react';

import MonacoEditor, { type OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  initialValue: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  theme?: 'vs-dark' | 'light';
  readOnly?: boolean;
}

export function CodeEditor({
  initialValue,
  language,
  onChange,
  theme = 'vs-dark',
  readOnly = false,
}: CodeEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    editorRef.current = editor;
  };

  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-border">
      <MonacoEditor
        height="100%"
        width="100%"
        language={language}
        value={initialValue}
        theme={theme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
