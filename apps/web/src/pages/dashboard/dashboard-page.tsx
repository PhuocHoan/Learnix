import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Clock,
  Target,
  Users,
  Award,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Play,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageContainer } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/use-auth';
import {
  coursesApi,
  type EnrolledCourse,
} from '@/features/courses/api/courses-api';
import { dashboardApi } from '@/features/dashboard/api/dashboard-api';
import { cn, formatRelativeTime } from '@/lib/utils';

// Helper function to get role-based welcome message
function getRoleMessage(role?: string | null): string {
  if (role === 'admin') {
    return 'Monitor platform activity and manage users from your dashboard.';
  }
  if (role === 'instructor') {
    return "Create engaging courses and track your students' progress.";
  }
  return 'Continue your learning journey and track your progress.';
}

// Helper function to get badge variant based on progress
function getProgressBadgeVariant(
  progress: number,
): 'success' | 'warning' | 'default' {
  if (progress >= 80) {
    return 'success';
  }
  if (progress >= 50) {
    return 'warning';
  }
  return 'default';
}

// Helper function to get badge variant based on course level
function getLevelBadgeVariant(
  level: string,
): 'success' | 'warning' | 'default' {
  if (level === 'beginner') {
    return 'success';
  }
  if (level === 'intermediate') {
    return 'warning';
  }
  return 'default';
}

