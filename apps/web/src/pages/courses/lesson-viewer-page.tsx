import { useState, useEffect, useRef } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  FileText,
  CheckCircle,
  ChevronLeft,
  Menu,
  X,
  Loader2,
  Lock,
  Code as CodeIcon,
  CircleHelp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

import { IdePanel } from '@/components/ide/ide-panel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/use-auth';
import { AuthRequiredModal } from '@/features/auth/components/auth-required-modal';
import {
  coursesApi,
  type Lesson,
  type LessonBlock,
} from '@/features/courses/api/courses-api';
import { quizzesApi } from '@/features/quizzes/api/quizzes-api';
import { QuizPlayer } from '@/features/quizzes/components/quiz-player';
import { cn, getYoutubeId, getVimeoId } from '@/lib/utils';

// --- Block Renderers ---

function VideoBlock({ content }: { content: string }) {
  if (!content) {
    return null;
  }

  const youtubeId = getYoutubeId(content);
  const vimeoId = getVimeoId(content);

  if (youtubeId) {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm my-6 bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          className="w-full h-full"
          title="YouTube Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm my-6 bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          className="w-full h-full"
          title="Vimeo Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const isDirectVideo = /\.(mp4|webm|ogg)$/i.test(content);
  if (isDirectVideo) {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm my-6 bg-black">
        <video controls className="w-full h-full">
          <source src={content} />
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // If it's not a recognized video format but in a video block, still try video tag
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm my-6 bg-black font-medium">
      <video controls className="w-full h-full" src={content}>
        <track kind="captions" />
      </video>
    </div>
  );
}

function CodeBlock({
  content,
  language = 'javascript',
}: {
  content: string;
  language?: string;
}) {
  return (
    <div className="my-6 rounded-xl overflow-hidden border border-border bg-[#1e1e1e] text-white">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CodeIcon className="w-3 h-3" />
          <span className="uppercase">{language}</span>
        </div>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(content).then(() => {
              toast.success('Code copied!');
            });
          }}
          className="text-xs hover:text-white transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{content}</code>
      </pre>
    </div>
  );
}

