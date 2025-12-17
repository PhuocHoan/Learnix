import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { PageContainer } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/features/admin/api/admin-api';

export function AdminCoursesPage() {
    const queryClient = useQueryClient();

    const { data: courses, isLoading } = useQuery({
        queryKey: ['admin-pending-courses'],
        queryFn: adminApi.getPendingCourses,
    });

    const approveMutation = useMutation({
        mutationFn: adminApi.approveCourse,
        onSuccess: () => {
            toast.success('Course approved');
            void queryClient.invalidateQueries({
                queryKey: ['admin-pending-courses'],
            });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: adminApi.rejectCourse,
        onSuccess: () => {
            toast.success('Course rejected');
            void queryClient.invalidateQueries({
                queryKey: ['admin-pending-courses'],
            });
        },
    });

    const handleApprove = (id: string) => {
        // eslint-disable-next-line no-alert
        if (window.confirm('Approve this course and publish it?')) {
            approveMutation.mutate(id);
        }
    };

    const handleReject = (id: string) => {
        // eslint-disable-next-line no-alert
        if (window.confirm('Reject this course?')) {
            rejectMutation.mutate(id);
        }
    };

    return (
        <PageContainer>
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Shield className="w-5 h-5" />
                            <span className="text-sm font-medium">Administration</span>
                        </div>
                        <h1 className="text-3xl font-bold">Course Moderation</h1>
                        <p className="text-muted-foreground">
                            Review incoming courses from instructors
                        </p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {isLoading && (
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-xl" />
                            ))}
                        </div>
                    )}

                    {!isLoading && (!courses || courses.length === 0) && (
                        <Card className="p-12 text-center bg-muted/30 border-dashed">
                            <div className="max-w-sm mx-auto space-y-4">
                                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                                    <Check className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-semibold">All Caught Up!</h3>
                                <p className="text-muted-foreground">
                                    There are no pending courses to review at the moment.
                                </p>
                            </div>
                        </Card>
                    )}

                    {!isLoading &&
                        courses?.map((course) => (
                            <Card
                                key={course.id}
                                className="overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    <div className="w-full md:w-48 h-32 bg-muted rounded-lg shrink-0 overflow-hidden">
                                        {course.thumbnailUrl ? (
                                            <img
                                                src={course.thumbnailUrl}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2">
                                        <h3 className="text-xl font-bold truncate">
                                            {course.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>
                                                By {course.instructor?.fullName ?? 'Unknown Instructor'}
                                            </span>
                                            <span>•</span>
                                            <span className="capitalize">{course.level}</span>
                                            <span>•</span>
                                            {/* Date formatting could go here */}
                                            <span>Submitted Recently</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {course.description}
                                        </p>
                                    </div>

                                    <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="w-full justify-start"
                                        >
                                            <Link to={`/courses/${course.id}`} target="_blank">
                                                <Eye className="w-4 h-4 mr-2" /> Preview
                                            </Link>
                                        </Button>
                                        <div className="flex gap-2 w-full">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApprove(course.id)}
                                            >
                                                <Check className="w-4 h-4 mr-2" /> Approve
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleReject(course.id)}
                                            >
                                                <X className="w-4 h-4 mr-2" /> Reject
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </div>
        </PageContainer>
    );
}

export default AdminCoursesPage;
