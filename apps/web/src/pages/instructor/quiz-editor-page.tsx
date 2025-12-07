import { useEffect, useState } from 'react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  MoreVertical,
  GripVertical,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { PageContainer } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { quizzesApi, type Question } from '@/features/quizzes/api/quizzes-api';
import { cn } from '@/lib/utils';

const questionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).min(2, 'At least 2 options are required'),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().optional(),
  points: z.number().min(0, 'Points must be positive').default(1),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function QuizEditorPage() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 1. Fetch Lesson to get title (optional but nice)
  // We skip fetching lesson for now as we focus on quiz.

  // 2. Fetch Quiz by Lesson ID
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', 'lesson', lessonId],
    queryFn: async () => {
      if (!lessonId) {
        return null;
      }
      try {
        return await quizzesApi.getQuizByLessonId(lessonId);
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        if ((err as any)?.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: Boolean(lessonId),
  });

  const createQuizMutation = useMutation({
    mutationFn: (data: { title: string; lessonId: string }) =>
      quizzesApi.createQuiz(data),
    onSuccess: (newQuiz) => {
      queryClient.setQueryData(['quiz', 'lesson', lessonId], newQuiz);
    },
  });

  useEffect(() => {
    if (quiz?.questions) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrderedQuestions(quiz.questions);
    }
  }, [quiz?.questions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Trigger API call to save order
        if (quiz) {
          const ids = newItems.map((q: Question) => q.id);
          void quizzesApi.reorderQuestions(quiz.id, ids).catch(() => {
            toast.error('Failed to save order');
            void queryClient.invalidateQueries({
              queryKey: ['quiz', 'lesson', lessonId],
            });
          });
        }

        return newItems;
      });
    }
  };

  if (isLoading || (quiz === null && createQuizMutation.isPending)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/instructor/courses/${courseId}/edit`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
        <div className="flex-1">
          {isEditingTitle ? (
            <Input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              defaultValue={quiz?.title}
              onBlur={(e) => {
                setIsEditingTitle(false);
                if (quiz && e.target.value !== quiz.title) {
                  // Update quiz title logic here (not implemented yet in API)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="text-2xl font-bold cursor-pointer hover:underline decoration-dashed underline-offset-4 bg-transparent border-none p-0 text-left"
              onClick={() => setIsEditingTitle(true)}
            >
              {quiz?.title ?? 'Untitled Quiz'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Questions</h2>
          <Button onClick={() => setEditingQuestionId('new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        {editingQuestionId === 'new' && (
          <QuestionEditor
            quizId={quiz?.id ?? ''}
            onCancel={() => setEditingQuestionId(null)}
            onSave={() => {
              setEditingQuestionId(null);
              void queryClient.invalidateQueries({
                queryKey: ['quiz', 'lesson', lessonId],
              });
            }}
          />
        )}

        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedQuestions}
              strategy={verticalListSortingStrategy}
            >
              {orderedQuestions.map((question, index) => (
                <SortableQuestionItem
                  key={question.id}
                  question={question}
                  index={index}
                  isEditing={editingQuestionId === question.id}
                  onEdit={() => setEditingQuestionId(question.id)}
                  onDelete={() => {}}
                  onCancel={() => setEditingQuestionId(null)}
                  onSave={() => {
                    setEditingQuestionId(null);
                    void queryClient.invalidateQueries({
                      queryKey: ['quiz', 'lesson', lessonId],
                    });
                  }}
                  quizId={quiz?.id ?? ''}
                />
              ))}
            </SortableContext>
          </DndContext>
          {quiz?.questions?.length === 0 && !editingQuestionId && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
              <p className="text-muted-foreground mb-4">No questions yet</p>
              <Button
                variant="outline"
                onClick={() => setEditingQuestionId('new')}
              >
                Create your first question
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function SortableQuestionItem({
  question,
  index,
  isEditing,
  onEdit,
  onDelete,
  onCancel,
  onSave,
  quizId,
}: {
  question: Question;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
  quizId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isEditing) {
    // Editing mode - no drag handle on the card itself, maybe disable drag?
    // We can just render the editor directly without sortable wrapper or with it but disabled
    return (
      <div ref={setNodeRef} style={style} className="mb-4">
        <QuestionEditor
          quizId={quizId}
          question={question}
          onCancel={onCancel}
          onSave={onSave}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between py-4">
          <div className="flex gap-4">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center justify-center h-8 cursor-move text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
              {index + 1}
            </div>
            <div>
              <p className="font-medium mb-2">{question.questionText}</p>
              <div className="flex gap-2">
                <Badge variant="secondary">{question.points || 1} points</Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {question.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i); // A, B, C...
              const isSelectedCorrect = question.correctAnswer === letter;

              return (
                <div
                  key={i}
                  className={cn(
                    'p-3 rounded-lg border text-sm',
                    isSelectedCorrect
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-border bg-background',
                  )}
                >
                  <span className="font-semibold mr-2">{letter}:</span>
                  {opt}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionEditor({
  quizId,
  question,
  onCancel,
  onSave,
}: {
  quizId: string;
  question?: Question;
  onCancel: () => void;
  onSave: () => void;
}) {
  const isNew = !question;
  const form = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: question?.questionText ?? '',
      options: question?.options ?? ['', '', '', ''],
      correctAnswer: question?.correctAnswer ?? 'A',
      explanation: question?.explanation ?? '',
      points: question?.points ?? 1,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: QuestionFormData) => {
      if (isNew) {
        return quizzesApi.createQuestion(quizId, data);
      }
      if (!question) {
        return Promise.reject(new Error('Question is missing'));
      }
      return quizzesApi.updateQuestion(question.id, data);
    },
    onSuccess: () => {
      toast.success('Question saved');
      onSave();
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    mutation.mutate(data);
  };

  const [showImageUpload, setShowImageUpload] = useState(false);

  return (
    <Card className="border-primary">
      <CardContent className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium" htmlFor="question-text">
                Question Text
              </label>
              <div className="flex items-center gap-2">
                <label
                  className="text-sm font-medium text-muted-foreground mr-2"
                  htmlFor="points-input"
                >
                  Points:
                </label>
                <Input
                  id="points-input"
                  type="number"
                  {...form.register('points', { valueAsNumber: true })}
                  className="w-24 h-8"
                  min={0}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                >
                  {showImageUpload ? 'Hide Image Upload' : 'Insert Image'}
                </Button>
              </div>
            </div>

            {showImageUpload && (
              <div className="p-4 border border-dashed rounded-lg bg-muted/20 mb-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Upload an image to insert into the question.
                </p>
                <ImageUpload
                  onChange={(url) => {
                    if (url) {
                      const currentText = form.getValues('questionText');
                      form.setValue(
                        'questionText',
                        `${currentText}\n\n![Image](${url})`,
                      );
                      setShowImageUpload(false);
                    }
                  }}
                  className="w-full max-w-xs mx-auto"
                />
              </div>
            )}

            <Textarea
              id="question-text"
              {...form.register('questionText')}
              placeholder="Enter your question here... (Markdown supported)"
              className="resize-none min-h-[100px]"
            />
            {form.formState.errors.questionText && (
              <p className="text-xs text-destructive">
                {form.formState.errors.questionText.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <span className="text-sm font-medium">Options</span>
            {['A', 'B', 'C', 'D'].map((letter, index) => (
              <div key={letter} className="flex gap-3 items-center">
                <div className="flex-none basis-8 font-semibold text-center pt-2">
                  {letter}
                </div>
                <div className="flex-1">
                  <Input
                    {...form.register(`options.${index}`)}
                    placeholder={`Option ${letter}`}
                  />
                </div>
                <div className="flex-none">
                  <input
                    type="radio"
                    value={letter}
                    {...form.register('correctAnswer')}
                    className="w-4 h-4 text-primary"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="explanation">
              Explanation (Optional)
            </label>
            <Textarea
              id="explanation"
              {...form.register('explanation')}
              placeholder="Explain why the answer is correct..."
              className="h-20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Question
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