function ImageBlock({
  content,
  caption,
}: {
  content: string;
  caption?: string;
}) {
  const youtubeId = getYoutubeId(content);
  const vimeoId = getVimeoId(content);
  const isDirectVideo = /\.(mp4|webm|ogg)$/i.test(content);
  const isVideo = Boolean(youtubeId ?? vimeoId ?? isDirectVideo);

  return (
    <figure className="my-8">
      {isVideo ? (
        <VideoBlock content={content} />
      ) : (
        <img
          src={content}
          alt={caption ?? 'Lesson image'}
          className="rounded-xl w-full object-contain max-h-100 border border-border shadow-sm bg-black/5"
          onError={(e) => {
            // If it failed as image, and we didn't catch it as video, show placeholder
            (e.target as HTMLImageElement).src =
              'https://placehold.co/600x400?text=Invalid+Media+URL';
          }}
        />
      )}
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// --- Custom Markdown Components ---
const markdownComponents = {
  h1: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn('text-3xl font-bold mt-8 mb-4', className)} {...props}>
      {children}
    </h1>
  ),
  h2: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn('text-2xl font-bold mt-6 mb-3', className)} {...props}>
      {children}
    </h2>
  ),
  h3: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn('text-xl font-semibold mt-4 mb-2', className)} {...props}>
      {children}
    </h3>
  ),
  p: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn('leading-7 mb-4', className)} {...props}>
      {children}
    </p>
  ),
  ul: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className={cn('list-disc list-outside ml-6 mb-4', className)}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className={cn('list-decimal list-outside ml-6 mb-4', className)}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn('mb-1', className)} {...props}>
      {children}
    </li>
  ),
  blockquote: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className={cn('border-l-4 border-primary/30 pl-4 italic my-4', className)}
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({
    className,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className={cn(
        'text-primary underline underline-offset-4 hover:text-primary/80',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
  code: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        'bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </code>
  ),
  del: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => (
    <del
      className={cn('line-through text-muted-foreground/80', className)}
      {...props}
    >
      {children}
    </del>
  ),
};

// --- Main Content Renderer ---

function LessonContent({ blocks }: { blocks: LessonBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No content available for this lesson.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {blocks
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((block) => {
          switch (block.type) {
            case 'text': {
              return (
                <div key={block.id} className="max-w-none my-6 text-foreground">
                  <ReactMarkdown
                    components={markdownComponents}
                    remarkPlugins={[remarkGfm]}
                  >
                    {block.content}
                  </ReactMarkdown>
                </div>
              );
            }
            case 'video': {
              return <VideoBlock key={block.id} content={block.content} />;
            }
            case 'image': {
              return (
                <ImageBlock
                  key={block.id}
                  content={block.content}
                  caption={block.metadata?.caption}
                />
              );
            }
            case 'code': {
              return (
                <CodeBlock
                  key={block.id}
                  content={block.content}
                  language={block.metadata?.language}
                />
              );
            }
            default: {
              return null;
            }
          }
        })}
    </div>
  );
}

// --- Quiz Component ---

// --- Quiz Component ---

function QuizSection({
  lessonId,
  isEnrolled,
  onComplete,
  onHasQuiz,
}: {
  lessonId: string;
  isEnrolled: boolean;
  onComplete: () => void;
  onHasQuiz: (hasQuiz: boolean) => void;
}) {
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', 'lesson', lessonId],
    queryFn: async () => {
      try {
        return await quizzesApi.getQuizByLessonId(lessonId);
      } catch (error) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(lessonId) && isEnrolled,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      onHasQuiz(Boolean(quiz && quiz.questions.length > 0));
    }
  }, [quiz, isLoading, onHasQuiz]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return null;
  }

  return (
    <div className="my-10">
      <h2 className="text-2xl font-bold mb-6">Lesson Quiz</h2>
      <QuizPlayer quiz={quiz} onComplete={onComplete} />
    </div>
  );
}
// --- Main Page Component ---

