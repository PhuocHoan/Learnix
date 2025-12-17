import { useEffect, useState, useId } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Plus,
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
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  coursesApi,
  type Course,
  type Lesson,
  type CreateLessonData,
  type LessonBlock,
} from '@/features/courses/api/courses-api';
import { QuizGenerationModal } from '@/features/quizzes/components/quiz-generation-modal';
import { cn } from '@/lib/utils';


const DEFAULT_THUMBNAIL_URL =
  'https://placehold.co/600x400?text=Course+Thumbnail';

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  thumbnailUrl: z.string().optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
});

const sectionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
});

const lessonSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  isFreePreview: z.boolean().default(false),
  durationSeconds: z.coerce.number().default(0),
  content: z.array(z.any()).default([]),
});

type CourseFormData = z.infer<typeof courseSchema>;
type SectionFormData = z.infer<typeof sectionSchema>;
type LessonFormData = z.infer<typeof lessonSchema>;

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const isNew = !courseId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');

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
                  onClick={() => {
                    if (
                      // eslint-disable-next-line no-alert
                      window.confirm('Submit this course for admin approval?')
                    ) {
                      submitMutation.mutate();
                    }
                  }}
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
                void navigate(`/instructor/courses/${newId}/edit`, {
                  replace: true,
                });
                setActiveTab('curriculum');
              }
            }}
          />
        </TabsContent>

        <TabsContent value="curriculum">
          {course && <CurriculumEditor course={course} />}
        </TabsContent>
      </Tabs>
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    resolver: zodResolver(courseSchema) as any,
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
      coursesApi.updateCourse(course?.id ?? '', { ...data, tags }),
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
    // Explicitly construct the payload to match API types and avoid 'any'
    const cleanData = {
      ...data,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      thumbnailUrl: data.thumbnailUrl || DEFAULT_THUMBNAIL_URL,
      tags,
    };

    if (isNew) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      createMutation.mutate(cleanData as any);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      updateMutation.mutate(cleanData as any);
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
                    {...form.register('price')}
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
                <label htmlFor="course-tags" className="sr-only">
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
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(
    null,
  );
  const [draggedLessonInfo, setDraggedLessonInfo] = useState<{
    sectionId: string;
    index: number;
  } | null>(null);

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
    },
  });

  // --- Section Drag Logic ---
  const handleSectionDragStart = (index: number) => {
    setDraggedSectionIndex(index);
  };

  const handleSectionDragEnter = (index: number) => {
    if (draggedSectionIndex === null || draggedSectionIndex === index) {
      return;
    }

    // Optimistic update of sections array
    const sections = [...(course.sections ?? [])];

    // Check bounds before access to satisfy no-object-injection
    if (draggedSectionIndex >= sections.length || index >= sections.length) {
      return;
    }

    const [item] = sections.splice(draggedSectionIndex, 1);
    if (item) {
      sections.splice(index, 0, item);

      // Update local React Query cache immediately for "dynamic" feel
      queryClient.setQueryData(['course', course.id], {
        ...course,
        sections,
      });

      setDraggedSectionIndex(index);
    }
  };

  const handleSectionDragEnd = () => {
    setDraggedSectionIndex(null);
  };

  // --- Lesson Drag Logic ---
  const handleLessonDragStart = (
    sectionId: string,
    index: number,
    e: React.DragEvent,
  ) => {
    e.stopPropagation(); // Prevent bubbling to section drag
    setDraggedLessonInfo({ sectionId, index });
  };

  const handleLessonDragEnter = (
    targetSectionId: string,
    targetIndex: number,
  ) => {
    if (!draggedLessonInfo) {
      return;
    }
    if (draggedLessonInfo.sectionId !== targetSectionId) {
      return; // Only allow sort within same section for now
    }
    if (draggedLessonInfo.index === targetIndex) {
      return;
    }

    // Deep clone needed because we're mutating nested arrays
    // Cast to Course to avoid 'any' errors
    const newCourse = JSON.parse(JSON.stringify(course)) as Course;
    const section = newCourse.sections?.find((s) => s.id === targetSectionId);

    if (section?.lessons) {
      const [item] = section.lessons.splice(draggedLessonInfo.index, 1);
      if (item) {
        section.lessons.splice(targetIndex, 0, item);

        // Update indices
        section.lessons.forEach((l, i) => {
          l.orderIndex = i;
        });

        // Update cache
        queryClient.setQueryData(['course', course.id], newCourse);

        setDraggedLessonInfo({
          sectionId: targetSectionId,
          index: targetIndex,
        });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
                // Removed autoFocus for A11y warning
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

      <div className="space-y-4">
        {course.sections?.map((section, sectionIndex) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => handleSectionDragStart(sectionIndex)}
            onDragEnter={() => handleSectionDragEnter(sectionIndex)}
            onDragEnd={handleSectionDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              'transition-all duration-200',
              draggedSectionIndex === sectionIndex
                ? 'opacity-50'
                : 'opacity-100',
            )}
          >
            <Card>
              <CardHeader className="py-4 px-6 bg-muted/30 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{section.title}</h3>
                  <span className="text-xs text-muted-foreground ml-2">
                    {section.lessons?.length ?? 0} lessons
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    // eslint-disable-next-line no-alert
                    if (window.confirm('Delete section and all its lessons?')) {
                      deleteSectionMutation.mutate(section.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {section.lessons?.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      draggable
                      onDragStart={(e) =>
                        handleLessonDragStart(section.id, lessonIndex, e)
                      }
                      onDragEnter={(e) => {
                        e.stopPropagation();
                        handleLessonDragEnter(section.id, lessonIndex);
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                        setDraggedLessonInfo(null);
                        // Trigger API update for order here using updateLesson if backend supported bulk
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      className={cn(
                        'transition-all',
                        draggedLessonInfo?.index === lessonIndex &&
                          draggedLessonInfo?.sectionId === section.id
                          ? 'opacity-40 bg-muted'
                          : '',
                      )}
                    >
                      <LessonItem
                        lesson={lesson}
                        courseId={course.id}
                        sectionId={section.id}
                      />
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-muted/10 flex gap-2">
                  <AddLessonDialog
                    sectionId={section.id}
                    courseId={course.id}
                  />
                  <AddQuizDialog sectionId={section.id} courseId={course.id} />
                  <AddAiQuizDialog
                    sectionId={section.id}
                    courseId={course.id}
                    lessons={course.sections?.flatMap(s => s.lessons) ?? []}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

// ... LessonItem and AddLessonDialog components (unchanged from previous) ...
function LessonItem({
  lesson,
  courseId,
  sectionId,
}: {
  lesson: Lesson;
  courseId: string;
  sectionId: string;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteLessonMutation = useMutation({
    mutationFn: coursesApi.deleteLesson,
    onSuccess: () => {
      toast.success('Lesson deleted');
      void queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/20 group">
      <div className="flex items-center gap-3">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {lesson.type === 'quiz' ? (
            <BrainCircuit className="w-4 h-4" />
          ) : (
            <LayoutList className="w-4 h-4" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">{lesson.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lesson.type === 'quiz' ? (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                Quiz
              </Badge>
            ) : (
              <span>{Math.round((lesson.durationSeconds ?? 0) / 60)} min</span>
            )}
            {lesson.isFreePreview && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                Preview
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {lesson.type === 'quiz' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(
                `/instructor/courses/${courseId}/quizzes/${lesson.id}/edit`,
              )
            } // Using lesson ID to find quiz later
          >
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <AddLessonDialog
            sectionId={sectionId}
            courseId={courseId}
            existingLesson={lesson}
            trigger={
              <Button variant="ghost" size="sm">
                <Pencil className="w-4 h-4" />
              </Button>
            }
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            // eslint-disable-next-line no-alert
            if (window.confirm('Delete lesson?')) {
              deleteLessonMutation.mutate(lesson.id);
            }
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    resolver: zodResolver(lessonSchema) as any,
    defaultValues: {
      title: existingLesson?.title ?? '',
      isFreePreview: existingLesson?.isFreePreview ?? false,
      durationSeconds: existingLesson?.durationSeconds ?? 0,
      content: existingLesson?.content ?? [],
    },
  });

  // Use useWatch instead of form.watch to support React Compiler memoization
  const durationSeconds = useWatch({
    control: form.control,
    name: 'durationSeconds',
  });
  const durationInMinutes = Math.round((durationSeconds ?? 0) / 60);
  const watchedContent = useWatch({ control: form.control, name: 'content' });

  useEffect(() => {
    if (open) {
      form.reset({
        title: existingLesson?.title ?? '',
        isFreePreview: existingLesson?.isFreePreview ?? false,
        durationSeconds: existingLesson?.durationSeconds ?? 0,
        content: existingLesson?.content ?? [],
      });
    }
  }, [open, existingLesson, form]);

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
              />
            </div>
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
            <Button type="submit" disabled={mutation.isPending}>
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

function AddQuizDialog({
  sectionId,
  courseId,
  trigger,
}: {
  sectionId: string;
  courseId: string;
  trigger?: React.ReactNode;
}) {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await coursesApi.createLesson(sectionId, {
        title: title.trim(),
        type: 'quiz',
        content: [],
        durationSeconds: 0,
        isFreePreview: false,
        orderIndex: 0,
      });

      toast.success('Quiz added');
      setOpen(false);
      setTitle('');
      void queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    } catch (error) {
      console.error(error);
      toast.error('Unable to create quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="w-full border-dashed">
            <FileQuestion className="w-4 h-4 mr-2" /> Add Quiz
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Quiz</DialogTitle>
          <DialogDescription>
            Create a manual quiz for this section.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="quiz-title" className="text-sm font-medium">
              Quiz Title
            </label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1 Quiz"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create Quiz
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddAiQuizDialog({
  sectionId,
  courseId,
  lessons,
  trigger,
}: {
  sectionId: string;
  courseId: string;
  lessons: { id: string; title: string }[];
  trigger?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger ?? (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => setOpen(true)}
        >
          <BrainCircuit className="w-4 h-4 mr-2" /> AI Quiz
        </Button>
      )}

      <QuizGenerationModal
        isOpen={open}
        onClose={() => setOpen(false)}
        courseId={courseId}
        sectionId={sectionId}
        lessons={lessons}
        onSave={async ({ questions, title }) => {
          try {
            const quizTitle = title || `AI Quiz ${new Date().toISOString().slice(0, 10)}`;

            // 1. Create Lesson
            const lesson = await coursesApi.createLesson(sectionId, {
              title: quizTitle,
              type: 'quiz',
              content: [],
              durationSeconds: 0,
              isFreePreview: false,
              orderIndex: 0
            });

            // 2. Create Quiz with questions
            // Use dynamic import for now to avoid dealing with top-level imports that might be tricky if I can't see them all
            // Or assume quizzesApi is available - but it's not.
            const { quizzesApi } = await import('@/features/quizzes/api/quizzes-api');

            await quizzesApi.createQuiz({
              title: quizTitle,
              lessonId: lesson.id,
              courseId,
              questions
            });

            toast.success("AI Quiz Created!");
            void queryClient.invalidateQueries({ queryKey: ['course', courseId] });
          } catch (e) {
            console.error(e);
            toast.error("Failed to save quiz");
          }
        }}
      />
    </>
  );
}
