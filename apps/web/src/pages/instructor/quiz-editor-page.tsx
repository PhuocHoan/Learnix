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
  Trash2,
  CheckCircle2,
  Circle,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { z } from 'zod';

import { PageContainer } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  quizzesApi,
  type Question,
  type QuestionType,
} from '@/features/quizzes/api/quizzes-api';
import { cn } from '@/lib/utils';

interface QuestionFormData {
  questionText: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  type: QuestionType;
}

export default function QuizEditorPage() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const stateTitle = (location.state as { title?: string })?.title;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiConfig, setAiConfig] = useState<{
    text: string;
    count: number;
    types: string[];
  }>({
    text: '',
    count: 5,
    types: ['multiple_choice'], // Default
  });

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
        if (
          err &&
          typeof err === 'object' &&
          'response' in err &&
          (err as { response: { status: number } }).response?.status === 404
        ) {
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

  const updateQuizMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      quizzesApi.updateQuiz(id, { title }),
    onSuccess: () => {
      toast.success('Quiz title updated');
      void queryClient.invalidateQueries({
        queryKey: ['quiz', 'lesson', lessonId],
      });
    },
    onError: () => {
      toast.error('Failed to update quiz title');
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => quizzesApi.deleteQuestion(questionId),
    onSuccess: () => {
      toast.success('Question deleted');
      void queryClient.invalidateQueries({
        queryKey: ['quiz', 'lesson', lessonId],
      });
      setQuestionToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete question');
    },
  });

  const generateQuizMutation = useMutation({
    mutationFn: quizzesApi.generateQuiz,
    onSuccess: async (data) => {
      toast.success(`Generated ${data.questions.length} questions!`);
      setShowAiDialog(false);
      // Sequentially add questions
      if (quiz) {
        let addedCount = 0;
        for (const q of data.questions) {
          try {
            await quizzesApi.createQuestion(quiz.id, {
              ...q,
              type: q.type,
              points: 1,
            });
            addedCount++;
          } catch (_e) {
            // Silently continue if one question fails
          }
        }
        if (addedCount > 0) {
          toast.success(`Added ${addedCount} questions to quiz.`);
          void queryClient.invalidateQueries({
            queryKey: ['quiz', 'lesson', lessonId],
          });
        }
      }
    },
    onError: () => {
      toast.error('Failed to generate quiz. Please try again.');
    },
  });

  const {
    mutate: createQuiz,
    isPending: isCreatingQuiz,
    isSuccess: isQuizCreated,
  } = createQuizMutation;

  useEffect(() => {
    if (
      !isLoading &&
      quiz === null &&
      !isCreatingQuiz &&
      !isQuizCreated &&
      lessonId
    ) {
      createQuiz({ title: stateTitle ?? 'Untitled Quiz', lessonId });
    }
  }, [
    isLoading,
    quiz,
    isCreatingQuiz,
    isQuizCreated,
    lessonId,
    createQuiz,
    stateTitle,
  ]);

  useEffect(() => {
    if (quiz?.questions) {
      const timer = setTimeout(() => {
        setOrderedQuestions(quiz.questions);
      }, 0);
      return () => clearTimeout(timer);
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
            toast.error('Unable to save question order. Please try again.');
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
          onClick={() =>
            void navigate(`/instructor/courses/${courseId}/edit?tab=curriculum`)
          }
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          {isEditingTitle ? (
            <Input
              defaultValue={quiz?.title}
              onBlur={(e) => {
                setIsEditingTitle(false);
                const newTitle = e.target.value.trim();
                if (quiz && newTitle && newTitle !== quiz.title) {
                  updateQuizMutation.mutate({ id: quiz.id, title: newTitle });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="text-2xl font-bold cursor-pointer hover:underline decoration-dashed underline-offset-4 bg-transparent border-none p-0 text-left"
              onClick={() => setIsEditingTitle(true)}
            >
              {quiz?.title ?? stateTitle ?? 'Untitled Quiz'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Questions</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
              onClick={() => setShowAiDialog(true)}
              disabled={!quiz || generateQuizMutation.isPending}
            >
              <Sparkles className="w-4 h-4" />
              {generateQuizMutation.isPending
                ? 'Generating...'
                : 'Generate with AI'}
            </Button>
            <Button
              onClick={() => setEditingQuestionId('new')}
              disabled={!quiz}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>

        {editingQuestionId === 'new' && quiz && (
          <QuestionEditor
            quizId={quiz.id}
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
          {quiz && (
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
                    onDelete={() => setQuestionToDelete(question.id)}
                    onCancel={() => setEditingQuestionId(null)}
                    onSave={() => {
                      setEditingQuestionId(null);
                      void queryClient.invalidateQueries({
                        queryKey: ['quiz', 'lesson', lessonId],
                      });
                    }}
                    quizId={quiz.id}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
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

      <Dialog
        open={Boolean(questionToDelete)}
        onOpenChange={(open) => !open && setQuestionToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (questionToDelete) {
                  deleteQuestionMutation.mutate(questionToDelete);
                }
              }}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" /> Generate Quiz with AI
            </DialogTitle>
            <DialogDescription>
              Paste your lesson content below and let AI generate questions for
              you.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="lesson-content" className="text-sm font-medium">
                Lesson Content
              </label>
              <Textarea
                id="lesson-content"
                placeholder="Paste text notes, summary, or lesson script..."
                className="min-h-[200px]"
                value={aiConfig.text}
                onChange={(e) =>
                  setAiConfig((prev) => ({ ...prev, text: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                The more context you provide, the better the questions will be.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="question-count" className="text-sm font-medium">
                  Number of Questions
                </label>
                <Input
                  id="question-count"
                  type="number"
                  min={1}
                  max={10}
                  value={aiConfig.count}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      count: parseInt(e.target.value) || 5,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Question Types</span>
                <div className="flex flex-col gap-2 p-3 border rounded-md">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={aiConfig.types.includes('multiple_choice')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAiConfig((prev) => ({
                          ...prev,
                          types: checked
                            ? [...prev.types, 'multiple_choice']
                            : prev.types.filter((t) => t !== 'multiple_choice'),
                        }));
                      }}
                    />{' '}
                    Multiple Choice
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={aiConfig.types.includes('true_false')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAiConfig((prev) => ({
                          ...prev,
                          types: checked
                            ? [...prev.types, 'true_false']
                            : prev.types.filter((t) => t !== 'true_false'),
                        }));
                      }}
                    />{' '}
                    True/False
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAiDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                generateQuizMutation.mutate({
                  text: aiConfig.text,
                  count: aiConfig.count,
                  types: aiConfig.types.length
                    ? aiConfig.types
                    : ['multiple_choice'],
                })
              }
              disabled={!aiConfig.text || generateQuizMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {generateQuizMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {generateQuizMutation.isPending
                ? 'Generating...'
                : 'Generate Questions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <div ref={setNodeRef} style={style} className="mb-6 group">
      <Card className="premium-card border-border/40 hover:border-primary/30 shadow-sm hover:shadow-xl bg-card/60 backdrop-blur-sm transition-all duration-300">
        <CardHeader className="flex flex-row items-start justify-between py-5 px-6">
          <div className="flex gap-5">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center justify-center h-10 w-6 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary transition-colors"
            >
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary text-white font-bold text-sm shadow-lg glow-primary">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              {question.imageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-border/60 max-w-sm shadow-inner bg-muted/20">
                  <img
                    src={question.imageUrl}
                    alt="Question"
                    className="w-full h-auto object-contain max-h-[250px] transition-transform group-hover:scale-[1.02]"
                  />
                </div>
              )}
              <div className="font-bold text-lg mb-3 text-foreground/90 group-hover:text-foreground transition-colors leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {question.questionText}
                </ReactMarkdown>
              </div>
              <div className="flex gap-3">
                <Badge className="bg-primary/5 text-primary border-primary/20 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest uppercase">
                  {question.points || 1} POINTS
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl border-border/60 shadow-xl"
            >
              <DropdownMenuItem onClick={onEdit} className="rounded-lg gap-2">
                <Pencil className="w-4 h-4" /> Edit Question
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive rounded-lg gap-2"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" /> Delete Question
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="pb-6 px-6">
          {question.type !== 'short_answer' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-15">
              {question.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i); // A, B, C...
                const correctLetters = question.correctAnswer
                  .split(',')
                  .map((s) => s.trim());
                const isSelectedCorrect =
                  correctLetters.includes(letter) ||
                  correctLetters.includes(opt);

                return (
                  <div
                    key={i}
                    className={cn(
                      'p-4 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3',
                      isSelectedCorrect
                        ? 'border-green-500 bg-green-500/5 text-green-700 shadow-sm'
                        : 'border-border/30 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40',
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 flex items-center justify-center font-bold text-xs',
                        question.type === 'multi_select'
                          ? 'rounded-md'
                          : 'rounded-full',
                        isSelectedCorrect
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {letter}
                    </div>
                    {opt}
                    {isSelectedCorrect && (
                      <CheckCircle2 className="w-4 h-4 ml-auto text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pl-15">
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 text-sm flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                  Expected Answer
                </span>
                <span className="font-bold text-foreground/80">
                  {question.correctAnswer}
                </span>
              </div>
            </div>
          )}
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

  // Internal form structure for useFieldArray
  const formSchema = z
    .object({
      questionText: z.string().min(1, 'Question text is required'),
      imageUrl: z.string().optional(),
      type: z.enum([
        'multiple_choice',
        'multi_select',
        'true_false',
        'short_answer',
      ]),
      options: z
        .array(z.object({ value: z.string().min(1, 'Option required') }))
        .optional(),
      correctAnswer: z.string().min(1, 'Correct answer is required'),
      explanation: z.string().optional(),
      points: z.number().min(0),
    })
    .refine(
      (data) => {
        if (
          data.type === 'multiple_choice' ||
          data.type === 'multi_select' ||
          data.type === 'true_false'
        ) {
          return (data.options?.length ?? 0) >= 2;
        }
        return true;
      },
      {
        message: 'At least 2 options are required for this question type',
        path: ['options'],
      },
    );

  type QuestionFormInternal = z.infer<typeof formSchema>;

  const form = useForm<QuestionFormInternal>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      questionText: question?.questionText ?? '',
      imageUrl: question?.imageUrl ?? '',
      type: question?.type ?? 'multiple_choice',
      options: question?.options?.map((o) => ({ value: o })) ?? [
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
      ],
      correctAnswer: question?.correctAnswer ?? 'A',
      explanation: question?.explanation ?? '',
      points: question?.points ?? 1,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const mutation = useMutation({
    mutationFn: (data: QuestionFormData) => {
      if (isNew) {
        if (!quizId) {
          throw new Error(
            'Quiz ID is missing. Please try refreshing the page.',
          );
        }
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

  const onSubmit = (data: QuestionFormInternal) => {
    const payload: QuestionFormData = {
      ...data,
      options:
        data.type === 'short_answer'
          ? []
          : (data.options?.map((o) => o.value) ?? []),
      imageUrl: data.imageUrl ?? undefined,
    };
    mutation.mutate(payload);
  };

  const [activeTab, setActiveTab] = useState('edit');

  // Use useWatch instead of form.watch for React Compiler compatibility
  const watchedCorrectAnswer = useWatch({
    control: form.control,
    name: 'correctAnswer',
  });
  const watchedType = useWatch({ control: form.control, name: 'type' });
  const watchedImageUrl = useWatch({ control: form.control, name: 'imageUrl' });
  const watchedOptions = useWatch({ control: form.control, name: 'options' });
  const watchedExplanation = useWatch({
    control: form.control,
    name: 'explanation',
  });
  const watchedQuestionText = useWatch({
    control: form.control,
    name: 'questionText',
  });

  return (
    <Card className="border-primary shadow-lg">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isNew ? 'Create Question' : 'Edit Question'}
            <div className="w-px h-6 bg-border/60 mx-1" />
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val: QuestionType) => {
                    field.onChange(val);
                    const type = val;
                    if (type === 'true_false') {
                      form.setValue('options', [
                        { value: 'True' },
                        { value: 'False' },
                      ]);
                      form.setValue('correctAnswer', 'A');
                    } else if (
                      type === 'multiple_choice' ||
                      type === 'multi_select'
                    ) {
                      form.setValue('options', [
                        { value: '' },
                        { value: '' },
                        { value: '' },
                        { value: '' },
                      ]);
                      form.setValue('correctAnswer', 'A');
                    } else {
                      form.setValue('options', []);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px] h-8 font-bold">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">
                      Single Choice
                    </SelectItem>
                    <SelectItem value="multi_select">Multi-Select</SelectItem>
                    <SelectItem value="true_false">True / False</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
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
              className="w-20 h-8 bg-background"
              min={0}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="space-y-6"
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="edit">Edit Question</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-6 mt-0">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="question-text">
                  Question Text
                </label>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">
                  <div className="space-y-2">
                    <Textarea
                      id="question-text"
                      {...form.register('questionText')}
                      placeholder="Enter your question here... (Markdown supported)"
                      className="resize-none min-h-[200px] font-mono text-sm"
                    />
                    {form.formState.errors.questionText && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.questionText.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Question Image (Optional)
                    </div>
                    <ImageUpload
                      value={watchedImageUrl}
                      onChange={(url) => {
                        form.setValue('imageUrl', url ?? '');
                      }}
                      className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">
                      {watchedImageUrl
                        ? 'Image will be displayed above the question'
                        : 'Upload an image for this question'}
                    </p>
                  </div>
                </div>
              </div>

              {watchedType !== 'short_answer' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Answer Options</span>
                    {(watchedType === 'multiple_choice' ||
                      watchedType === 'multi_select') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ value: '' })}
                        className="h-8"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Option
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const letter = String.fromCharCode(65 + index); // A, B, C...
                      const correctLetters = (watchedCorrectAnswer ?? '')
                        .split(',')
                        .map((s) => s.trim());
                      const isCorrect = correctLetters.includes(letter);
                      const isMulti = watchedType === 'multi_select';

                      return (
                        <div
                          key={field.id}
                          className={cn(
                            'flex gap-3 items-center p-2 rounded-lg border transition-colors',
                            isCorrect
                              ? 'border-green-500 bg-green-50/50'
                              : 'border-transparent hover:bg-muted/50',
                          )}
                        >
                          <div className="flex-none basis-8 font-bold text-center text-muted-foreground">
                            {letter}
                          </div>

                          <div className="flex-1">
                            <Input
                              {...form.register(`options.${index}.value`)}
                              placeholder={`Option ${letter}`}
                              readOnly={watchedType === 'true_false'}
                              className={cn(
                                isCorrect &&
                                  'border-green-500 focus-visible:ring-green-500',
                                watchedType === 'true_false' &&
                                  'bg-muted/30 cursor-default',
                              )}
                            />
                          </div>

                          <div className="flex-none flex items-center gap-2">
                            <label
                              className={cn(
                                'cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                isCorrect
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
                              )}
                            >
                              <input
                                type={isMulti ? 'checkbox' : 'radio'}
                                value={letter}
                                className="sr-only"
                                checked={isCorrect}
                                onChange={(e) => {
                                  if (isMulti) {
                                    const next = e.target.checked
                                      ? [...correctLetters, letter]
                                          .sort()
                                          .filter(Boolean)
                                      : correctLetters
                                          .filter((l) => l !== letter)
                                          .sort();
                                    form.setValue(
                                      'correctAnswer',
                                      next.join(','),
                                      { shouldValidate: true },
                                    );
                                  } else {
                                    form.setValue('correctAnswer', letter, {
                                      shouldValidate: true,
                                    });
                                  }
                                }}
                              />
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                              {isCorrect ? 'Correct' : 'Mark Correct'}
                            </label>

                            {(watchedType === 'multiple_choice' ||
                              watchedType === 'multi_select') &&
                              fields.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="text-muted-foreground hover:text-destructive h-9 w-9 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {form.formState.errors.options && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.options.message}
                    </p>
                  )}
                </div>
              )}

              {watchedType === 'short_answer' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="correct-answer"
                    >
                      Expected Answer
                    </label>
                    <Input
                      id="correct-answer"
                      {...form.register('correctAnswer')}
                      placeholder="Enter the correct text answer..."
                      className="font-bold"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Student must type this exact text to earn points.
                    </p>
                  </div>
                </div>
              )}

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
            </TabsContent>

            <TabsContent
              value="preview"
              className="mt-0 min-h-[400px] space-y-6"
            >
              {watchedImageUrl && (
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  <img
                    src={watchedImageUrl}
                    alt="Question visual"
                    className="w-full max-h-[300px] object-contain"
                  />
                </div>
              )}
              <div className="prose prose-sm max-w-none dark:prose-invert p-4 border rounded-lg bg-card shadow-inner">
                {watchedQuestionText ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {watchedQuestionText}
                  </ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground italic">
                    No question text...
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {watchedType === 'short_answer'
                    ? 'Answer Preview'
                    : 'Options Preview'}
                </h4>
                {watchedType !== 'short_answer' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {watchedOptions?.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const correctLetters = (watchedCorrectAnswer || '')
                        .split(',')
                        .map((s) => s.trim());
                      const isCorrect = correctLetters.includes(letter);
                      return (
                        <div
                          key={i}
                          className={cn(
                            'p-3 rounded-lg border flex items-start gap-3',
                            isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-border',
                          )}
                        >
                          <span
                            className={cn(
                              'font-bold',
                              isCorrect
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-muted-foreground',
                            )}
                          >
                            {letter}.
                          </span>
                          <span>
                            {opt.value || (
                              <span className="italic text-muted-foreground">
                                Empty option
                              </span>
                            )}
                          </span>
                          {isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border-2 border-dashed border-primary/20 bg-muted/20">
                    <p className="text-sm font-mono">
                      {watchedCorrectAnswer || 'Not set'}
                    </p>
                  </div>
                )}
              </div>

              {watchedExplanation && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Explanation Preview
                  </h4>
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {watchedExplanation || ''}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
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
