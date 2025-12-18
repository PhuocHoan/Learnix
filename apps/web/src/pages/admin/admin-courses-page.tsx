import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { PageContainer } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/features/admin/api/admin-api';

export function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | null;
    courseId: string | null;
    courseTitle: string | null;
  }>({
    isOpen: false,
    type: null,
    courseId: null,
    courseTitle: null,
  });

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
      setConfirmDialog({
        isOpen: false,
        type: null,
        courseId: null,
        courseTitle: null,
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
      setConfirmDialog({
        isOpen: false,
        type: null,
        courseId: null,
        courseTitle: null,
      });
    },
  });

  const handleApprove = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'approve',
      courseId: id,
      courseTitle: title,
    });
  };

  const handleReject = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'reject',
      courseId: id,
      courseTitle: title,
    });
  };

  const handleConfirm = () => {
    if (!confirmDialog.courseId) {
      return;
    }

    if (confirmDialog.type === 'approve') {
      approveMutation.mutate(confirmDialog.courseId);
    } else if (confirmDialog.type === 'reject') {
      rejectMutation.mutate(confirmDialog.courseId);
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
                        className="w-full h-full object-contain"
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
                        onClick={() => handleApprove(course.id, course.title)}
                      >
                        <Check className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleReject(course.id, course.title)}
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

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setConfirmDialog({
            isOpen: false,
            type: null,
            courseId: null,
            courseTitle: null,
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'approve'
                ? 'Approve Course?'
                : 'Reject Course?'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'approve'
                ? `Are you sure you want to approve and publish "${confirmDialog.courseTitle}"? This will make it visible to all students.`
                : `Are you sure you want to reject "${confirmDialog.courseTitle}"? The instructor will be notified.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({
                  isOpen: false,
                  type: null,
                  courseId: null,
                  courseTitle: null,
                })
              }
            >
              Cancel
            </Button>
            {confirmDialog.type === 'approve' ? (
              <Button
                onClick={handleConfirm}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
            ) : (
              <Button onClick={handleConfirm} variant="destructive">
                Reject
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

export default AdminCoursesPage;
