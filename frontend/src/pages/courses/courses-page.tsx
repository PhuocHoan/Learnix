import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { coursesApi, type Course } from "@/features/courses/api/courses-api";
import { Search, BookOpen, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function CoursesPage() {
  const [search, setSearch] = useState("");

  // Fix: Explicitly type useQuery with <Course[]> and wrap queryFn
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: () => coursesApi.getAllCourses(),
  });

  const filteredCourses = courses?.filter(
    (course) =>
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.tags?.some((tag) =>
        tag.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Browse Courses</h1>
          <p className="text-muted-foreground mt-1">
            Explore our wide range of professional courses
          </p>
        </div>
        <div className="w-full md:w-72">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Simple skeleton loader */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 bg-muted/30 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses?.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="group"
            >
              <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
                {/* Thumbnail placeholder or image */}
                <div className="h-48 bg-gradient-to-br from-primary/5 to-primary/20 relative">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-primary/20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-background/80 backdrop-blur text-foreground border-transparent">
                      {course.level}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <User className="w-3.5 h-3.5" />
                    <span>{course.instructor?.fullName || "Instructor"}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {course.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}