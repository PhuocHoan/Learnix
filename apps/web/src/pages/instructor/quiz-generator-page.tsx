import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  quizzesApi,
  type Quiz,
  type Question,
} from '@/features/quizzes/api/quizzes-api';

export function QuizGeneratorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lessonText, setLessonText] = useState('');
  const [title, setTitle] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null,
  );

  const generateMutation = useMutation({
    mutationFn: quizzesApi.generateQuiz,
    onSuccess: (data) => {
      setGeneratedQuiz(data);
      void queryClient.invalidateQueries({
        queryKey: ['quizzes', 'my-quizzes'],
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: string;
      data: Partial<Question>;
    }) => quizzesApi.updateQuestion(questionId, data),
    onSuccess: () => {
      if (generatedQuiz) {
        void queryClient.invalidateQueries({
          queryKey: ['quizzes', generatedQuiz.id],
        });
      }
      setEditingQuestion(null);
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: quizzesApi.deleteQuestion,
    onSuccess: () => {
      if (generatedQuiz) {
        void queryClient.invalidateQueries({
          queryKey: ['quizzes', generatedQuiz.id],
        });
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: quizzesApi.approveQuiz,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['quizzes', 'my-quizzes'],
      });
      void navigate('/instructor/quizzes');
    },
  });

  const handleGenerate = () => {
    if (!title || !lessonText) {
      toast.error(
        'Please provide both a quiz title and lesson content to generate questions',
      );
      return;
    }
    generateMutation.mutate({ title, lessonText, numberOfQuestions });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI Quiz Generator</h1>

      {!generatedQuiz ? (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">
              Generate Quiz from Lesson Text
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="quizTitle"
                  className="block text-sm font-medium mb-2"
                >
                  Quiz Title
                </label>
                <input
                  id="quizTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="e.g., Introduction to React Quiz"
                />
              </div>

              <div>
                <label
                  htmlFor="lessonText"
                  className="block text-sm font-medium mb-2"
                >
                  Lesson Text
                </label>
                <textarea
                  id="lessonText"
                  value={lessonText}
                  onChange={(e) => setLessonText(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background min-h-[300px]"
                  placeholder="Paste your lesson content here..."
                />
              </div>

              <div>
                <label
                  htmlFor="numberOfQuestions"
                  className="block text-sm font-medium mb-2"
                >
                  Number of Questions
                </label>
                <input
                  id="numberOfQuestions"
                  type="number"
                  min={3}
                  max={20}
                  value={numberOfQuestions}
                  onChange={(e) =>
                    setNumberOfQuestions(parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="w-full py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {generateMutation.isPending
                  ? 'Generating...'
                  : 'Generate Quiz with AI'}
              </button>

              {generateMutation.isError && (
                <div className="p-3 bg-red-100 text-red-800 rounded-md">
                  Error: {generateMutation.error.message}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  {generatedQuiz.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {generatedQuiz.questions.length} questions generated
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setGeneratedQuiz(null)}
                  className="px-4 py-2 border border-border rounded hover:bg-muted"
                >
                  Start Over
                </button>
                <button
                  onClick={() => approveMutation.mutate(generatedQuiz.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve & Save Quiz
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {generatedQuiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">Question {index + 1}</h3>
                    <div className="space-x-2">
                      <button
                        onClick={() => setEditingQuestion(question)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingQuestionId(question.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mb-3">{question.questionText}</p>
                  <div className="space-y-1">
                    {question.options.map((option, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded ${
                          option.startsWith(`${question.correctAnswer}:`)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-muted'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Question</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="edit-question-text"
                  className="block text-sm font-medium mb-2"
                >
                  Question Text
                </label>
                <textarea
                  defaultValue={editingQuestion.questionText}
                  id="edit-question-text"
                  className="w-full px-3 py-2 rounded-md border border-input"
                  rows={3}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-options"
                  className="block text-sm font-medium mb-2"
                >
                  Options (one per line, format: &quot;A: text&quot;)
                </label>
                <textarea
                  defaultValue={editingQuestion.options.join('\n')}
                  id="edit-options"
                  className="w-full px-3 py-2 rounded-md border border-input"
                  rows={4}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-correct-answer"
                  className="block text-sm font-medium mb-2"
                >
                  Correct Answer (A, B, C, or D)
                </label>
                <input
                  type="text"
                  defaultValue={editingQuestion.correctAnswer}
                  id="edit-correct-answer"
                  maxLength={1}
                  className="w-full px-3 py-2 rounded-md border border-input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const questionText = (
                      document.getElementById(
                        'edit-question-text',
                      ) as HTMLTextAreaElement
                    ).value;
                    const options = (
                      document.getElementById(
                        'edit-options',
                      ) as HTMLTextAreaElement
                    ).value
                      .split('\n')
                      .filter((o) => o.trim());
                    const correctAnswer = (
                      document.getElementById(
                        'edit-correct-answer',
                      ) as HTMLInputElement
                    ).value;

                    updateQuestionMutation.mutate({
                      questionId: editingQuestion.id,
                      data: { questionText, options, correctAnswer },
                    });
                  }}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="flex-1 py-2 border border-border rounded hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuestionId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this question? This action cannot
              be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingQuestionId(null)}
                className="flex-1 py-2 border border-border rounded hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteQuestionMutation.mutate(deletingQuestionId);
                  setDeletingQuestionId(null);
                }}
                className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizGeneratorPage;