export function DashboardPage() {
  const { user } = useAuth();
  // All authenticated users can be learners
  const isLearner = Boolean(user);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['dashboard', 'progress'],
    queryFn: dashboardApi.getProgress,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: dashboardApi.getActivity,
  });

  // Fetch enrolled courses for "Continue Learning" section (all authenticated users)
  const { data: enrolledCourses, isLoading: enrolledLoading } = useQuery({
    queryKey: ['enrolled-courses', { archived: false }],
    queryFn: () => coursesApi.getEnrolledCourses({ archived: false }),
    enabled: isLearner,
  });

  // Fetch course recommendations based on enrolled course tags
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery(
    {
      queryKey: ['course-recommendations'],
      queryFn: () => coursesApi.getRecommendations(6),
      enabled: isLearner,
    },
  );

  // Get the most recently accessed in-progress course
  const continueLearningCourse: EnrolledCourse | undefined = enrolledCourses
    ?.filter((c) => c.status === 'in-progress')
    ?.sort(
      (a, b) =>
        new Date(b.lastAccessedAt).getTime() -
        new Date(a.lastAccessedAt).getTime(),
    )?.[0];

  // Card config for different stat types
  interface StatCardConfig {
    title: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    subtitle: string;
    valueKey: string;
    format?: (value: number) => string;
    trend?: string;
  }

  const getStatCards = (): StatCardConfig[] => {
    if (user?.role === 'admin') {
      return [
        {
          title: 'Total Users',
          icon: Users,
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-500',
          subtitle: 'Platform users',
          valueKey: 'totalUsers',
          trend: '+12%',
        },
        {
          title: 'Total Courses',
          icon: BookOpen,
          iconBg: 'bg-purple-500/10',
          iconColor: 'text-purple-500',
          subtitle: 'Published courses',
          valueKey: 'totalCourses',
          trend: '+3',
        },
        {
          title: 'Active Students',
          icon: TrendingUp,
          iconBg: 'bg-green-500/10',
          iconColor: 'text-green-500',
          subtitle: 'Learning now',
          valueKey: 'activeStudents',
          trend: '+25%',
        },
      ];
    }
    if (user?.role === 'instructor') {
      return [
        {
          title: 'Your Courses',
          icon: BookOpen,
          iconBg: 'bg-purple-500/10',
          iconColor: 'text-purple-500',
          subtitle: 'Created by you',
          valueKey: 'coursesCreated',
        },
        {
          title: 'Total Students',
          icon: Users,
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-500',
          subtitle: 'Enrolled students',
          valueKey: 'totalStudents',
          trend: '+8',
        },
        {
          title: 'Avg. Rating',
          icon: Award,
          iconBg: 'bg-yellow-500/10',
          iconColor: 'text-yellow-500',
          subtitle: 'Out of 5.0',
          valueKey: 'averageRating',
          format: (v) => v.toFixed(1),
        },
      ];
    }
    // Student
    return [
      {
        title: 'Enrolled Courses',
        icon: BookOpen,
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-500',
        subtitle: 'Active courses',
        valueKey: 'coursesEnrolled',
      },
      {
        title: 'Hours Learned',
        icon: Clock,
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        subtitle: 'Total study time',
        valueKey: 'hoursLearned',
        trend: '+2h',
      },
      {
        title: 'Avg. Score',
        icon: Target,
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-500',
        subtitle: 'Quiz performance',
        valueKey: 'averageScore',
        format: (v) => `${v}%`,
      },
    ];
  };

  const statCards = getStatCards();

  return (
    <PageContainer>
      <div className="space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 sm:p-8 text-white">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/80 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Learning</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back,{' '}
              {user?.name ?? user?.email.split('@')[0] ?? 'Learner'}!
            </h1>
            <p className="text-white/80 max-w-xl">
              {getRoleMessage(user?.role)}
            </p>
          </div>
        </div>

        {/* Continue Learning Section (All Authenticated Users) */}
        {isLearner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Continue Learning</h2>
              </div>
              <Link
                to="/my-learning"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all courses
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {(() => {
              if (enrolledLoading) {
                return (
                  <Card className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <Skeleton className="w-full md:w-72 h-44" />
                      <div className="flex-1 p-6 space-y-4">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-10 w-40" />
                      </div>
                    </div>
                  </Card>
                );
              }
              if (continueLearningCourse) {
                return (
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row">
                      {/* Thumbnail */}
                      <Link
                        to={`/courses/${continueLearningCourse.id}/learn`}
                        className="relative w-full md:w-72 h-44 shrink-0 overflow-hidden"
                      >
                        {continueLearningCourse.thumbnailUrl ? (
                          <img
                            src={continueLearningCourse.thumbnailUrl}
                            alt={continueLearningCourse.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-primary/50" />
                          </div>
                        )}
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                            <Play className="w-7 h-7 text-primary ml-1" />
                          </div>
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <Link
                            to={`/courses/${continueLearningCourse.id}/learn`}
                          >
                            <h3 className="text-xl font-bold hover:text-primary transition-colors line-clamp-1">
                              {continueLearningCourse.title}
                            </h3>
                          </Link>
                          <p className="text-muted-foreground mt-1">
                            {continueLearningCourse.instructor.fullName}
                          </p>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {continueLearningCourse.progress}% complete
                            </span>
                            <span className="text-muted-foreground">
                              {continueLearningCourse.completedLessons} of{' '}
                              {continueLearningCourse.totalLessons} lessons
                            </span>
                          </div>
                          <Progress
                            value={continueLearningCourse.progress}
                            className="h-2"
                          />
                        </div>

                        <div className="mt-4 flex items-center gap-4">
                          <Button asChild size="lg" className="gap-2">
                            <Link
                              to={`/courses/${continueLearningCourse.id}/learn`}
                            >
                              <Play className="w-4 h-4" />
                              Resume Learning
                            </Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link to={`/courses/${continueLearningCourse.id}`}>
                              View Course
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              }
              return (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-primary/60" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Start your learning journey
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Browse our catalog and enroll in a course to start learning
                  </p>
                  <Button asChild>
                    <Link to="/courses">Browse Courses</Link>
                  </Button>
                </Card>
              );
            })()}
          </div>
        )}

        {/* Course Recommendations Section */}
        {isLearner && recommendations && recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold">Recommended for You</h2>
              </div>
              <Link
                to="/courses"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Browse all courses
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recommendationsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-36 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map(({ course, matchingTags, score }) => (
                  <Card
                    key={course.id}
                    className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Thumbnail */}
                    <Link
                      to={`/courses/${course.id}`}
                      className="relative block h-36 overflow-hidden"
                    >
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-primary/50" />
                        </div>
                      )}
                      {/* Score badge */}
                      {score > 0 && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-yellow-950 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {score} {score === 1 ? 'match' : 'matches'}
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="p-4">
                      <Link to={`/courses/${course.id}`}>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        {course.instructor?.fullName ?? 'Unknown Instructor'}
                      </p>

                      {/* Matching tags */}
                      {matchingTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {matchingTags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs bg-primary/10 text-primary border-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {matchingTags.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-muted text-muted-foreground border-0"
                            >
                              +{matchingTags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Level badge */}
                      <div className="flex items-center justify-between mt-3">
                        <Badge
                          variant={getLevelBadgeVariant(course.level)}
                          className="capitalize"
                        >
                          {course.level}
                        </Badge>
                        <span className="text-sm font-semibold text-primary">
                          {course.price === 0
                            ? 'Free'
                            : `$${Number(course.price).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const statsRecord = stats as Record<string, number> | undefined;
            const value = statsRecord?.[card.valueKey] ?? 0;
            const displayValue = card.format ? card.format(value) : value;

            return (
              <Card
                key={card.title}
                className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={cn('p-3 rounded-xl', card.iconBg)}>
                      <Icon className={cn('w-6 h-6', card.iconColor)} />
                    </div>
                    {card.trend && (
                      <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                        <ArrowUpRight className="w-3 h-3" />
                        {card.trend}
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-3xl font-bold text-foreground">
                        {displayValue}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {card.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Overview (Show for all authenticated learners) */}
          {isLearner && (
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  Course Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {(() => {
                  if (progressLoading) {
                    return (
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-2 w-full" />
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (
                    progressData?.currentCourses &&
                    progressData.currentCourses.length > 0
                  ) {
                    return progressData.currentCourses.map((course) => (
                      <div key={course.id} className="space-y-3 group">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium group-hover:text-primary transition-colors">
                              {course.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {course.completedLessons} of {course.totalLessons}{' '}
                              lessons completed
                            </p>
                          </div>
                          <Badge
                            variant={getProgressBadgeVariant(course.progress)}
                            className="font-semibold"
                          >
                            {course.progress}%
                          </Badge>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    ));
                  }
                  return (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground">
                        No courses yet
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enroll in a course to start learning
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Activity List */}
          <Card
            className={cn('overflow-hidden', isLearner ? '' : 'lg:col-span-2')}
          >
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {(() => {
                if (activityLoading) {
                  return (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-4">
                          <Skeleton className="w-10 h-10 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                if (
                  activityData?.activities &&
                  activityData.activities.length > 0
                ) {
                  return (
                    <div className="space-y-4">
                      {activityData.activities.map((activity, index) => {
                        const iconConfig: Record<
                          string,
                          { icon: React.ElementType; bg: string; color: string }
                        > = {
                          lesson_completed: {
                            icon: BookOpen,
                            bg: 'bg-green-500/10',
                            color: 'text-green-500',
                          },
                          quiz_completed: {
                            icon: Target,
                            bg: 'bg-blue-500/10',
                            color: 'text-blue-500',
                          },
                          enrollment: {
                            icon: TrendingUp,
                            bg: 'bg-purple-500/10',
                            color: 'text-purple-500',
                          },
                          course_created: {
                            icon: BookOpen,
                            bg: 'bg-blue-500/10',
                            color: 'text-blue-500',
                          },
                          student_enrolled: {
                            icon: Users,
                            bg: 'bg-green-500/10',
                            color: 'text-green-500',
                          },
                          user_registered: {
                            icon: Users,
                            bg: 'bg-blue-500/10',
                            color: 'text-blue-500',
                          },
                          course_approved: {
                            icon: Award,
                            bg: 'bg-yellow-500/10',
                            color: 'text-yellow-500',
                          },
                        };
                        const config = iconConfig[activity.type] ?? {
                          icon: Clock,
                          bg: 'bg-muted',
                          color: 'text-muted-foreground',
                        };
                        const Icon = config.icon;

                        return (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 group animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div
                              className={cn(
                                'p-2.5 rounded-xl transition-transform group-hover:scale-110',
                                config.bg,
                              )}
                            >
                              <Icon className={cn('w-4 h-4', config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {activity.title}
                              </p>
                              {activity.course && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {activity.course}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(activity.timestamp)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">
                      No activity yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your recent actions will appear here
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

export default DashboardPage;
