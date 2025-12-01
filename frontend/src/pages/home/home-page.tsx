import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { coursesApi } from "@/features/courses/api/courses-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Sparkles, User } from "lucide-react";
import { useAuth } from "@/contexts/use-auth";

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: response, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["courses", "latest"],
    // UPDATED: Pass object with limit and sort options
    queryFn: () => coursesApi.getAllCourses({ 
      limit: 6, 
      sort: 'date', 
      order: 'DESC' 
    }), 
  });

  // UPDATED: Handle both legacy array response and new paginated response
  const latestCourses = Array.isArray(response) ? response : response?.data;

  const { data: tags, isLoading: isLoadingTags } = useQuery({
    queryKey: ["courses", "tags"],
    queryFn: coursesApi.getTags,
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section ... (No changes here) ... */}
      <section className="relative pt-20 pb-32 overflow-hidden gradient-primary text-white">
        {/* ... hero content ... */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium">
              Revolutionizing Online Learning
            </span>
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            Master New Skills with <br /> AI-Powered Learning
          </h1>

          <p
            className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            Join Learnix to access interactive courses, personalized quizzes,
            and a community of learners. Start your journey today.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <Link to="/courses">
              <Button
                size="lg"
                className="bg-white text-white hover:bg-white/90 font-bold h-14 px-8 rounded-2xl text-lg shadow-xl shadow-black/10"
              >
                Browse Courses
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/register">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:bg-white/10 h-14 px-8 rounded-2xl text-lg border border-white/30"
                >
                  Get Started Free
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section ... (No changes here) ... */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Explore Categories</h2>
            <p className="text-muted-foreground">
              Find courses that match your interests
            </p>
          </div>

          {isLoadingTags ? (
            <div className="flex flex-wrap justify-center gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-10 w-24 bg-muted animate-pulse rounded-full"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {tags?.map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/courses?tags=${tag}`)}
                  className="px-6 py-3 rounded-full border border-border bg-card hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all duration-300 font-medium capitalize shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Latest Courses Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Latest Courses</h2>
              <p className="text-muted-foreground">
                Fresh content added recently
              </p>
            </div>
            <Link
              to="/courses"
              className="hidden md:flex items-center text-primary font-semibold hover:gap-2 transition-all group"
            >
              View All Courses{" "}
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingCourses
              ? [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-96 bg-card rounded-2xl animate-pulse"
                  />
                ))
              : latestCourses?.map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="group h-full"
                  >
                    <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 flex flex-col hover:-translate-y-1">
                      <div className="h-48 bg-gradient-to-br from-primary/5 to-primary/20 relative overflow-hidden">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-primary/20" />
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-background/90 backdrop-blur text-foreground border-transparent shadow-sm">
                            {course.level}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-6 flex flex-col flex-1">
                        <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                          {course.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <User className="w-3.5 h-3.5" />
                            <span>
                              {course.instructor?.fullName || "Instructor"}
                            </span>
                          </div>
                          <span className="font-bold text-primary">
                            {course.price === 0 ? "Free" : `$${course.price}`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Link to="/courses">
              <Button variant="outline" className="w-full">
                View All Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}