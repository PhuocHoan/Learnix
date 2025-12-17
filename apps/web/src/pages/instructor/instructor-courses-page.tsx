import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, AlertCircle, UserCog } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PageContainer } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/use-auth';
import { coursesApi } from '@/features/courses/api/courses-api';

export function InstructorCoursesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: courses,
    isLoading,
    error,
  } = useQuery({
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

  const submitMutation = useMutation({
    mutationFn: coursesApi.submitForApproval,
    onSuccess: () => {
      toast.success('Course submitted for approval');
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
    onError: () => {
      toast.error('Failed to submit course');
    },
  });

  const handleSubmit = (id: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Submit this course for admin approval?')) {
      submitMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string, isPublished: boolean) => {
    if (isPublished) {
      return <Badge variant="success">Published</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="warning">Pending Approval</Badge>;
    }
    if (status === 'rejected') {
      return <Badge variant="danger">Rejected</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  // Handle 403 Forbidden error - user doesn't have instructor role
  const errorResponse =
    error && 'response' in error
      ? (error as { response?: { status?: number } })
      : null;

  if (errorResponse?.response?.status === 403) {
    return (
      <PageContainer>
        <Card className="p-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-warning/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-warning" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Instructor Access Required</h2>
              <p className="text-muted-foreground">
                {user?.role === null || user?.role === 'guest'
                  ? 'You need to select the instructor role to access this page. Please complete your profile setup.'
                  : `You currently have the ${user?.role} role. Only instructors can create and manage courses.`}
              </p>
            </div>
            {(user?.role === null || user?.role === 'guest') && (
              <Button
                onClick={() => navigate('/auth/select-role')}
                size="lg"
                className="gap-2"
              >
                <UserCog className="w-4 h-4" />
                Select Instructor Role
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  // ... (existing code)

  return (
    <PageContainer>
      {/* ... (existing header) */}
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

      <div className="grid gap-6">
        {/* ... (existing loading skeletons) */}
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              {/* ... skeleton content */}
              <CardContent className="p-0 flex items-center">
                <Skeleton className="w-56 h-32 shrink-0 rounded-none" />
                <div className="p-6 flex-1 space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
                <div className="p-6 flex gap-2">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}

        {!isLoading &&
          courses &&
          courses.length > 0 &&
          courses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-0 flex items-center">
                <div className="w-56 h-32 bg-gradient-to-br from-muted to-muted/50 shrink-0 relative group">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <span className="text-sm font-medium">No thumbnail</span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {course.title}
                      </h3>
                      <div className="flex gap-2 mt-2">
                        {getStatusBadge(course.status, course.isPublished)}
                        <Badge variant="secondary" className="capitalize">
                          {course.level}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {/* Submit Button for Drafts */}
                      {course.status === 'draft' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSubmit(course.id)}
                          title="Submit for Approval"
                        >
                          <span className="text-xs">Submit</span>
                        </Button>
                      )}

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
          ))}

        {!isLoading && (!courses || courses.length === 0) && (
          <Card className="p-12 text-center">
            <div className="max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No courses yet</h3>
              <p className="text-muted-foreground">
                Start creating your first course and share your knowledge with
                the world.
              </p>
              <Button
                onClick={() => navigate('/instructor/courses/new')}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Course
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
export default InstructorCoursesPage;
