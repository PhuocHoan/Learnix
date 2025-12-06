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

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) =>
      coursesApi.updateCourse(courseId ?? '', { isPublished }),
    onSuccess: (_, isPublished) => {
      toast.success(`Course ${isPublished ? 'published' : 'unpublished'}`);
      void queryClient.invalidateQueries({ queryKey: ['course', courseId] });
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
              <Badge variant={course.isPublished ? 'success' : 'secondary'}>
                {course.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <Button
              variant={course.isPublished ? 'outline' : 'primary'}
              onClick={() => publishMutation.mutate(!course.isPublished)}
              disabled={publishMutation.isPending}
            >
              {course.isPublished ? 'Unpublish' : 'Publish Course'}
            </Button>
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
  onSuccess,
}: {
  course?: Course;
  isNew: boolean;
  onSuccess: (id?: string) => void;
}) {
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>(course?.tags ?? []);
  const [tagInput, setTagInput] = useState('');

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
      toast.error('Failed to create course. Check console for details.');
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
      toast.error('Failed to update course');
    },
  });

  const onSubmit = (data: CourseFormData) => {
    // Explicitly construct the payload to match API types and avoid 'any'
    const cleanData = {
      ...data,
      thumbnailUrl: data.thumbnailUrl ?? DEFAULT_THUMBNAIL_URL,
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

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
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
              <CardTitle>Course Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={watchedThumbnailUrl}
                onChange={(url) => form.setValue('thumbnailUrl', url ?? '')}
                className="w-full aspect-video"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Optional. A default image will be used if left empty.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Press Enter to add tags</CardDescription>
            </CardHeader>
            <CardContent>
              <label htmlFor="course-tags" className="sr-only">
                Tags
              </label>
              <Input
                id="course-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="e.g. react, javascript"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
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
                <div className="p-4 bg-muted/10">
                  <AddLessonDialog
                    sectionId={section.id}
                    courseId={course.id}
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
          <LayoutList className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{lesson.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{Math.round((lesson.durationSeconds ?? 0) / 60)} min</span>
            {lesson.isFreePreview && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                Preview
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
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
              <label className="text-sm font-medium">Content Builder</label>
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
