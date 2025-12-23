import { useEffect, useState, useId } from 'react';

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
  Code,
  Save,
  Trash2,
  GripVertical,
  Pencil,
  LayoutList,
  FileQuestion,
  BrainCircuit,
  X,
  Check,
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { CodeEditor } from '@/components/ide/code-editor';
import { BlockEditor } from '@/components/instructor/block-editor';
import { PageContainer } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  coursesApi,
  type Course,
  type CreateCourseData,
  type Lesson,
  type CreateLessonData,
  type LessonBlock,
  type CourseSection as Section,
} from '@/features/courses/api/courses-api';
import {
  quizzesApi,
  type CreateQuestionData,
} from '@/features/quizzes/api/quizzes-api';
import { QuizGenerationModal } from '@/features/quizzes/components/quiz-generation-modal';
import { cn } from '@/lib/utils';

const DEFAULT_THUMBNAIL_URL =
  'https://placehold.co/600x400?text=Course+Thumbnail';

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0, 'Price must be 0 or greater'),
  thumbnailUrl: z.string().optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
});

const sectionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
});

const lessonSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  isFreePreview: z.boolean(),
  durationSeconds: z.number(),
  content: z.array(z.any()),
  ideConfig: z
    .object({
      allowedLanguages: z.array(
        z.object({
          language: z.string(),
          initialCode: z.string(),
          expectedOutput: z.string().optional(),
        }),
      ),
      defaultLanguage: z.string(),
      instructions: z.string().optional(),
    })
    .nullable()
    .optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;
