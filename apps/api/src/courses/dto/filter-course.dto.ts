import { type CourseLevel } from '../entities/course.entity';

export interface CourseFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  level?: CourseLevel;
  tags?: string[]; // Array of tags
  sort?: 'price' | 'date';
  order?: 'ASC' | 'DESC';
}