export function LessonViewerPage() {
  // Use default value to avoid non-null assertions later
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Lesson Completion Restrictions
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);

  const lessonIdFromUrl = searchParams.get('lesson');

  // Fetch Course
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.getCourse(id),
    enabled: Boolean(id),
  });

  // Fetch Enrollment
  const {
    data: enrollment,
    isLoading: isLoadingEnrollment,
    isFetching: isFetchingEnrollment,
    status: enrollmentStatus,
    error: enrollmentError,
    refetch: refetchEnrollment,
  } = useQuery({
    queryKey: ['enrollment', id],
    queryFn: () => coursesApi.getEnrollment(id),
    enabled: Boolean(id) && isAuthenticated,
  });

  const isEnrolled = enrollment?.isEnrolled ?? false;
  const activeLessonId =
    lessonIdFromUrl ?? course?.sections?.[0]?.lessons?.[0]?.id;

  // Find active lesson
  const currentLesson: Lesson | undefined = course?.sections?.reduce<
    Lesson | undefined
  >(
    (found, section) =>
      found ?? section.lessons.find((l) => l.id === activeLessonId),
    undefined,
  );

  // Reset completion states when lesson changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasScrolledToBottom(false);
      setHasQuiz(false); // Reset/trust QuizSection to update this
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeLessonId]);

  // Check initial scroll height (if content fits without scrolling)
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        // If content is shorter than or equal to container (with small tolerance)
        if (scrollHeight <= clientHeight + 50) {
          setHasScrolledToBottom(true);
        }
      }
    };
    // Check after a short delay to allow content rendering (images, etc)
    const timer = setTimeout(checkScroll, 1000);
    return () => clearTimeout(timer);
  }, [currentLesson]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      // Check if reached bottom (within 50px tolerance)
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const isPreviewLesson = currentLesson?.isFreePreview ?? false;
  const isInstructor = Boolean(
    isAuthenticated && user?.id && course?.instructor?.id === user.id,
  );
  const isAdmin = Boolean(isAuthenticated && user?.role === 'admin');
  const hasCourseAccess =
    (enrollment?.hasAccess ?? false) || isInstructor || isAdmin;
  const hasAccess = hasCourseAccess || isPreviewLesson;
  const shouldShowAuthModal =
    !isLoadingEnrollment &&
    !isLoadingCourse &&
    course &&
    !hasAccess &&
    !isAuthenticated;

  const accessRedirectedRef = useRef(false);
  const enrollGraceAttemptsRef = useRef(0);

  // Auth/Access Redirect Logic
  useEffect(() => {
    // Wait until both course and enrollment queries have settled.
    // React Query can be in a refetching state where isLoading=false but isFetching=true.
    if (isLoadingCourse || isFetchingEnrollment) {
      return;
    }

    if (course && !hasAccess && isAuthenticated) {
      const cameFromEnroll = Boolean(
        (location.state as { fromEnroll?: boolean } | null)?.fromEnroll,
      );

      // Enrollment can briefly lag behind after enrolling, and in some cases the
      // enrollment endpoint can return a transient 404 right after navigation or refresh.
      // Give it a few short retries before showing an error + redirecting back.
      const status = isAxiosError(enrollmentError)
        ? enrollmentError.response?.status
        : undefined;

      const shouldGraceRetry =
        cameFromEnroll ||
        (status === 404 && enrollGraceAttemptsRef.current < 2);

      // If enrollment is still not available (or transient 404), retry a few times.
      if (shouldGraceRetry && enrollGraceAttemptsRef.current < 3) {
        enrollGraceAttemptsRef.current += 1;
        const retryDelayMs = 350 * enrollGraceAttemptsRef.current;

        // Only retry if we don't already have an enrollment payload.
        if (!enrollment || status === 404) {
          const timer = setTimeout(() => {
            void refetchEnrollment();
          }, retryDelayMs);
          return () => clearTimeout(timer);
        }
      }

      // Prevent duplicate toasts/redirects in React StrictMode.
      if (accessRedirectedRef.current) {
        return;
      }
      accessRedirectedRef.current = true;

      // Only show the enroll-required toast when we are confident the user truly has no access.
      // - If we successfully fetched enrollment and hasAccess is false, user isn't allowed.
      // - If the enrollment endpoint returns 404 after grace retries, user isn't enrolled.
      const isConfirmedNotEnrolled = status === 404;
      const isConfirmedNoAccess = enrollmentStatus === 'success';

      if (isConfirmedNoAccess || isConfirmedNotEnrolled) {
        toast.error('Please enroll in this course to access lessons');
        void navigate(`/courses/${id}`, { replace: true });
      }
    }
  }, [
    isLoadingCourse,
    isFetchingEnrollment,
    course,
    hasAccess,
    isAuthenticated,
    id,
    navigate,
    location.state,
    enrollment,
    enrollmentError,
    enrollmentStatus,
    refetchEnrollment,
  ]);

  const completeLessonMutation = useMutation({
    mutationFn: (variables: { lessonId: string; suppressToast?: boolean }) =>
      coursesApi.completeLesson(id, variables.lessonId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
      if (!variables.suppressToast) {
        toast.success('Lesson completed!');
      }
    },
  });

  // Handle Loading States
  if (isLoadingCourse || (isAuthenticated && isLoadingEnrollment) || !course) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedIds = enrollment?.progress?.completedLessonIds ?? [];
  const isLessonCompleted =
    currentLesson && completedIds.includes(currentLesson.id);

  // Determine if Mark Complete button should be disabled
  const isCompletionDisabled =
    !isLessonCompleted && // already completed -> explicit enable (looks better)
    (completeLessonMutation.isPending ||
      hasQuiz || // Must complete via quiz
      !hasScrolledToBottom); // Must scroll to bottom

  return (
    <>
      <AuthRequiredModal
        isOpen={Boolean(shouldShowAuthModal) || showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          void navigate(`/courses/${id}`);
        }}
      />

      <div className="h-screen flex flex-col overflow-hidden bg-background">
        {/* Top Header */}
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
            <div className="h-6 w-px bg-border hidden md:block" />
            <span className="font-semibold hidden md:inline-block text-sm">
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
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={cn(
              'flex-1 overflow-y-auto bg-background scroll-smooth',
              currentLesson?.ideConfig &&
                'grid lg:grid-cols-2 gap-0 overflow-hidden',
            )}
          >
            {/* If IDE enabled, wrap content in a div that scrolls independently or fits in grid */}
            <div
              className={cn(
                'max-w-4xl mx-auto p-6 md:p-10 w-full',
                currentLesson?.ideConfig &&
                  'overflow-y-auto h-full max-w-none p-6',
              )}
            >
              {currentLesson ? (
                <>
                  <div className="mb-8 border-b border-border pb-6">
                    <h1 className="text-3xl font-bold tracking-tight mb-4">
                      {currentLesson.title}
                    </h1>
                    {isEnrolled && !isInstructor && !isAdmin && (
                      <div className="flex items-center gap-4">
                        {(() => {
                          if (currentLesson.type === 'quiz') {
                            if (isLessonCompleted) {
                              return (
                                <Button
                                  size="sm"
                                  disabled
                                  variant="outline"
                                  className="text-green-700 border-green-400 bg-green-100/50 font-bold opacity-100"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2 stroke-3" />
                                  Completed
                                </Button>
                              );
                            }
                            return (
                              <Button
                                size="sm"
                                disabled
                                className="bg-orange-500 hover:bg-orange-600 text-white border-none font-bold"
                              >
                                <Loader2 className="w-4 h-4 mr-2" />
                                Pass quiz to complete
                              </Button>
                            );
                          }
                          // Standard lesson completion UI
                          return (
                            <Button
                              size="sm"
                              onClick={() =>
                                completeLessonMutation.mutate({
                                  lessonId: currentLesson.id,
                                })
                              }
                              disabled={
                                isCompletionDisabled || isLessonCompleted
                              }
                              variant={
                                isLessonCompleted ? 'outline' : 'primary'
                              }
                              className={cn(
                                'font-bold',
                                isLessonCompleted &&
                                  'text-green-700 border-green-400 bg-green-100/50',
                              )}
                            >
                              {isLessonCompleted ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2 stroke-3" />
                                  Completed
                                </>
                              ) : (
                                'Mark as Complete'
                              )}
                            </Button>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Quiz Section */}
                  <QuizSection
                    lessonId={currentLesson.id}
                    isEnrolled={isEnrolled || isInstructor}
                    onComplete={() => {
                      if (!completedIds.includes(currentLesson.id)) {
                        completeLessonMutation.mutate({
                          lessonId: currentLesson.id,
                          suppressToast: true,
                        });
                      }
                    }}
                    onHasQuiz={setHasQuiz}
                  />

                  {/* Render the Block Content */}
                  {currentLesson.type === 'quiz' &&
                  (currentLesson.content?.length ?? 0) === 0 ? null : (
                    <LessonContent blocks={currentLesson.content} />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select a lesson from the sidebar to start learning</p>
                </div>
              )}
            </div>

            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
              const ideConfig = currentLesson?.ideConfig as any;
              if (!ideConfig) {
                return null;
              }

              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              const normalizedConfig = ideConfig.allowedLanguages
                ? ideConfig
                : {
                    allowedLanguages: [
                      {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-nullish-coalescing
                        language: ideConfig.language || 'javascript',
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-nullish-coalescing
                        initialCode: ideConfig.initialCode || '',
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        expectedOutput: ideConfig.expectedOutput,
                      },
                    ],
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-nullish-coalescing
                    defaultLanguage: ideConfig.language || 'javascript',
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    instructions: ideConfig.instructions,
                  };

              return (
                <div className="hidden lg:block h-full border-l border-border overflow-hidden">
                  <IdePanel
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    allowedLanguages={normalizedConfig.allowedLanguages}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    defaultLanguage={normalizedConfig.defaultLanguage}
                    lessonId={currentLesson?.id || 'preview'}
                    onSuccess={() => {
                      if (!isLessonCompleted && currentLesson) {
                        completeLessonMutation.mutate({
                          lessonId: currentLesson.id,
                        });
                      }
                    }}
                  />
                </div>
              );
            })()}
          </div>

          {/* Sidebar Navigation */}
          <div
            className={cn(
              'w-80 bg-card border-l border-border flex flex-col absolute inset-y-0 right-0 transform transition-transform duration-300 lg:relative lg:translate-x-0 z-10',
              isSidebarOpen ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="p-4 border-b border-border font-semibold flex justify-between items-center bg-muted/30">
              <span>Course Content</span>
              {!isInstructor && !isAdmin && isEnrolled && (
                <span className="text-xs font-normal text-muted-foreground">
                  {Math.round(
                    (completedIds.length /
                      (course.sections?.reduce(
                        (acc, s) => acc + s.lessons.length,
                        0,
                      ) ?? 1)) *
                      100,
                  )}
                  % complete
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {course.sections?.map((section) => (
                <div
                  key={section.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <div className="bg-muted/50 px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                    {section.title}
                  </div>
                  <div>
                    {section.lessons.map((lesson, index) => {
                      const isCompleted = completedIds.includes(lesson.id);
                      const isActive = activeLessonId === lesson.id;
                      const canAccess = hasCourseAccess || lesson.isFreePreview;
                      const isLocked = !canAccess;

                      const typeLabel =
                        lesson.type === 'quiz' ? 'Quiz' : 'Lesson';
                      const typeIcon =
                        lesson.type === 'quiz' ? (
                          <CircleHelp className="w-3 h-3" aria-hidden="true" />
                        ) : (
                          <FileText className="w-3 h-3" aria-hidden="true" />
                        );

                      // Resolve icon based on status to avoid nested ternary
                      let statusIcon;
                      if (isLocked) {
                        statusIcon = <Lock className="w-4 h-4" />;
                      } else if (isCompleted) {
                        statusIcon = (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        );
                      } else {
                        statusIcon = (
                          <span className="text-xs font-mono font-medium opacity-70">
                            {index + 1}
                          </span>
                        );
                      }

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            if (isLocked) {
                              if (!isAuthenticated) {
                                setShowAuthModal(true);
                              } else {
                                toast.error(
                                  'Please enroll in this course to unlock this lesson',
                                );
                              }
                              return;
                            }
                            setSearchParams({ lesson: lesson.id });
                            if (window.innerWidth < 1024) {
                              setIsSidebarOpen(false);
                            }
                          }}
                          disabled={isLocked && isAuthenticated}
                          className={cn(
                            'w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all border-l-[3px] hover-highlight',
                            isActive
                              ? 'bg-primary/5 border-primary'
                              : 'border-transparent hover:bg-muted/50',
                            isLocked &&
                              'opacity-60 cursor-not-allowed bg-muted/10',
                          )}
                        >
                          <div
                            className={cn(
                              'mt-0.5 shrink-0',
                              isActive
                                ? 'text-primary'
                                : 'text-muted-foreground',
                            )}
                          >
                            {statusIcon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-sm font-medium leading-snug truncate',
                                isActive ? 'text-primary' : 'text-foreground',
                              )}
                            >
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                {Math.floor(lesson.durationSeconds / 60)} min
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                {typeIcon}
                                <span>{typeLabel}</span>
                              </span>
                              {lesson.isFreePreview && !isEnrolled && (
                                <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-medium">
                                  Free
                                </span>
                              )}
                            </div>
                          </div>
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
