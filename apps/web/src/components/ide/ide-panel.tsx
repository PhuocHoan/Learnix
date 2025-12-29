import { useCallback, useEffect, useState, useRef } from 'react';

import { HelpCircle, Loader2, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exercisesApi } from '@/features/exercises/api/exercises-api';
import { cn } from '@/lib/utils';

import { CodeEditor } from './code-editor';

import type { OnMount } from '@monaco-editor/react';

const STORAGE_KEY_PREFIX = 'ide_progress_';

const STDIN_INSTRUCTIONS = new Map<string, string>([
  ['python', 'Tip: input() reads one line at a time.'],
  ['javascript', "Tip: Use 'readline()' to read input line-by-line."],
  ['typescript', "Tip: Use 'readline()' to read input line-by-line."],
  [
    'java',
    'Tip: Scanner(System.in) reads token-by-token (space/newline separated).',
  ],
  ['cpp', 'Tip: std::cin >> var reads token-by-token.'],
  ['go', 'Tip: fmt.Scan(&var) reads space-separated values.'],
  ['rust', 'Tip: std::io::stdin() reads input.'],
  ['csharp', 'Tip: Console.ReadLine() reads standard input.'],
]);

interface IdePanelProps {
  allowedLanguages: {
    language: string;
    initialCode: string;
    expectedOutput?: string;
  }[];
  defaultLanguage: string;
  onSuccess?: () => void;
  lessonId: string;
}

