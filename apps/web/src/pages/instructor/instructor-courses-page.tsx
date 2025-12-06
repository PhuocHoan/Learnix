import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PageContainer } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { coursesApi } from '@/features/courses/api/courses-api';

export function InstructorCoursesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: coursesApi.getInstructorCourses,
  });

  const deleteMutation = useMutation({
    mutationFn: coursesApi.deleteCourse,
    onSuccess: () => {
      toast.success('Course deleted');
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
  });

  const handleDelete = (id: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <PageContainer>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage your content</p>
        </div>
        <Button onClick={() => navigate('/instructor/courses/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          courses?.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <CardContent className="p-0 flex items-center">
                <div className="w-32 h-24 bg-muted shrink-0">
                  {course.thumbnailUrl && (
                    <img
                      src={course.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge
                          variant={course.isPublished ? 'success' : 'secondary'}
                        >
                          {course.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        <Badge variant="secondary">{course.level}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/courses/${course.id}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link to={`/instructor/courses/${course.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(course.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
}
export default InstructorCoursesPage;
