import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/use-auth";
import { dashboardApi } from "@/features/dashboard/api/dashboard-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Clock,
  Target,
  Users,
  Award,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Skeleton loader component
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardApi.getStats,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["dashboard", "progress"],
    queryFn: dashboardApi.getProgress,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: dashboardApi.getActivity,
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

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
    if (user?.role === "admin") {
      return [
        {
          title: "Total Users",
          icon: Users,
          iconBg: "bg-blue-500/10",
          iconColor: "text-blue-500",
          subtitle: "Platform users",
          valueKey: "totalUsers",
          trend: "+12%",
        },
        {
          title: "Total Courses",
          icon: BookOpen,
          iconBg: "bg-purple-500/10",
          iconColor: "text-purple-500",
          subtitle: "Published courses",
          valueKey: "totalCourses",
          trend: "+3",
        },
        {
          title: "Active Students",
          icon: TrendingUp,
          iconBg: "bg-green-500/10",
          iconColor: "text-green-500",
          subtitle: "Learning now",
          valueKey: "activeStudents",
          trend: "+25%",
        },
      ];
    }
    if (user?.role === "instructor") {
      return [
        {
          title: "Your Courses",
          icon: BookOpen,
          iconBg: "bg-purple-500/10",
          iconColor: "text-purple-500",
          subtitle: "Created by you",
          valueKey: "coursesCreated",
        },
        {
          title: "Total Students",
          icon: Users,
          iconBg: "bg-blue-500/10",
          iconColor: "text-blue-500",
          subtitle: "Enrolled students",
          valueKey: "totalStudents",
          trend: "+8",
        },
        {
          title: "Avg. Rating",
          icon: Award,
          iconBg: "bg-yellow-500/10",
          iconColor: "text-yellow-500",
          subtitle: "Out of 5.0",
          valueKey: "averageRating",
          format: (v) => v.toFixed(1),
        },
      ];
    }
    // Student
    return [
      {
        title: "Enrolled Courses",
        icon: BookOpen,
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-500",
        subtitle: "Active courses",
        valueKey: "coursesEnrolled",
      },
      {
        title: "Hours Learned",
        icon: Clock,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-500",
        subtitle: "Total study time",
        valueKey: "hoursLearned",
        trend: "+2h",
      },
      {
        title: "Avg. Score",
        icon: Target,
        iconBg: "bg-green-500/10",
        iconColor: "text-green-500",
        subtitle: "Quiz performance",
        valueKey: "averageScore",
        format: (v) => `${v}%`,
      },
    ];
  };

  const statCards = getStatCards();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-white">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Learning</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name || user?.email.split("@")[0] || "Learner"}
            !
          </h1>
          <p className="text-white/80 max-w-xl">
            {user?.role === "admin"
              ? "Monitor platform activity and manage users from your dashboard."
              : user?.role === "instructor"
                ? "Create engaging courses and track your students' progress."
                : "Continue your learning journey and track your progress."}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const value = (stats as any)?.[card.valueKey] ?? 0;
          const displayValue = card.format ? card.format(value) : value;

          return (
            <Card
              key={card.title}
              className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={cn("p-3 rounded-xl", card.iconBg)}>
                    <Icon className={cn("w-6 h-6", card.iconColor)} />
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
        {/* Progress Overview */}
        {user?.role === "student" && (
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
              {progressLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : progressData?.currentCourses &&
                progressData.currentCourses.length > 0 ? (
                progressData.currentCourses.map((course) => (
                  <div key={course.id} className="space-y-3 group">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {course.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {course.completedLessons} of {course.totalLessons}{" "}
                          lessons completed
                        </p>
                      </div>
                      <Badge
                        variant={
                          course.progress >= 80
                            ? "success"
                            : course.progress >= 50
                              ? "warning"
                              : "default"
                        }
                        className="font-semibold"
                      >
                        {course.progress}%
                      </Badge>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">No courses yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enroll in a course to start learning
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity List */}
        <Card
          className={cn(
            "overflow-hidden",
            user?.role === "student" ? "" : "lg:col-span-2",
          )}
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
            {activityLoading ? (
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
            ) : activityData?.activities &&
              activityData.activities.length > 0 ? (
              <div className="space-y-4">
                {activityData.activities.map((activity, index) => {
                  const iconConfig: Record<
                    string,
                    { icon: React.ElementType; bg: string; color: string }
                  > = {
                    lesson_completed: {
                      icon: BookOpen,
                      bg: "bg-green-500/10",
                      color: "text-green-500",
                    },
                    quiz_completed: {
                      icon: Target,
                      bg: "bg-blue-500/10",
                      color: "text-blue-500",
                    },
                    enrollment: {
                      icon: TrendingUp,
                      bg: "bg-purple-500/10",
                      color: "text-purple-500",
                    },
                    course_created: {
                      icon: BookOpen,
                      bg: "bg-blue-500/10",
                      color: "text-blue-500",
                    },
                    student_enrolled: {
                      icon: Users,
                      bg: "bg-green-500/10",
                      color: "text-green-500",
                    },
                    user_registered: {
                      icon: Users,
                      bg: "bg-blue-500/10",
                      color: "text-blue-500",
                    },
                    course_approved: {
                      icon: Award,
                      bg: "bg-yellow-500/10",
                      color: "text-yellow-500",
                    },
                  };
                  const config = iconConfig[activity.type] || {
                    icon: Clock,
                    bg: "bg-muted",
                    color: "text-muted-foreground",
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
                          "p-2.5 rounded-xl transition-transform group-hover:scale-110",
                          config.bg,
                        )}
                      >
                        <Icon className={cn("w-4 h-4", config.color)} />
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
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No activity yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your recent actions will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
