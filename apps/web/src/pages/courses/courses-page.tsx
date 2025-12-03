// src-frontend/pages/courses/courses-page.tsx
import { useState, useEffect } from 'react';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, BookOpen, User, Filter, X, Users, Clock } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Link, useSearchParams } from 'react-router-dom';

import { PageContainer } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  coursesApi,
  type CoursesParams,
} from '@/features/courses/api/courses-api';
import { formatLastUpdated, formatStudentCount } from '@/lib/utils';

// Helper hook for debouncing if you don't have one
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function CoursesPage() {
  // --- Filter States ---
  const [searchParams, setSearchParams] = useSearchParams();
  // Use URL search param as initial value - controlled by URL
  const initialSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);

  // Sync from URL to local state when URL changes (e.g., from header search)
  // This uses a key pattern instead of useEffect to avoid setState in effect
  const urlSearchKey = searchParams.get('search') ?? '';

  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    sort: 'price' | 'date';
    order: 'ASC' | 'DESC';
  }>({ sort: 'date', order: 'DESC' });

  // Use URL search if available, otherwise use local search
  const effectiveSearch = urlSearchKey || search;

  // Handler to update search - clears URL param when typing in filter
  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Clear URL search param when user types in the filter input
    if (urlSearchKey) {
      setSearchParams((prev) => {
        prev.delete('search');
        return prev;
      });
    }
  };

  const debouncedSearch = useDebounceValue(effectiveSearch, 500);
  const { ref, inView } = useInView(); // Infinite scroll trigger

  // --- Query Params ---
  const queryParams: CoursesParams = {
    limit: 9,
    search: debouncedSearch,
    level: selectedLevel || undefined,
    tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
    sort: sortConfig.sort,
    order: sortConfig.order,
  };

  // --- Infinite Query ---
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['courses', 'infinite', queryParams], // Key changes when filters change
      queryFn: ({ pageParam = 1 }) =>
        coursesApi.getAllCourses({ ...queryParams, page: pageParam }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.meta.page < lastPage.meta.totalPages) {
          return lastPage.meta.page + 1;
        }
        return undefined;
      },
    });

  // --- Load more when scrolling to bottom ---
  useEffect(() => {
    if (inView && hasNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // --- Handlers ---
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!selectedTags.includes(tagInput.trim())) {
        setSelectedTags([...selectedTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <PageContainer>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Browse Courses</h1>
            <p className="text-muted-foreground mt-1">
              Explore our wide range of professional courses
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 font-medium text-primary mb-2">
            <Filter className="w-4 h-4" />
            <span>Filters & Sorting</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Search */}
            <Input
              leftIcon={<Search className="w-4 h-4" />}
              placeholder="Search by title..."
              value={effectiveSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
            />

            {/* 2. Difficulty Select */}
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* 3. Sort Select */}
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={`${sortConfig.sort}-${sortConfig.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-') as [
                  'price' | 'date',
                  'ASC' | 'DESC',
                ];
                setSortConfig({ sort, order });
              }}
            >
              <option value="date-DESC">Newest First</option>
              <option value="date-ASC">Oldest First</option>
              <option value="price-ASC">Price: Low to High</option>
              <option value="price-DESC">Price: High to Low</option>
            </select>

            {/* 4. Tags Input */}
            <div className="relative">
              <Input
                placeholder="Type tag & press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
          </div>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pl-3">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-muted-foreground hover:text-primary underline px-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 bg-muted/30 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.pages.map((page) =>
                page.data.map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="group block h-full"
                  >
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 flex flex-col">
                      <div className="h-48 bg-linear-to-br from-primary/5 to-primary/20 relative overflow-hidden">
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
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-background/80 backdrop-blur text-foreground border-transparent capitalize">
                            {course.level}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3 flex-1">
                          {course.description}
                        </p>

                        {/* Instructor */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <User className="w-3.5 h-3.5" />
                          <span className="font-medium">
                            {course.instructor?.fullName ??
                              course.instructor?.name ??
                              'Instructor'}
                          </span>
                        </div>

                        {/* Stats Row (Students & Last Updated) */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          {course.studentCount !== undefined && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>
                                {formatStudentCount(course.studentCount)}
                              </span>
                            </div>
                          )}
                          {course.updatedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatLastUpdated(course.updatedAt)}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags & Price */}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                          <div className="flex flex-wrap gap-1">
                            {course.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                            {(course.tags?.length ?? 0) > 2 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{(course.tags?.length ?? 0) - 2}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-primary">
                            {course.price === 0 ? 'Free' : `$${course.price}`}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )),
              )}
            </div>

            {/* Infinite Scroll Trigger */}
            <div
              ref={ref}
              className="h-10 flex items-center justify-center w-full"
            >
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading more courses...</span>
                </div>
              )}
              {!hasNextPage && data && data.pages[0].data.length > 0 && (
                <span className="text-muted-foreground text-sm">
                  You've reached the end
                </span>
              )}
              {!hasNextPage && data?.pages[0].data.length === 0 && (
                <span className="text-muted-foreground text-sm">
                  No courses found matching your criteria
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default CoursesPage;
