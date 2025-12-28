import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Link as LinkIcon,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  coursesApi,
  type LessonResource,
} from '@/features/courses/api/courses-api';

interface LessonResourcesProps {
  courseId: string;
  lessonId: string;
  resources: LessonResource[];
  isInstructor: boolean;
  onAddResource?: (resource: Omit<LessonResource, 'id' | 'lessonId'>) => void;
  onRemoveResource?: (resourceId: string) => void;
}

export function LessonResources({
  lessonId,
  resources,
  isInstructor,
  onAddResource,
  onRemoveResource,
}: LessonResourcesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (resourceId: string) => coursesApi.removeResource(resourceId),
    onSuccess: () => {
      toast.success('Resource removed');
      void queryClient.invalidateQueries({ queryKey: ['course'] });
    },
    onError: () => {
      toast.error('Failed to remove resource');
    },
  });

  const handleDelete = (resourceId: string) => {
    // eslint-disable-next-line no-alert
    if (confirm('Are you sure you want to remove this resource?')) {
      if (onRemoveResource) {
        onRemoveResource(resourceId);
      } else {
        deleteMutation.mutate(resourceId);
      }
    }
  };

  if (!resources?.length && !isInstructor) {
    return null;
  }

  return (
    <div className="mt-8 pt-8 border-t border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Lesson Resources
        </h3>
        {isInstructor && (
          <AddResourceDialog
            lessonId={lessonId}
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onAdd={onAddResource}
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors group"
          >
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {resource.type === 'link' ? (
                  <LinkIcon className="w-5 h-5 text-primary" />
                ) : (
                  <FileText className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate text-sm">
                  {resource.title}
                </span>
                <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  {resource.type}
                  {resource.fileSize && (
                    <>&bull; {Math.round(resource.fileSize / 1024)} KB</>
                  )}
                </span>
              </div>
            </a>

            <div className="flex items-center gap-2 ml-3">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                title="Open Resource"
              >
                {resource.type === 'link' ? (
                  <ExternalLink className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </a>
              {isInstructor && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 px-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  onClick={() => handleDelete(resource.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {resources.length === 0 && isInstructor && (
          <div className="col-span-full py-8 text-center border border-dashed border-border rounded-lg text-muted-foreground text-sm">
            No resources attached yet. Add files or links to help your students.
          </div>
        )}
      </div>
    </div>
  );
}

function AddResourceDialog({
  lessonId,
  open,
  onOpenChange,
  onAdd,
}: {
  lessonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (resource: Omit<LessonResource, 'id' | 'lessonId'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'link' | 'file'>('link');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (onAdd) {
        onAdd({
          title,
          type,
          url,
        });
      } else {
        await coursesApi.addResource(lessonId, {
          title,
          type,
          url,
        });
        void queryClient.invalidateQueries({ queryKey: ['course'] });
      }

      toast.success('Resource added successfully');
      onOpenChange(false);
      setTitle('');
      setUrl('');
      setType('link');
    } catch (_error) {
      toast.error('Failed to add resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Lesson Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Slide Deck, Source Code, Reference Link"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={type}
                onChange={(e) => setType(e.target.value as 'link' | 'file')}
              >
                <option value="link">External Link</option>
                <option value="file">File URL</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">{type === 'link' ? 'URL' : 'File URL'}</Label>
            <Input
              id="url"
              type="url"
              placeholder={
                type === 'link'
                  ? 'https://example.com/resource'
                  : 'https://example.com/file.pdf'
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            {type === 'file' && (
              <p className="text-xs text-muted-foreground">
                For now, please provide a direct URL to the file (e.g. from
                Google Drive, Dropbox, or a public CDN). Direct file uploads
                will be enabled soon.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Add Resource
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
