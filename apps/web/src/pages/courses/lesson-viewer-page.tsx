import { useState, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  FileText,
  CheckCircle,
  ChevronLeft,
  Menu,
  X,
  Loader2,
  Lock,
} from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/use-auth';
import { AuthRequiredModal } from '@/features/auth/components/auth-required-modal';
import { coursesApi, type Lesson } from '@/features/courses/api/courses-api';
import { cn } from '@/lib/utils';

// Helper function to get sidebar lesson icon
function getSidebarLessonIcon(isCompleted: boolean, lessonType: string) {
  if (isCompleted) {
    return <CheckCircle className="w-4 h-4" />;
  }
  if (lessonType === 'video') {
    return <PlayCircle className="w-4 h-4" />;
  }
  return <FileText className="w-4 h-4" />;
}

// Helper function to get sidebar icon color class
function getSidebarIconColor(isLocked: boolean, isCompleted: boolean) {
  if (isLocked) {
    return 'text-muted-foreground/50';
  }
  if (isCompleted) {
    return 'text-green-600';
  }
  return 'text-muted-foreground';
}

// Helper function to render video content
function renderVideoContent(lesson: Lesson) {
  if (!lesson.videoUrl) {
    return (
      <div className="flex items-center justify-center h-full text-white/50">
        No video URL provided
      </div>
    );
  }

  if (lesson.videoUrl.includes('youtube')) {
    return (
      <iframe
        src={lesson.videoUrl.replace('watch?v=', 'embed/')}
        className="w-full h-full"
        title={lesson.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video controls className="w-full h-full">
      <source src={lesson.videoUrl} type="video/mp4" />
      <track kind="captions" srcLang="en" label="English" default />
      Your browser does not support the video tag.
    </video>
  );
}

// Helper function to render lesson content
function renderLessonContent(lesson: Lesson) {
  if (lesson.type === 'video') {
    return renderVideoContent(lesson);
  }

  return (
    <div className="bg-card h-full p-8 overflow-y-auto prose dark:prose-invert max-w-none">
      <h1>{lesson.title}</h1>
      <div
        dangerouslySetInnerHTML={{
          __html: lesson.content ?? '',
        }}
      />
    </div>
  );
}

export function LessonViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated } = useAuth();

  // Get lesson ID from URL search params
  const lessonIdFromUrl = searchParams.get('lesson');

  // Fetch Course
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.getCourse(id ?? ''),
    enabled: Boolean(id),
  });

  // Fetch Enrollment/Progress - this determines if user can access lessons
  const { data: enrollment, isLoading: isLoadingEnrollment } = useQuery({
    queryKey: ['enrollment', id],
    queryFn: () => coursesApi.getEnrollment(id ?? ''),
    enabled: Boolean(id) && isAuthenticated,
  });

  const isEnrolled = enrollment?.isEnrolled ?? false;

  // Get active lesson ID from URL or default to first lesson
  const activeLessonId =
    lessonIdFromUrl ?? course?.sections?.[0]?.lessons?.[0]?.id;

  // Find current lesson based on activeLessonId
  const currentLesson: Lesson | undefined = course?.sections?.reduce<
    Lesson | undefined
  >(
    (found, section) =>
      found ?? section.lessons.find((l) => l.id === activeLessonId),
    undefined,
  );

  // Check if current lesson is a free preview
  const isPreviewLesson = currentLesson?.isFreePreview ?? false;

  // Determine if user has access: enrolled OR viewing a free preview lesson
  const hasAccess = isEnrolled || isPreviewLesson;

  // Compute if modal should be shown for guest users trying to access non-preview lessons
  const shouldShowAuthModal =
    !isLoadingEnrollment &&
    !isLoadingCourse &&
    course !== undefined &&
    !hasAccess &&
    !isAuthenticated;

  // Redirect to course page if authenticated but not enrolled AND not viewing a preview lesson
  useEffect(() => {
    if (
      !isLoadingEnrollment &&
      !isLoadingCourse &&
      course &&
      !hasAccess &&
      isAuthenticated
    ) {
      toast.error('You must enroll in this course to access this lesson');
      void navigate(`/courses/${id}`, { replace: true });
    }
  }, [
    isLoadingEnrollment,
    isLoadingCourse,
    course,
    hasAccess,
    isAuthenticated,
    id,
    navigate,
  ]);

  // Complete Lesson Mutation
  const completeLessonMutation = useMutation({
    mutationFn: (lessonId: string) =>
      coursesApi.completeLesson(id ?? '', lessonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
    },
  });

  if (isLoadingCourse || (isAuthenticated && isLoadingEnrollment) || !course) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If authenticated user doesn't have access (not enrolled AND not a preview lesson), show loading while redirect happens
  if (!hasAccess && isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // For guest users without access, show the modal overlay on the lesson viewer
  // (The modal is shown in the main return below)

  const completedIds = enrollment?.progress?.completedLessonIds ?? [];

  return (
    <>
      <AuthRequiredModal
        isOpen={shouldShowAuthModal || showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // Navigate back to course page when modal is closed
          void navigate(`/courses/${id}`, { replace: true });
        }}
        title="Join Learnix to Continue"
        description="Create a free account to enroll in courses, track your progress, and access exclusive content."
      />
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        {/* Top Bar */}
        <div className="h-16 border-b border-border bg-card flex items-center px-4 justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/courses/${id}`)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
            <span className="font-semibold hidden md:inline-block border-l border-border pl-4">
              {course.title}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            <div className="max-w-4xl mx-auto space-y-6">
              {currentLesson ? (
                <>
                  <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative">
                    {renderLessonContent(currentLesson)}
                  </div>

                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">
                      {currentLesson.title}
                    </h1>
                    {isEnrolled && (
                      <Button
                        size="lg"
                        onClick={() => {
                          void completeLessonMutation.mutate(currentLesson.id);
                        }}
                        disabled={
                          completedIds.includes(currentLesson.id) ||
                          completeLessonMutation.isPending
                        }
                        className={cn(
                          completedIds.includes(currentLesson.id) &&
                            'bg-green-600 hover:bg-green-700 text-white',
                        )}
                      >
                        {completedIds.includes(currentLesson.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          'Mark as Complete'
                        )}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground mt-20">
                  Select a lesson to start learning
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Course Content */}
          <div
            className={cn(
              'w-80 bg-card border-l border-border flex flex-col absolute inset-y-0 right-0 transform transition-transform duration-300 lg:relative lg:translate-x-0 z-10',
              isSidebarOpen ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="p-4 border-b border-border font-semibold">
              Course Content
            </div>
            <div className="flex-1 overflow-y-auto">
              {course.sections?.map((section) => (
                <div key={section.id}>
                  <div className="bg-muted/30 px-4 py-3 text-sm font-medium sticky top-0 backdrop-blur-sm">
                    {section.title}
                  </div>
                  <div>
                    {section.lessons.map((lesson) => {
                      const isCompleted = completedIds.includes(lesson.id);
                      const isActive = activeLessonId === lesson.id;
                      const canAccess = isEnrolled || lesson.isFreePreview;
                      const isLocked = !canAccess;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            if (isLocked) {
                              if (!isAuthenticated) {
                                // Show auth modal for guest users
                                setShowAuthModal(true);
                              } else {
                                // Show toast for authenticated users
                                toast.error(
                                  'Please enroll in this course to access this lesson',
                                );
                              }
                              return;
                            }
                            setSearchParams({ lesson: lesson.id });
                            if (window.innerWidth < 1024) {
                              setIsSidebarOpen(false);
                            }
                          }}
                          className={cn(
                            'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-l-2 border-transparent',
                            isActive && 'bg-primary/5 border-primary',
                            isLocked
                              ? 'cursor-not-allowed opacity-60'
                              : 'hover:bg-muted/50',
                          )}
                          disabled={isLocked && isAuthenticated}
                        >
                          <div
                            className={cn(
                              'mt-0.5 shrink-0',
                              getSidebarIconColor(isLocked, isCompleted),
                            )}
                          >
                            {isLocked ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              getSidebarLessonIcon(isCompleted, lesson.type)
                            )}
                          </div>
                          <span
                            className={cn(
                              'text-sm',
                              isLocked && 'text-muted-foreground/50',
                              !isLocked &&
                                isActive &&
                                'font-medium text-primary',
                              !isLocked && !isActive && 'text-muted-foreground',
                              isCompleted &&
                                !isLocked &&
                                'line-through opacity-70',
                            )}
                          >
                            {lesson.title}
                          </span>
                          {lesson.isFreePreview && !isEnrolled && (
                            <span className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">
                              Preview
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LessonViewerPage;