export function IdePanel({
  allowedLanguages,
  defaultLanguage,
  onSuccess,
  lessonId,
}: IdePanelProps) {
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const clearMarkers = useCallback(() => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'piston', []);
      }
    }
  }, []);

  const setMarkers = useCallback(
    (stderr: string) => {
      if (!monacoRef.current || !editorRef.current) {
        return;
      }
      const model = editorRef.current.getModel();
      if (!model) {
        return;
      }

      const markers: any[] = [];
      const lines = stderr.split('\n');

      lines.forEach((line) => {
        let match;
        // Common pattern: filename:line:col or filename:line
        // Python uses "line X"
        if (currentLanguage === 'python') {
          match = /line (\d+)/.exec(line);
        } else {
          // Standard: :5:10: or :5:
          match = /:(\d+):(\d+):/.exec(line) ?? /:(\d+):/.exec(line);
        }

        if (match) {
          const lineNum = parseInt(match[1]);
          const colNum = match[2] ? parseInt(match[2]) : 1;
          markers.push({
            startLineNumber: lineNum,
            startColumn: colNum,
            endLineNumber: lineNum,
            endColumn: model.getLineMaxColumn(lineNum),
            message: line.trim(),
            severity: 8, // MarkerSeverity.Error
          });
        }
      });

      if (markers.length > 0) {
        monacoRef.current.editor.setModelMarkers(model, 'piston', markers);
      }
    },
    [currentLanguage],
  );

  // Find config for current language
  const currentConfig =
    allowedLanguages.find((l) => l.language === currentLanguage) ??
    allowedLanguages[0];

  // Load from local storage or use initial code
  const getSavedCode = useCallback(
    (lang: string) => {
      try {
        const saved = localStorage.getItem(
          `${STORAGE_KEY_PREFIX}${lessonId}_${lang}`,
        );
        return saved ?? null;
      } catch {
        return null;
      }
    },
    [lessonId],
  );

  const [code, setCode] = useState(
    () => getSavedCode(currentLanguage) ?? currentConfig?.initialCode ?? '',
  );

  // Save to local storage on change
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${lessonId}_${currentLanguage}`,
        code,
      );
    }, 1000);
    return () => clearTimeout(handler);
  }, [code, currentLanguage, lessonId]);

  // Handle language switch
  useEffect(() => {
    clearMarkers();
    const saved = getSavedCode(currentLanguage);
    if (saved !== null) {
      setCode(saved);
    } else {
      const config = allowedLanguages.find(
        (l) => l.language === currentLanguage,
      );
      if (config) {
        setCode(config.initialCode);
      }
    }
  }, [currentLanguage, allowedLanguages, lessonId, getSavedCode, clearMarkers]);

  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<
    'success' | 'error' | null
  >(null);
  const [stdin, setStdin] = useState('');
  const [activeTab, setActiveTab] = useState<'output' | 'input'>('output');

  const handleRun = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    setOutput('');
    // Switch to output tab on run
    setActiveTab('output');

    try {
      const resultData = await exercisesApi.execute(
        currentLanguage,
        code,
        stdin,
      );
      // Safe access assuming structure
      const result = resultData.run;
      const combinedOutput = (
        String(result.stdout ?? '') + String(result.stderr ?? '')
      ).trim();
      setOutput(combinedOutput);

      if (currentConfig?.expectedOutput) {
        if (combinedOutput === currentConfig.expectedOutput.trim()) {
          setExecutionResult('success');
          clearMarkers();
          toast.success('Correct output!');
          onSuccess?.();
        } else {
          setExecutionResult('error');
          toast.warning('Output does not match expected result.');
        }
      } else if (result.code === 0) {
        // Fallback or explicit Unit Test logic relies on exit code if no string match is set
        setExecutionResult('success');
        clearMarkers();
      } else {
        setExecutionResult('error');
        if (result.stderr) {
          setMarkers(result.stderr);
        }
      }
    } catch (_error) {
      // Error is handled by UI toast and output display
      setOutput('Error connecting to execution service.');
      setExecutionResult('error');
      toast.error('Failed to run code.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    clearMarkers();
    const resetCode = currentConfig?.initialCode ?? '';
    setCode(resetCode);
    localStorage.removeItem(
      `${STORAGE_KEY_PREFIX}${lessonId}_${currentLanguage}`,
    );
    setOutput('');
    setExecutionResult(null);
    setStdin('');
  };

  return (
    <div className="flex flex-col h-full border-l border-border bg-card">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          {allowedLanguages.length > 1 ? (
            <Select
              value={currentLanguage}
              onValueChange={(val) => {
                setCurrentLanguage(val);
                setOutput('');
                setExecutionResult(null);
              }}
            >
              <SelectTrigger className="w-[140px] h-8 bg-transparent border-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 px-2 text-sm font-semibold capitalize">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {allowedLanguages.map((l) => (
                  <SelectItem
                    key={l.language}
                    value={l.language}
                    className="capitalize"
                  >
                    {l.language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm font-semibold capitalize">
              {currentLanguage}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isRunning}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => void handleRun()}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            )}
            Run
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-rows-[1fr_auto]">
        <div className="min-h-0 relative">
          <CodeEditor
            id={`student-${lessonId}`}
            initialValue={code}
            language={currentLanguage}
            onChange={(val) => setCode(val ?? '')}
            onMount={handleEditorMount}
          />
        </div>

        <div className="h-64 border-t border-border flex flex-col bg-[#0d1117] font-mono text-sm relative">
          {/* Tabs Header */}
          <div className="flex items-center px-4 bg-[#161b22] border-b border-[#30363d]">
            <button
              onClick={() => setActiveTab('output')}
              className={`px-4 py-2 text-xs font-bold transition-all relative ${
                activeTab === 'output'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              CONSOLE OUTPUT
              {activeTab === 'output' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`px-4 py-2 text-xs font-bold transition-all relative ${
                activeTab === 'input'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              INPUT (STDIN)
              {activeTab === 'input' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </button>

            <div className="flex-1" />

            {executionResult && activeTab === 'output' && (
              <div
                className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border ${
                  executionResult === 'success'
                    ? 'text-green-400 bg-green-500/10 border-green-500/20'
                    : 'text-red-400 bg-red-500/10 border-red-500/20'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${executionResult === 'success' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
                />
                {executionResult === 'success' ? 'SUCCESS' : 'EXECUTION ERROR'}
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto custom-scrollbar bg-[#0d1117]">
            {activeTab === 'output' ? (
              <div className="h-full w-full overflow-y-auto custom-scrollbar relative">
                {isRunning && (
                  <div className="absolute inset-0 bg-[#0d1117]/80 flex items-center justify-center z-10 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                )}

                {output ? (
                  <pre className="p-4 text-gray-300 w-full whitespace-pre-wrap break-words leading-relaxed selection:bg-primary/30 font-mono text-sm">
                    {output}
                  </pre>
                ) : (
                  !isRunning && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30 select-none">
                      <Play className="w-8 h-8" />
                      <span className="text-xs uppercase tracking-widest font-bold">
                        Waiting for execution...
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full bg-[#0d1117]">
                <div
                  className={cn(
                    'flex items-start gap-3 p-3 border-b',
                    currentLanguage === 'typescript'
                      ? 'bg-amber-500/10 border-amber-500/20'
                      : 'bg-blue-500/5 border-blue-500/10',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
                      currentLanguage === 'typescript'
                        ? 'bg-amber-500/20'
                        : 'bg-blue-500/20',
                    )}
                  >
                    <HelpCircle
                      className={cn(
                        'w-3 h-3',
                        currentLanguage === 'typescript'
                          ? 'text-amber-400'
                          : 'text-blue-400',
                      )}
                    />
                  </div>
                  <p
                    className={cn(
                      'text-[11px] leading-snug font-medium',
                      currentLanguage === 'typescript'
                        ? 'text-amber-200/90'
                        : 'text-blue-300/80',
                    )}
                  >
                    {currentLanguage === 'typescript' && (
                      <span className="text-amber-400 font-bold mr-1">
                        NOTE:
                      </span>
                    )}
                    {STDIN_INSTRUCTIONS.get(currentLanguage) ??
                      'Enter standard input here for your program components.'}
                  </p>
                </div>
                <textarea
                  className="flex-1 w-full bg-transparent text-gray-200 p-4 outline-none resize-none placeholder:text-gray-600 font-mono text-sm leading-relaxed overflow-y-auto"
                  placeholder="Paste your input data here..."
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