type SectionFormData = z.infer<typeof sectionSchema>;
type LessonFormData = z.infer<typeof lessonSchema>;

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const isNew = !courseId;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get('tab') ?? 'details';
  const setActiveTab = (tab: string) => {
    setSearchParams((prev) => {
      prev.set('tab', tab);
      return prev;
    });
  };

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getCourse(courseId ?? ''),
    enabled: !isNew,
  });

  const submitMutation = useMutation({
    mutationFn: () => coursesApi.submitForApproval(courseId ?? ''),
    onSuccess: () => {
      toast.success('Course submitted for approval');
      void queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: () => {
      toast.error('Failed to submit course');
    },
  });

  if (isLoading && !isNew) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/instructor/courses')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? 'Create New Course' : `Edit: ${course?.title}`}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isNew
                ? 'Fill in the details to create your course'
                : 'Manage course content and settings'}
            </p>
          </div>
        </div>

        {!isNew && course && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              {course.status === 'published' && (
                <Badge variant="success">Published</Badge>
              )}
              {course.status === 'pending' && (
                <Badge variant="warning">Pending Approval</Badge>
              )}
              {course.status === 'rejected' && (
                <Badge variant="danger">Rejected</Badge>
              )}
              {(course.status === 'draft' || !course.status) && (
                <Badge variant="secondary">Draft</Badge>
              )}
            </div>

            {(course.status === 'draft' ||
              course.status === 'rejected' ||
              !course.status) && (
              <Button
                variant="primary"
                onClick={() => setShowSubmitConfirm(true)}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Submit for Approval
              </Button>
            )}

            {course.status === 'pending' && (
              <Button variant="outline" disabled>
                Awaiting Review
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="curriculum" disabled={isNew}>
            Curriculum
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <CourseDetailsForm
            course={course}
            isNew={isNew}
            navigate={navigate}
            onSuccess={(newId) => {
              if (isNew && newId) {
                void navigate(
                  `/instructor/courses/${newId}/edit?tab=curriculum`,
                  {
                    replace: true,
                  },
                );
              }
            }}
          />
        </TabsContent>

        <TabsContent value="curriculum">
          {course && <CurriculumEditor course={course} />}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialogs */}
      <Dialog
        open={showSubmitConfirm}
        onOpenChange={(open) => !open && setShowSubmitConfirm(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this course for admin approval?
              You won't be able to make changes until it's reviewed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSubmitConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                submitMutation.mutate();
                setShowSubmitConfirm(false);
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function CourseDetailsForm({
  course,
  isNew,
  navigate,
  onSuccess,
}: {
  course?: Course;
  isNew: boolean;
  navigate: ReturnType<typeof useNavigate>;
  onSuccess: (id?: string) => void;
}) {
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>(course?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Fetch available tags from API
  const { data: availableTags = [] } = useQuery({
    queryKey: ['course-tags'],
    queryFn: coursesApi.getTags,
  });

  // Filter tag suggestions based on input
  const tagSuggestions = availableTags
    .filter(
      (tag) =>
        tag.toLowerCase().includes(tagInput.toLowerCase()) &&
        !tags.includes(tag),
    )
    .slice(0, 8);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: course?.title ?? '',
      description: course?.description ?? '',
      level: course?.level ?? 'beginner',
      price: course?.price ?? 0,
      thumbnailUrl: course?.thumbnailUrl ?? '',
      isPublished: course?.isPublished ?? false,
    },
  });

  // Use useWatch instead of form.watch to support React Compiler memoization
  const watchedThumbnailUrl = useWatch({
    control: form.control,
    name: 'thumbnailUrl',
  });

  const createMutation = useMutation({
    mutationFn: coursesApi.createCourse,
    onSuccess: (data) => {
      toast.success('Course created successfully');
      onSuccess(data.id);
    },
    onError: (error) => {
      console.error(error);
      toast.error(
        'Unable to create course. Please check your information and try again.',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CourseFormData) =>
      coursesApi.updateCourse(course?.id ?? '', {
        title: data.title,
        description: data.description,
        level: data.level,
        price: data.price,
        tags,
        thumbnailUrl: data.thumbnailUrl?.trim()
          ? data.thumbnailUrl.trim()
          : DEFAULT_THUMBNAIL_URL,
        isPublished: data.isPublished,
      }),
    onSuccess: () => {
      toast.success('Course updated successfully');
      void queryClient.invalidateQueries({ queryKey: ['course', course?.id] });
    },
    onError: (error) => {
      console.error(error);
      toast.error('Unable to save changes. Please try again.');
    },
  });

  const onSubmit = (data: CourseFormData) => {
    const cleanData: CreateCourseData = {
      title: data.title,
      description: data.description,
      level: data.level,
      price: data.price,
      tags,
      thumbnailUrl: data.thumbnailUrl?.trim()
        ? data.thumbnailUrl.trim()
        : DEFAULT_THUMBNAIL_URL,
    };

    if (isNew) {
      createMutation.mutate(cleanData);
    } else {
      updateMutation.mutate(cleanData);
    }
  };

  const handleAddTag = (tagToAdd?: string) => {
    const newTag = (tagToAdd ?? tagInput).trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagSuggestions.length > 0) {
        handleAddTag(tagSuggestions[0]);
      } else {
        handleAddTag();
      }
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Title, description and categorization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="course-title" className="text-sm font-medium">
                  Course Title
                </label>
                <Input
                  id="course-title"
                  {...form.register('title')}
                  placeholder="e.g. Mastering React 2024"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="course-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <textarea
                  id="course-description"
                  {...form.register('description')}
                  className="w-full min-h-[150px] p-3 rounded-xl border border-input bg-background font-sans focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="What will students learn in this course?"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="course-level" className="text-sm font-medium">
                    Level
                  </label>
                  <select
                    id="course-level"
                    {...form.register('level')}
                    className="w-full p-2.5 rounded-xl border border-input bg-background"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="course-price" className="text-sm font-medium">
                    Price ($)
                  </label>
                  <Input
                    id="course-price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('price', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Image</CardTitle>
              <CardDescription>
                Upload a course thumbnail (16:9 ratio recommended)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                value={watchedThumbnailUrl}
                onChange={(url) => form.setValue('thumbnailUrl', url ?? '')}
                type="image"
                previewSize={280}
                placeholder="Upload course thumbnail"
              />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  Recommended: 1280x720px or 16:9 ratio
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  File types: JPG, PNG, WebP (max 10MB)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Tags</CardTitle>
              <CardDescription>
                Add tags to help students find your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <label
                  htmlFor="course-tags"
                  className="text-sm font-medium mb-1 block"
                >
                  Tags
                </label>
                <Input
                  id="course-tags"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onKeyDown={handleTagInputKeyDown}
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowTagSuggestions(false), 200);
                  }}
                  placeholder="Type to search or create tags..."
                  className="pr-20"
                />
                {tagInput && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                    onClick={() => handleAddTag()}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                )}

                {showTagSuggestions &&
                  tagInput &&
                  (tagSuggestions.length > 0 || tagInput.trim()) && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                      {tagSuggestions.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted sticky top-0">
                            Existing tags
                          </div>
                          {tagSuggestions.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleAddTag(tag)}
                              className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between group"
                            >
                              <span className="text-sm">{tag}</span>
                              <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                            </button>
                          ))}
                        </>
                      )}
                      {tagInput.trim() &&
                        !availableTags.includes(tagInput.trim()) && (
                          <>
                            {tagSuggestions.length > 0 && (
                              <div className="h-px bg-border" />
                            )}
                            <button
                              type="button"
                              onClick={() => handleAddTag()}
                              className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between group"
                            >
                              <span className="text-sm">
                                Create{' '}
                                <span className="font-medium">
                                  &quot;{tagInput.trim()}&quot;
                                </span>
                              </span>
                              <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                            </button>
                          </>
                        )}
                    </div>
                  )}
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1.5 pl-2.5 pr-1.5 py-1.5 hover:bg-secondary/80 transition-colors"
                    >
                      <span className="text-sm">{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 hover:text-destructive hover:bg-destructive/10 rounded-sm p-0.5 transition-colors"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No tags added yet. Tags help students discover your course.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => navigate('/instructor/courses')}
        >
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          {isNew ? 'Create Course' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

function CurriculumEditor({ course }: { course: Course }) {
  const queryClient = useQueryClient();
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<{
    sectionId: string;
    lessonId: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sectionForm = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { title: '' },
  });

  const addSectionMutation = useMutation({
    mutationFn: (data: SectionFormData) =>
      coursesApi.createSection(
        course.id,
        data.title,
        (course.sections?.length ?? 0) + 1,
      ),
    onSuccess: () => {
      toast.success('Section added');
      sectionForm.reset();
      setIsAddingSection(false);
      void queryClient.invalidateQueries({ queryKey: ['course', course.id] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: coursesApi.deleteSection,
    onSuccess: () => {
      toast.success('Section deleted');
      void queryClient.invalidateQueries({ queryKey: ['course', course.id] });
      setSectionToDelete(null);
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: coursesApi.deleteLesson,
    onSuccess: () => {
      toast.success('Lesson deleted');
      void queryClient.invalidateQueries({ queryKey: ['course', course.id] });
      setLessonToDelete(null);
    },
  });

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const sections = [...(course.sections ?? [])];
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const reordered = arrayMove(sections, oldIndex, newIndex).map(
        (s: Section, i: number) => ({ ...s, orderIndex: i }),
      );
      const sectionIds = reordered.map((s) => s.id);

      queryClient.setQueryData(['course', course.id], {
        ...course,
        sections: reordered,
      });

      void coursesApi.reorderSections(course.id, sectionIds).catch((err) => {
        console.error('Failed to reorder sections:', err);
        toast.error('Failed to save section order');
        void queryClient.invalidateQueries({ queryKey: ['course', course.id] });
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Course Curriculum</h2>
        <Button
          onClick={() => setIsAddingSection(true)}
          disabled={isAddingSection}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {isAddingSection && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <form
              onSubmit={sectionForm.handleSubmit((data) =>
                addSectionMutation.mutate(data),
              )}
              className="flex gap-3 items-start"
            >
              <div className="flex-1">
                <Input
                  {...sectionForm.register('title')}
                  placeholder="Section Title (e.g., Introduction)"
                />
              </div>
              <Button
                size="sm"
                type="submit"
                disabled={addSectionMutation.isPending}
              >
                {addSectionMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => setIsAddingSection(false)}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <div className="space-y-4">
          <SortableContext
            items={course.sections?.map((s) => s.id) ?? []}
            strategy={verticalListSortingStrategy}
          >
            {course.sections?.map((section) => (
              <SortableSectionItem
                key={section.id}
                section={section}
                course={course}
                onDeleteSection={setSectionToDelete}
                onDeleteLesson={setLessonToDelete}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Delete Section Dialog */}
      <Dialog
        open={Boolean(sectionToDelete)}
        onOpenChange={(open) => !open && setSectionToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this section and all its lessons?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (sectionToDelete) {
                  deleteSectionMutation.mutate(sectionToDelete);
                }
              }}
              disabled={deleteSectionMutation.isPending}
            >
              {deleteSectionMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Dialog */}
      <Dialog
        open={Boolean(lessonToDelete)}
        onOpenChange={(open) => !open && setLessonToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lesson? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (lessonToDelete) {
                  deleteLessonMutation.mutate(lessonToDelete.lessonId);
                }
              }}
              disabled={deleteLessonMutation.isPending}
            >
              {deleteLessonMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortableSectionItem({
  section,
  course,
  onDeleteSection,
  onDeleteLesson,
}: {
  section: Section;
  course: Course;
  onDeleteSection: (id: string) => void;
  onDeleteLesson: (data: { sectionId: string; lessonId: string }) => void;
}) {
  const queryClient = useQueryClient();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const lessons = [...(section.lessons ?? [])];
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);

      const reordered = arrayMove(lessons, oldIndex, newIndex).map(
        (l: Lesson, i: number) => ({ ...l, orderIndex: i }),
      );
      const lessonIds = reordered.map((l) => l.id);

      queryClient.setQueryData(['course', course.id], {
        ...course,
        sections: course.sections?.map((s) =>
          s.id === section.id ? { ...s, lessons: reordered } : s,
        ),
      });

      void coursesApi.reorderLessons(section.id, lessonIds).catch((err) => {
        console.error('Failed to reorder lessons:', err);
        toast.error('Failed to save lesson order');
        void queryClient.invalidateQueries({ queryKey: ['course', course.id] });
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('transition-all', isDragging && 'opacity-50')}
    >
      <Card className="overflow-hidden border-border/40 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md bg-card/50 backdrop-blur-sm">
        <CardHeader className="py-4 px-6 bg-muted/30 border-b border-border/40 flex flex-row items-center justify-between space-y-0 select-none">
          <div className="flex items-center gap-4">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-primary/10 rounded-md transition-all text-muted-foreground/50 hover:text-primary"
            >
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-base tracking-tight text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                {section.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="secondary"
                  className="h-4 px-1.5 text-[9px] uppercase font-black bg-primary/10 text-primary border-none"
                >
                  {section.lessons?.length ?? 0} ITEMS
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AddLessonDialog courseId={course.id} sectionId={section.id} />
            <QuizCreationDialog
              sectionId={section.id}
              courseId={course.id}
              lessons={course.sections?.flatMap((s) => s.lessons) ?? []}
            />
            <div className="w-px h-6 bg-border/60 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => onDeleteSection(section.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleLessonDragEnd}
          >
            <SortableContext
              items={section.lessons?.map((l) => l.id) ?? []}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-border/50">
                {section.lessons?.map((lesson) => (
                  <SortableLessonItem
                    key={lesson.id}
                    lesson={lesson}
                    courseId={course.id}
                    sectionId={section.id}
                    onDeleteLesson={onDeleteLesson}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {(!section.lessons || section.lessons.length === 0) && (
            <div className="p-8 text-center border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                No lessons added to this section yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SortableLessonItem({
  lesson,
  courseId,
  sectionId,
  onDeleteLesson,
}: {
  lesson: Lesson;
  courseId: string;
  sectionId: string;
  onDeleteLesson: (data: { sectionId: string; lessonId: string }) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all',
        isDragging && 'opacity-30 bg-primary/5 shadow-inner scale-[0.98]',
      )}
    >
      <LessonItem
        lesson={lesson}
        courseId={courseId}
        sectionId={sectionId}
        dragHandleProps={{ ...attributes, ...listeners }}
        onDeleteLesson={onDeleteLesson}
      />
    </div>
  );
}

function LessonItem({
  lesson,
  courseId,
  sectionId,
  dragHandleProps,
  onDeleteLesson,
}: {
  lesson: Lesson;
  courseId: string;
  sectionId: string;
  dragHandleProps?: Record<string, unknown>;
  onDeleteLesson: (data: { sectionId: string; lessonId: string }) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="group flex items-center justify-between py-3.5 px-6 hover:bg-primary/[0.02] transition-all border-l-4 border-transparent hover:border-primary/60 relative overflow-hidden">
      <div className="flex items-center gap-4 flex-1 min-w-0 z-10">
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/30 group-hover:text-primary/60 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={cn(
              'w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md',
              lesson.type === 'quiz'
                ? 'bg-orange-500/10 text-orange-600 border border-orange-200/50 group-hover:bg-orange-500 group-hover:text-white'
                : lesson.ideConfig
                  ? 'bg-blue-500/10 text-blue-600 border border-blue-200/50 group-hover:bg-blue-500 group-hover:text-white'
                  : 'bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white',
            )}
          >
            {lesson.type === 'quiz' ? (
              <FileQuestion className="w-5 h-5" />
            ) : lesson.ideConfig ? (
              <Code className="w-5 h-5" />
            ) : (
              <LayoutList className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate text-foreground/80 group-hover:text-foreground transition-colors">
              {lesson.title}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={cn(
                  'text-[9px] uppercase font-black tracking-widest',
                  lesson.type === 'quiz'
                    ? 'text-orange-600/80'
                    : lesson.ideConfig
                      ? 'text-blue-600/80'
                      : 'text-primary/80',
                )}
              >
                {lesson.type === 'quiz'
                  ? 'Interactive Quiz'
                  : lesson.ideConfig
                    ? 'Code Exercise'
                    : 'Lesson'}
              </span>
              {lesson.isFreePreview && (
                <Badge className="h-3.5 px-1 text-[8px] bg-green-500/5 text-green-600 border-green-500/20">
                  PREVIEW
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-10">
        {lesson.type === 'quiz' ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg hover:bg-orange-500/10 hover:text-orange-600"
            onClick={() =>
              navigate(
                `/instructor/courses/${courseId}/quizzes/${lesson.id}/edit`,
              )
            }
          >
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <AddLessonDialog
            sectionId={sectionId}
            courseId={courseId}
            existingLesson={lesson}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            }
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDeleteLesson({ sectionId, lessonId: lesson.id })}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

const getDefaultCode = (lang: string) => {
  switch (lang) {
    case 'javascript':
      return '// Write your code here\nconsole.log("Hello World");';
    case 'python':
      return '# Write your code here\nprint("Hello World")';
    case 'java':
      return '// Write your code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}';
    case 'cpp':
      return '// Write your code here\n#include <iostream>\n\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}';
    case 'go':
      return '// Write your code here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World")\n}';
    case 'rust':
      return '// Write your code here\nfn main() {\n    println!("Hello World");\n}';
    default:
      return '';
  }
};

function AddLessonDialog({
  sectionId,
  courseId,
  existingLesson,
  trigger,
}: {
  sectionId: string;
  courseId: string;
  existingLesson?: Lesson;
  trigger?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const checkboxId = useId();

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: existingLesson?.title ?? '',
      isFreePreview: existingLesson?.isFreePreview ?? false,
      durationSeconds: existingLesson?.durationSeconds ?? 0,
      content: existingLesson?.content ?? [],
      ideConfig: existingLesson?.ideConfig ?? null,
    },
  });

  // Use useWatch instead of form.watch to support React Compiler memoization
  const durationSeconds = useWatch({
    control: form.control,
    name: 'durationSeconds',
  });
  const durationInMinutes = Math.round((durationSeconds ?? 0) / 60);
  const watchedContent = useWatch({ control: form.control, name: 'content' });
  // Multi-language state
  const [enableIde, setEnableIde] = useState(
    Boolean(existingLesson?.ideConfig),
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [defaultLanguage, setDefaultLanguage] = useState<string>('javascript');
  const [editingLanguage, setEditingLanguage] = useState<string>('javascript');
  const [codeTemplates, setCodeTemplates] = useState<Record<string, string>>(
    {},
  );
  const [expectedOutputs, setExpectedOutputs] = useState<
    Record<string, string>
  >({});

  // Initialize state from existing lesson
  useEffect(() => {
    if (open) {
      const config = existingLesson?.ideConfig;

      form.reset({
        title: existingLesson?.title ?? '',
        isFreePreview: existingLesson?.isFreePreview ?? false,
        durationSeconds: existingLesson?.durationSeconds ?? 0,
        content: existingLesson?.content ?? [],
        ideConfig: config ?? null, // TypeScript might complain if types assumed old structure, but ignore for now
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnableIde(Boolean(config));

      if (config) {
        // Hydrate from existing config
        const langs = config.allowedLanguages.map((l) => l.language);
        setSelectedLanguages(langs);
        setDefaultLanguage(config.defaultLanguage);
        setEditingLanguage(config.defaultLanguage); // Start editing default

        const templates: Record<string, string> = {};
        const outputs: Record<string, string> = {};
        config.allowedLanguages.forEach((l) => {
          templates[l.language] = l.initialCode;
          if (l.expectedOutput) {
            outputs[l.language] = l.expectedOutput;
          }
        });
        setCodeTemplates(templates);
        setExpectedOutputs(outputs);
      } else {
        // Default clean state
        setSelectedLanguages(['javascript']);
        setDefaultLanguage('javascript');
        setEditingLanguage('javascript');
        setCodeTemplates({ javascript: getDefaultCode('javascript') });
        setExpectedOutputs({});
      }
    }
  }, [open, existingLesson, form]);

  // Sync state to form
  useEffect(() => {
    if (enableIde) {
      const allowedLanguages = selectedLanguages.map((lang) => ({
        language: lang,
        // eslint-disable-next-line security/detect-object-injection
        initialCode: codeTemplates[lang] || getDefaultCode(lang),
        // eslint-disable-next-line security/detect-object-injection
        expectedOutput: expectedOutputs[lang],
      }));

      // Ensure default language is in selected
      const validDefault = selectedLanguages.includes(defaultLanguage)
        ? defaultLanguage
        : selectedLanguages[0] || 'javascript';

      if (allowedLanguages.length > 0) {
        form.setValue(
          'ideConfig',
          {
            allowedLanguages,
            defaultLanguage: validDefault,
          },
          { shouldDirty: true, shouldValidate: true },
        );
      }
    } else {
      form.setValue('ideConfig', null, { shouldDirty: true });
    }
  }, [
    enableIde,
    selectedLanguages,
    defaultLanguage,
    codeTemplates,
    expectedOutputs,
    form,
  ]);

  const [isBlocksValid, setIsBlocksValid] = useState(true);

  const mutation = useMutation({
    mutationFn: (data: CreateLessonData) => {
      if (existingLesson) {
        return coursesApi.updateLesson(existingLesson.id, data);
      }
      return coursesApi.createLesson(sectionId, data);
    },
    onSuccess: () => {
      toast.success(`Lesson ${existingLesson ? 'updated' : 'added'}`);
      setOpen(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  const onSubmit = (data: LessonFormData) => {
    const content = data.content as LessonBlock[];

    mutation.mutate({
      ...data,
      content,
      orderIndex: existingLesson?.orderIndex ?? 0,
    } as CreateLessonData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-2" /> Add Lesson
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingLesson ? 'Edit Lesson' : 'Add New Lesson'}
          </DialogTitle>
          <DialogDescription>
            Build your lesson content using the block editor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="lesson-title" className="text-sm font-medium">
                Lesson Title
              </label>
              <Input
                id="lesson-title"
                {...form.register('title')}
                placeholder="e.g. Introduction to Hooks"
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="lesson-duration" className="text-sm font-medium">
                Duration (minutes)
              </label>
              <Input
                id="lesson-duration"
                type="number"
                min="0"
                defaultValue={durationInMinutes}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 0;
                  form.setValue('durationSeconds', minutes * 60);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Content Builder</span>
              <span className="text-xs text-muted-foreground">
                Drag to reorder blocks
              </span>
            </div>

            <div className="border border-border rounded-xl p-4 bg-muted/10 min-h-[300px]">
              <BlockEditor
                blocks={watchedContent as LessonBlock[]}
                onChange={(newBlocks: LessonBlock[]) =>
                  form.setValue('content', newBlocks, { shouldDirty: true })
                }
                onValidationChange={setIsBlocksValid}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card">
              <div className="space-y-0.5">
                <label
                  htmlFor="enable-ide"
                  className="text-base font-semibold cursor-pointer"
                >
                  Code Exercise
                </label>
                <p className="text-sm text-muted-foreground">
                  Enable an embedded IDE for students to solve coding problems.
                </p>
              </div>
              <Switch
                id="enable-ide"
                checked={enableIde}
                onCheckedChange={setEnableIde}
              />
            </div>
            {enableIde && (
              <div className="space-y-6 p-4 border border-border rounded-xl bg-muted/20 animate-in fade-in zoom-in-95 duration-200">
                {/* Language Selection */}
                <div className="space-y-3">
                  <span className="text-sm font-medium">
                    Supported Languages
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'javascript',
                      'python',
                      'java',
                      'cpp',
                      'go',
                      'rust',
                      'typescript',
                    ].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          if (selectedLanguages.includes(lang)) {
                            if (selectedLanguages.length > 1) {
                              setSelectedLanguages((prev) =>
                                prev.filter((l) => l !== lang),
                              );
                              if (editingLanguage === lang) {
                                const newLang = selectedLanguages.find(
                                  (l) => l !== lang,
                                );
                                if (newLang) {
                                  setEditingLanguage(newLang);
                                }
                              }
                            } else {
                              toast.error(
                                'At least one language must be selected',
                              );
                            }
                          } else {
                            setSelectedLanguages((prev) => [...prev, lang]);
                            // Initialize template if not exists
                            if (!codeTemplates[lang]) {
                              setCodeTemplates((prev) => ({
                                ...prev,
                                [lang]: getDefaultCode(lang),
                              }));
                            }
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                          selectedLanguages.includes(lang)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Editing Language Selector */}
                  <div className="space-y-2">
                    <label
                      htmlFor="edit-language-select"
                      className="text-sm font-medium"
                    >
                      Configure Template For
                    </label>
                    <select
                      id="edit-language-select"
                      className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={editingLanguage}
                      onChange={(e) => setEditingLanguage(e.target.value)}
                    >
                      {selectedLanguages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Default Language Selector */}
                  <div className="space-y-2">
                    <label
                      htmlFor="default-language-select"
                      className="text-sm font-medium"
                    >
                      Default Language for Student
                    </label>
                    <select
                      id="default-language-select"
                      className="w-full p-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={defaultLanguage}
                      onChange={(e) => setDefaultLanguage(e.target.value)}
                    >
                      {selectedLanguages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Initial Code Template ({editingLanguage})
                    </label>
                  </div>
                  <div className="h-[300px] border border-border rounded-xl overflow-hidden">
                    <CodeEditor
                      language={editingLanguage}
                      initialValue={
                        codeTemplates[editingLanguage] ||
                        getDefaultCode(editingLanguage)
                      }
                      onChange={(value) =>
                        setCodeTemplates((prev) => ({
                          ...prev,
                          [editingLanguage]: value ?? '',
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="expected-output-input"
                    className="text-sm font-medium"
                  >
                    Expected Output (Optional)
                  </label>
                  <Input
                    id="expected-output-input"
                    placeholder="e.g. Hello World"
                    // eslint-disable-next-line security/detect-object-injection
                    value={expectedOutputs[editingLanguage] || ''}
                    onChange={(e) =>
                      setExpectedOutputs((prev) => ({
                        ...prev,
                        [editingLanguage]: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Matches exact string output for auto-grading{' '}
                    {editingLanguage} submissions.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label
              htmlFor={checkboxId}
              className="flex items-center gap-2 text-sm font-medium cursor-pointer"
            >
              <input
                id={checkboxId}
                type="checkbox"
                {...form.register('isFreePreview')}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Allow as Free Preview
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !isBlocksValid}
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Lesson
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuizCreationDialog({
  sectionId,
  courseId,
  lessons,
}: {
  sectionId: string;
  courseId: string;
  lessons: { id: string; title: string; type?: 'standard' | 'quiz' }[];
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'choice' | 'manual' | 'ai'>('choice');
  const [manualTitle, setManualTitle] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const reset = () => {
    setMethod('choice');
    setManualTitle('');
    setIsSubmittingManual(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      return;
    }

    setIsSubmittingManual(true);
    try {
      const lesson = await coursesApi.createLesson(sectionId, {
        title: manualTitle.trim(),
        type: 'quiz',
        content: [],
        durationSeconds: 0,
        isFreePreview: false,
        orderIndex: 0,
      });

      await quizzesApi.createQuiz({
        title: manualTitle.trim(),
        lessonId: lesson.id,
      });

      toast.success('Quiz added');
      setOpen(false);
      reset();
      await queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      void navigate(
        `/instructor/courses/${courseId}/quizzes/${lesson.id}/edit`,
        {
          state: { title: manualTitle.trim() },
        },
      );
    } catch (err: unknown) {
      console.error(err);
      toast.error('Unable to create quiz');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleAiSave = async ({
    questions,
    title,
  }: {
    questions: CreateQuestionData[];
    title: string;
  }) => {
    try {
      const quizTitle =
        title || `AI Quiz ${new Date().toISOString().slice(0, 10)}`;

      const lesson = await coursesApi.createLesson(sectionId, {
        title: quizTitle,
        type: 'quiz',
        content: [],
        durationSeconds: 0,
        isFreePreview: false,
        orderIndex: 0,
      });

      await quizzesApi.createQuiz({
        title: quizTitle,
        lessonId: lesson.id,
        courseId,
        questions,
      });

      toast.success('AI Quiz Created!');
      setOpen(false);
      reset();
      void queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to save AI quiz');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            reset();
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Quiz
          </Button>
        </DialogTrigger>
        <DialogContent
          className={cn(
            'sm:max-w-[500px] transition-all duration-300',
            method !== 'choice' && 'sm:max-w-[400px]',
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-primary" />
              {method === 'choice' && 'Create New Quiz'}
              {method === 'manual' && 'Manual Quiz Details'}
            </DialogTitle>
            <DialogDescription>
              {method === 'choice' && 'How would you like to create your quiz?'}
              {method === 'manual' &&
                'Set a title for your manual quiz. You can add questions later.'}
            </DialogDescription>
          </DialogHeader>

          {method === 'choice' && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                type="button"
                onClick={() => setMethod('manual')}
                className="group premium-card flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
              >
                <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Pencil className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1 text-foreground">
                    Manual Create
                  </h3>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Add questions and answers yourself
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('ai')}
                className="group premium-card flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-border/50 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-center"
              >
                <div className="p-3 rounded-xl bg-muted group-hover:bg-purple-500/10 group-hover:text-purple-600 transition-colors">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1 text-foreground">
                    AI Powered
                  </h3>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Generate from your lesson content
                  </p>
                </div>
              </button>
            </div>
          )}

          {method === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="quiz-title">
                  Quiz Title
                </label>
                <Input
                  id="quiz-title"
                  placeholder="e.g. JavaScript Basics Final"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setMethod('choice')}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingManual || !manualTitle.trim()}
                >
                  {isSubmittingManual && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Quiz
                </Button>
              </DialogFooter>
            </form>
          )}

          {method === 'choice' && (
            <DialogFooter className="sm:justify-start">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <QuizGenerationModal
        isOpen={method === 'ai'}
        onClose={() => setMethod('choice')}
        courseId={courseId}
        sectionId={sectionId}
        lessons={lessons.filter((l) => l.type !== 'quiz')}
        onSave={handleAiSave}
      />
    </>
  );
}
