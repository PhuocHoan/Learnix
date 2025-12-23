import { useCallback, useEffect, useState } from 'react';

import { Loader2, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { exercisesApi } from '@/features/exercises/api/exercises-api';

import { CodeEditor } from './code-editor';

const STORAGE_KEY_PREFIX = 'ide_progress_';

const STDIN_INSTRUCTIONS: Record<string, string> = {
  python: 'Tip: input() reads one line at a time.',
  javascript: "Tip: Use 'fs.readFileSync(0, 'utf-8')' to read all input.",
  typescript: "Tip: Use 'fs.readFileSync(0, 'utf-8')' to read all input.",
  java: 'Tip: Scanner(System.in) reads token-by-token (space/newline separated).',
  cpp: 'Tip: std::cin >> var reads token-by-token.',
  go: 'Tip: fmt.Scan(&var) reads space-separated values.',
  rust: 'Tip: std::io::stdin() reads input.',
};

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
  }, [currentLanguage, allowedLanguages, lessonId, getSavedCode]);

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
          toast.success('Correct output!');
          onSuccess?.();
        } else {
          setExecutionResult('error');
          toast.warning('Output does not match expected result.');
        }
      } else if (result.code === 0) {
        // Fallback or explicit Unit Test logic relies on exit code if no string match is set
        setExecutionResult('success');
      } else {
        setExecutionResult('error');
      }
    } catch (error) {
      console.error('Execution error:', error);
      setOutput('Error connecting to execution service.');
      setExecutionResult('error');
      toast.error('Failed to run code.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
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
            <select
              className="bg-transparent text-sm font-semibold capitalize outline-none cursor-pointer hover:text-primary transition-colors pr-2"
              value={currentLanguage}
              onChange={(e) => {
                setCurrentLanguage(e.target.value);
                setOutput('');
                setExecutionResult(null);
              }}
            >
              {allowedLanguages.map((l) => (
                <option
                  key={l.language}
                  value={l.language}
                  className="bg-popover text-popover-foreground"
                >
                  {l.language}
                </option>
              ))}
            </select>
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
          <Button size="sm" onClick={handleRun} disabled={isRunning}>
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
        <div className="min-h-0">
          <CodeEditor
            initialValue={code}
            language={currentLanguage}
            onChange={(val) => setCode(val ?? '')}
          />
        </div>

        <div className="h-48 border-t border-border flex flex-col bg-black font-mono text-sm">
          {/* Tabs Header */}
          <div className="flex items-center px-2 bg-white/10 border-b border-white/10">
            <button
              onClick={() => setActiveTab('output')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === 'output'
                ? 'text-white border-b-2 border-primary'
                : 'text-white/50 hover:text-white'
                }`}
            >
              Console Output
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === 'input'
                ? 'text-white border-b-2 border-primary'
                : 'text-white/50 hover:text-white'
                }`}
            >
              Input (Stdin)
            </button>

            <div className="flex-1" />

            {executionResult && activeTab === 'output' && (
              <span
                className={`text-xs px-2 ${executionResult === 'success'
                  ? 'text-green-400'
                  : 'text-red-400'
                  }`}
              >
                {executionResult === 'success' ? '✓ Success' : '✕ Failed'}
              </span>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto relative flex flex-col">
            {activeTab === 'output' ? (
              <pre className="p-3 text-white h-full w-full">
                {output || (
                  <span className="text-white/30 italic">
                    Run code to see output...
                  </span>
                )}
              </pre>
            ) : (
              <div className="flex flex-col h-full">
                <div className="text-[10px] text-white/50 px-3 py-1 border-b border-white/10 bg-white/5">
                  {/* eslint-disable-next-line security/detect-object-injection */}
                  {STDIN_INSTRUCTIONS[currentLanguage] ||
                    'Enter standard input here...'}
                </div>
                <textarea
                  className="w-full h-full bg-transparent text-white p-3 outline-none resize-none placeholder:text-white/30 font-mono text-xs"
                  placeholder="Input data..."
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
