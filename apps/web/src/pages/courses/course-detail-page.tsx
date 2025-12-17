import { useState } from 'react'; // Added useState

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  BookOpen,
  PlayCircle,
  FileText,
  Lock,
  CheckCircle,
  Loader2,
  Users,
  Clock,
  Calendar,
  User,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PageContainer } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/use-auth';
import { AuthRequiredModal } from '@/features/auth/components/auth-required-modal';
import { coursesApi } from '@/features/courses/api/courses-api';
import {
  cn,
  formatLastUpdated,
  formatStudentCount,
  formatDate,
} from '@/lib/utils';

// Helper function to get lesson icon
function getLessonIcon(isCompleted: boolean, lessonType: string) {
  if (isCompleted) {
    return <CheckCircle className="w-4 h-4" />;
  }
  if (lessonType === 'video') {
    return <PlayCircle className="w-4 h-4" />;
  }
  return <FileText className="w-4 h-4" />;
}

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.getCourse(id ?? ''),
    enabled: Boolean(id),
  });

  const { data: enrollment, isLoading: isLoadingEnrollment } = useQuery({
    queryKey: ['enrollment', id],
    queryFn: () => coursesApi.getEnrollment(id ?? ''),
    enabled: Boolean(id) && isAuthenticated,
  });

  const enrollMutation = useMutation({
    mutationFn: () => coursesApi.enroll(id ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
      void navigate(`/courses/${id}/learn`);
    },
    onError: (error: unknown) => {
      // Check for ConflictException (409) which acts as our self-enrollment guard
      if (isAxiosError(error) && error.response?.status === 409) {
        toast.error('You cannot enroll in your own course');
      } else {
        toast.error('Failed to enroll in course. Please try again.');
      }
    },
  });

  const handleEnroll = () => {
    // Show modal instead of redirect
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    void enrollMutation.mutate();
  };

  // Handle locked lesson click
  const handleLockedLessonClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // If authenticated but not enrolled, show toast
    toast.info('Enroll in this course to access all lessons');
  };

  if (isLoadingCourse) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (!course) {
    return <div className="p-8 text-center">Course not found</div>;
  }

  const totalLessons =
    course.sections?.reduce(
      (acc, section) => acc + section.lessons.length,
      0,
    ) ?? 0;

  // Force isEnrolled to false if not authenticated, ignoring cached enrollment data
  const isEnrolled = isAuthenticated && enrollment?.isEnrolled;
  const completedIds = enrollment?.progress?.completedLessonIds ?? [];

  return (
    <PageContainer>
      <div className="space-y-8 animate-fade-in">
        <AuthRequiredModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

        {/* Header */}
        <div className="bg-card rounded-2xl p-8 border border-border shadow-sm flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
              {course.level}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {course.description}
            </p>

            {/* Course Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{totalLessons} Lessons</span>
              </div>
              {course.studentCount !== undefined && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{formatStudentCount(course.studentCount)}</span>
                </div>
              )}
              {course.updatedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatLastUpdated(course.updatedAt)}</span>
                </div>
              )}
              {course.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(course.createdAt)}</span>
                </div>
              )}
            </div>

            {/* Instructor Info */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/50">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {(course.instructor?.fullName ?? course.instructor?.name ?? 'I')
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {course.instructor?.fullName ??
                      course.instructor?.name ??
                      'Instructor'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Course Instructor
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 shrink-0 flex flex-col gap-4 p-6 bg-muted/30 rounded-xl border border-border/50">
            {isEnrolled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  You are enrolled
                </div>
                <Button
                  size="lg"
                  className="w-full font-semibold"
                  onClick={() => navigate(`/courses/${id}/learn`)}
                >
                  Continue Learning
                </Button>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-primary">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </div>
                {isAuthenticated && course.instructor?.id === user?.id ? (
                  <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground border border-border">
                    You are the instructor of this course.
                  </div>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="w-full font-semibold"
                      onClick={handleEnroll}
                      disabled={
                        enrollMutation.isPending ||
                        (isAuthenticated && isLoadingEnrollment)
                      }
                    >
                      {enrollMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />{' '}
                          Enrolling...
                        </>
                      ) : (
                        'Enroll Now'
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Get full lifetime access
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Curriculum */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold">Course Content</h2>

            <div className="space-y-4">
              {course.sections?.map((section) => (
                <div
                  key={section.id}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  <div className="bg-muted/50 px-6 py-4 font-semibold flex justify-between items-center">
                    <span>{section.title}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {section.lessons.length} lessons
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {section.lessons.map((lesson) => {
                      const isCompleted = completedIds.includes(lesson.id);
                      const isLocked = !isEnrolled && !lesson.isFreePreview;

                      const hasVideo = lesson.content?.some(
                        (b) => b.type === 'video',
                      );
                      const derivedType = hasVideo ? 'video' : 'text';

                      return (
                        <div
                          key={lesson.id}
                          role={isLocked ? 'button' : undefined}
                          tabIndex={isLocked ? 0 : undefined}
                          className={cn(
                            'p-4 flex items-center gap-4 transition-colors',
                            isLocked
                              ? 'opacity-75 hover:bg-muted/10 cursor-pointer'
                              : 'hover:bg-muted/20',
                          )}
                          onClick={() => {
                            if (isLocked) {
                              handleLockedLessonClick();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              isLocked &&
                              (e.key === 'Enter' || e.key === ' ')
                            ) {
                              e.preventDefault();
                              handleLockedLessonClick();
                            }
                          }}
                        >
                          <div
                            className={cn(
                              'p-2 rounded-lg',
                              isCompleted
                                ? 'bg-green-100 text-green-600'
                                : 'bg-primary/5 text-primary',
                            )}
                          >
                            {getLessonIcon(isCompleted, derivedType)}
                          </div>
                          <div className="flex-1 text-sm font-medium">
                            {lesson.title}
                          </div>

                          {/* Logic for Buttons/Icons */}
                          {isEnrolled || lesson.isFreePreview ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent parent click
                                void navigate(
                                  `/courses/${id}/learn?lesson=${lesson.id}`,
                                );
                              }}
                            >
                              {isEnrolled ? 'View' : 'Preview'}
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Replaced Icon with Button-like feel or just icon */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-transparent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockedLessonClick();
                                }}
                              >
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default CourseDetailPage;
