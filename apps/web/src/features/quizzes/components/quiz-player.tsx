import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, ArrowRight, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { quizzesApi, type Quiz, type QuizSubmission } from '../api/quizzes-api';

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete?: () => void;
}

export function QuizPlayer({ quiz, onComplete }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isRetaking, setIsRetaking] = useState(false);
  const queryClient = useQueryClient();

  const questions = quiz.questions || [];
  // eslint-disable-next-line security/detect-object-injection
  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex / questions.length) * 100;

  const { data: submission, isLoading: isLoadingSubmission } = useQuery({
    queryKey: ['quiz-submission', quiz.id],
    queryFn: () => quizzesApi.getSubmission(quiz.id),
  });

  // Resume quiz from saved responses if not completed
  const [responsesLoaded, setResponsesLoaded] = useState(false);
  if (
    submission &&
    !submission.completedAt &&
    !responsesLoaded &&
    !isLoadingSubmission &&
    !isRetaking
  ) {
    setAnswers(submission.responses || {});
    setResponsesLoaded(true);
  }

  const saveProgressMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      quizzesApi.saveProgress(quiz.id, data),
    onSuccess: () => {
      // Optional: visual indicator of saved
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      quizzesApi.submitQuiz(quiz.id, data),
    onSuccess: () => {
      toast.success('Quiz submitted successfully!');
      void queryClient.invalidateQueries({
        queryKey: ['quiz-submission', quiz.id],
      });
      setIsRetaking(false);
      if (onComplete) {
        onComplete();
      }
    },
    onError: () => {
      toast.error(
        'Unable to submit your quiz. Please check your connection and try again.',
      );
    },
  });

  const handleOptionSelect = (value: string) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };
    setAnswers(newAnswers);

    // Auto-save progress
    saveProgressMutation.mutate({ [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Submit
      submitMutation.mutate(answers);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsRetaking(true);
    setResponsesLoaded(false);
    // We set isRetaking to true which hides the result view.
    // We don't need to clear the backend submission yet,
    // simply starting new answers and submitting will create/overwrite as needed.
  };

  // If we have a COMPLETED submission and are not retaking, show results
  if (submission?.completedAt && !isRetaking && !isLoadingSubmission) {
    return (
      <QuizResultView
        quiz={quiz}
        submission={submission}
        onRetake={handleRetake}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          This quiz has no questions.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>{quiz.title}</CardTitle>
          <div className="flex items-center gap-4">
            {saveProgressMutation.isPending && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Saving...
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-medium">
            {currentQuestion.questionText}
          </h3>

          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={handleOptionSelect}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => {
              const letter = String.fromCharCode(65 + index);
              return (
                <label
                  key={index}
                  className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={letter} id={`option-${index}`} />
                  <span className="flex-grow cursor-pointer font-normal text-sm leading-none">
                    <span className="font-semibold mr-2">{letter}.</span>{' '}
                    {option}
                  </span>
                </label>
              );
            })}
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() =>
            setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
          }
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!answers[currentQuestion.id]}>
          {currentQuestionIndex === questions.length - 1 &&
            submitMutation.isPending &&
            'Submitting...'}
          {currentQuestionIndex === questions.length - 1 &&
            !submitMutation.isPending &&
            'Submit Quiz'}
          {currentQuestionIndex < questions.length - 1 && (
            <>
              Next Question <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function QuizResultView({
  quiz,
  submission,
  onRetake,
}: {
  quiz: Quiz;
  submission: QuizSubmission;
  onRetake: () => void;
}) {
  const isPass = submission.percentage >= 70; // Hardcoded pass threshold for now

  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto">
      <Card
        className={
          isPass
            ? 'border-green-500/20 bg-green-50/10'
            : 'border-red-500/20 bg-red-50/10'
        }
      >
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-4xl font-bold">
            {Math.round(submission.percentage)}%
          </div>
          <p className="text-muted-foreground">
            You scored {submission.score} out of {submission.totalPoints} points
          </p>
          <div className="flex justify-center">
            <Button onClick={onRetake} variant="outline">
              <RefreshCcw className="mr-2 w-4 h-4" />
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Review Answers</h3>
        {quiz.questions.map((question, index) => {
          const userAnswer = submission.responses[question.id];
          const isCorrect = userAnswer === question.correctAnswer;

          return (
            <Card
              key={question.id}
              className={isCorrect ? 'border-green-200' : 'border-red-200'}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="font-medium">
                    {index + 1}. {question.questionText}
                  </div>
                  {isCorrect ? (
                    <div className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-medium">
                      <Check className="w-3 h-3 mr-1" /> Correct
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-medium">
                      <X className="w-3 h-3 mr-1" /> Incorrect
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-2 text-sm space-y-2">
                <div className="grid gap-2">
                  {question.options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = userAnswer === letter;
                    const isTheCorrectAnswer =
                      question.correctAnswer === letter;

                    let className =
                      'p-3 rounded border flex justify-between items-center';
                    if (isTheCorrectAnswer) {
                      className +=
                        ' bg-green-50 border-green-200 text-green-900';
                    } else if (isSelected && !isCorrect) {
                      className += ' bg-red-50 border-red-200 text-red-900';
                    } else {
                      className += ' border-transparent bg-muted/30';
                    }

                    return (
                      <div key={i} className={className}>
                        <span>
                          <span className="font-semibold">{letter}.</span> {opt}
                        </span>
                        {isTheCorrectAnswer && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                        {isSelected && !isCorrect && (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
                {question.explanation && !isCorrect && (
                  <div className="mt-4 p-3 bg-blue-50 text-blue-900 rounded text-xs">
                    <span className="font-semibold">Explanation:</span>{' '}
                    {question.explanation}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
