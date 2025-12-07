import { useState, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  CheckCircle,
  ChevronLeft,
  Menu,
  X,
  Loader2,
  Lock,
  Code as CodeIcon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

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
import { cn } from '@/lib/utils';

// --- Block Renderers ---

function VideoBlock({ content }: { content: string }) {
  if (!content) {
    return null;
  }

  // Simple YouTube/Vimeo check (can be expanded)
  const isYouTube =
    content.includes('youtube.com') || content.includes('youtu.be');

  if (isYouTube) {
    // Extract video ID or use embed URL logic
    const embedUrl = content.includes('embed')
      ? content
      : content.replace('watch?v=', 'embed/').split('&')[0];

    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm my-6 bg-black">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          title="Video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Native Video
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm my-6 bg-black">
      <video controls className="w-full h-full">
        <source src={content} type="video/mp4" />
        <track kind="captions" />
        Your browser does not support the video tag.
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
  return (
    <figure className="my-8">
      <img
        src={content}
        alt={caption ?? 'Lesson image'}
        className="rounded-xl w-full object-cover max-h-[600px] border border-border shadow-sm"
      />
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

function QuizSection({ lessonId, isEnrolled, onComplete }: { lessonId: string, isEnrolled: boolean, onComplete: () => void }) {
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
    <div className="my-10 border-t border-border pt-10">
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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated } = useAuth();

  const lessonIdFromUrl = searchParams.get('lesson');

  // Fetch Course
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.getCourse(id),
    enabled: Boolean(id),
  });

  // Fetch Enrollment
  const { data: enrollment, isLoading: isLoadingEnrollment } = useQuery({
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

  const isPreviewLesson = currentLesson?.isFreePreview ?? false;
  const hasAccess = isEnrolled || isPreviewLesson;
  const shouldShowAuthModal =
    !isLoadingEnrollment &&
    !isLoadingCourse &&
    course &&
    !hasAccess &&
    !isAuthenticated;

  // Auth/Access Redirect Logic
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

  const completeLessonMutation = useMutation({
    mutationFn: (lessonId: string) => coursesApi.completeLesson(id, lessonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
      toast.success('Lesson completed!');
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
          <div className="flex-1 overflow-y-auto bg-background scroll-smooth">
            <div className="max-w-4xl mx-auto p-6 md:p-10">
              {currentLesson ? (
                <>
                  <div className="mb-8 border-b border-border pb-6">
                    <h1 className="text-3xl font-bold tracking-tight mb-4">
                      {currentLesson.title}
                    </h1>
                    {isEnrolled && (
                      <div className="flex items-center gap-4">
                        <Button
                          size="sm"
                          onClick={() =>
                            completeLessonMutation.mutate(currentLesson.id)
                          }
                          disabled={
                            completedIds.includes(currentLesson.id) ||
                            completeLessonMutation.isPending
                          }
                          variant={
                            completedIds.includes(currentLesson.id)
                              ? 'outline'
                              : 'primary'
                          }
                          className={cn(
                            completedIds.includes(currentLesson.id) &&
                            'text-green-600 border-green-200 bg-green-50',
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
                      </div>
                    )}
                  </div>

                  {/* Quiz Section */}
                  <QuizSection
                    lessonId={currentLesson.id}
                    isEnrolled={isEnrolled}
                    onComplete={() => {
                      if (!completedIds.includes(currentLesson.id)) {
                        completeLessonMutation.mutate(currentLesson.id);
                      }
                    }}
                  />

                  {/* Render the Block Content */}
                  <LessonContent blocks={currentLesson.content} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select a lesson from the sidebar to start learning</p>
                </div>
              )}
            </div>
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
                      const canAccess = isEnrolled || lesson.isFreePreview;
                      const isLocked = !canAccess;

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
                                toast.error('Enroll to unlock');
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
                            'w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all border-l-[3px]',
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
