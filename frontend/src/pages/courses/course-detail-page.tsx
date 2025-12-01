import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/features/courses/api/courses-api";
import {
  BookOpen,
  PlayCircle,
  FileText,
  Lock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/use-auth";
import { cn } from "@/lib/utils";

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ["course", id],
    queryFn: () => coursesApi.getCourse(id!),
    enabled: !!id,
  });

  // Check enrollment status if logged in
  const { data: enrollment, isLoading: isLoadingEnrollment } = useQuery({
    queryKey: ["enrollment", id],
    queryFn: () => coursesApi.getEnrollment(id!),
    enabled: !!id && isAuthenticated,
  });

  const enrollMutation = useMutation({
    mutationFn: () => coursesApi.enroll(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      // Optional: Redirect directly to lesson viewer
      navigate(`/courses/${id}/learn`);
    },
  });

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/courses/${id}` } });
      return;
    }
    enrollMutation.mutate();
  };

  if (isLoadingCourse) return <div className="p-8 text-center">Loading...</div>;
  if (!course) return <div className="p-8 text-center">Course not found</div>;

  const totalLessons =
    course.sections?.reduce(
      (acc, section) => acc + section.lessons.length,
      0,
    ) || 0;

  const isEnrolled = enrollment?.isEnrolled;
  const completedIds = enrollment?.progress?.completedLessonIds || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
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

          <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{totalLessons} Lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Instructor:</span>
              <span>
                {course.instructor?.fullName ||
                  course.instructor?.name ||
                  "Instructor"}
              </span>
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
                {course.price === 0 ? "Free" : `$${course.price}`}
              </div>
              <Button
                size="lg"
                className="w-full font-semibold"
                onClick={handleEnroll}
                disabled={enrollMutation.isPending || isLoadingEnrollment}
              >
                {enrollMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                    Enrolling...
                  </>
                ) : (
                  "Enroll Now"
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Get full lifetime access
              </p>
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
                    return (
                      <div
                        key={lesson.id}
                        className="p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors"
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            isCompleted
                              ? "bg-green-100 text-green-600"
                              : "bg-primary/5 text-primary",
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : lesson.type === "video" ? (
                            <PlayCircle className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 text-sm font-medium">
                          {lesson.title}
                        </div>
                        {isEnrolled || lesson.isFreePreview ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() =>
                              isEnrolled
                                ? navigate(`/courses/${id}/learn`)
                                : null
                            }
                          >
                            {isEnrolled ? "View" : "Preview"}
                          </Button>
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground/50" />
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
  );
}
