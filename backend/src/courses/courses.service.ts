import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, Brackets } from 'typeorm';

import { CourseFilterOptions } from './dto/filter-course.dto';
import { Course } from './entities/course.entity';
import { Enrollment } from './entities/enrollment.entity';

export interface EnrolledCourseDto {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  level: string;
  instructor: {
    id: string;
    fullName: string;
  };
  progress: number;
  totalLessons: number;
  completedLessons: number;
  status: 'in-progress' | 'completed';
  isArchived: boolean;
  lastAccessedAt: string;
  enrolledAt: string;
}

export interface EnrolledCoursesFilterOptions {
  archived?: boolean;
  status?: 'all' | 'in-progress' | 'completed';
}

export interface CoursesListResult {
  data: Course[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CourseRecommendation {
  course: Course;
  matchingTags: string[];
  score: number;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  async findAllPublished(
    options: CourseFilterOptions,
  ): Promise<CoursesListResult> {
    const {
      page = 1,
      limit = 10,
      search,
      level,
      tags,
      sort = 'date',
      order = 'DESC',
    } = options;

    const queryBuilder = this.coursesRepository.createQueryBuilder('course');

    // Base condition: Must be published
    queryBuilder
      .leftJoinAndSelect('course.instructor', 'instructor')
      .loadRelationCountAndMap('course.studentCount', 'course.enrollments')
      .where('course.isPublished = :isPublished', { isPublished: true });

    // 1. UPDATED: Multi-field Search (Title, Description, Tags)
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(course.title) LIKE :search', { search: searchLower })
            .orWhere('LOWER(course.description) LIKE :search', {
              search: searchLower,
            })
            // Search within the comma-separated string of tags
            .orWhere('course.tags LIKE :search', { search: searchLower });
        }),
      );
    }

    // 2. Filter by Difficulty Level
    if (level) {
      queryBuilder.andWhere('course.level = :level', { level });
    }

    // 3. Filter by Specific Tags (Strict Filter)
    // This remains useful if the user clicks a specific tag pill in the UI
    if (tags && tags.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          tags.forEach((tag, index) => {
            const paramName = `tag_${index}`;
            qb.orWhere(`course.tags LIKE :${paramName}`, {
              [paramName]: `%${tag}%`,
            });
          });
        }),
      );
    }

    // 4. Sorting
    const sortColumn = sort === 'price' ? 'course.price' : 'course.createdAt';
    queryBuilder.orderBy(sortColumn, order);

    // 5. Pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUniqueTags(): Promise<string[]> {
    const courses = await this.coursesRepository.find({
      where: { isPublished: true },
      select: ['tags'],
    });

    const uniqueTags = new Set<string>();
    courses.forEach((course) => {
      // Tags column is nullable in DB - can be null at runtime
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      course.tags?.forEach((tag) => uniqueTags.add(tag));
    });

    return Array.from(uniqueTags);
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .leftJoinAndSelect('course.sections', 'sections')
      .leftJoinAndSelect('sections.lessons', 'lessons')
      .loadRelationCountAndMap('course.studentCount', 'course.enrollments')
      .where('course.id = :id', { id })
      .orderBy('sections.orderIndex', 'ASC')
      .addOrderBy('lessons.orderIndex', 'ASC')
      .getOne();

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async enroll(userId: string, courseId: string): Promise<Enrollment> {
    // Check if course exists (Fix: Removed unused variable assignment)
    await this.findOne(courseId);

    // Check if already enrolled
    const existing = await this.enrollmentRepository.findOne({
      where: { userId, courseId },
    });

    if (existing) {
      throw new ConflictException('Already enrolled in this course');
    }

    const enrollment = this.enrollmentRepository.create({
      userId,
      courseId,
      completedLessonIds: [],
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async checkEnrollment(
    userId: string,
    courseId: string,
  ): Promise<Enrollment | null> {
    return this.enrollmentRepository.findOne({
      where: { userId, courseId },
    });
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<Enrollment> {
    const enrollment = await this.checkEnrollment(userId, courseId);
    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    // Initialize array if null (legacy data safety - DB column is nullable)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!enrollment.completedLessonIds) {
      enrollment.completedLessonIds = [];
    }

    // Add lesson ID if not already present
    if (!enrollment.completedLessonIds.includes(lessonId)) {
      enrollment.completedLessonIds.push(lessonId);
      enrollment.lastAccessedAt = new Date();
      await this.enrollmentRepository.save(enrollment);
    }

    return enrollment;
  }

  /**
   * Get all enrolled courses for a user with progress calculation
   */
  async getEnrolledCourses(
    userId: string,
    options: EnrolledCoursesFilterOptions = {},
  ): Promise<EnrolledCourseDto[]> {
    const { archived = false, status = 'all' } = options;

    const enrollments = await this.enrollmentRepository.find({
      where: { userId, isArchived: archived },
      relations: [
        'course',
        'course.instructor',
        'course.sections',
        'course.sections.lessons',
      ],
      order: { lastAccessedAt: 'DESC' },
    });

    const result: EnrolledCourseDto[] = enrollments.map((enrollment) => {
      /* eslint-disable @typescript-eslint/no-unnecessary-condition -- DB relations may not be loaded */
      const allLessons =
        enrollment.course.sections?.flatMap((s) => s.lessons) ?? [];
      /* eslint-enable @typescript-eslint/no-unnecessary-condition */
      const totalLessons = allLessons.length;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- completedLessonIds is nullable in DB
      const completedLessons = enrollment.completedLessonIds?.length ?? 0;
      const progress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;
      const courseStatus: 'in-progress' | 'completed' =
        progress === 100 ? 'completed' : 'in-progress';

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        thumbnailUrl: enrollment.course.thumbnailUrl,
        level: enrollment.course.level,

        /* eslint-disable @typescript-eslint/no-unnecessary-condition -- instructor relation may not be loaded */
        instructor: {
          id: enrollment.course.instructor?.id ?? '',
          fullName:
            enrollment.course.instructor?.fullName ?? 'Unknown Instructor',
        },
        /* eslint-enable @typescript-eslint/no-unnecessary-condition */
        progress,
        totalLessons,
        completedLessons,
        status: courseStatus,
        isArchived: enrollment.isArchived,
        lastAccessedAt: enrollment.lastAccessedAt.toISOString(),
        enrolledAt: enrollment.enrolledAt.toISOString(),
      };
    });

    // Filter by status if specified
    if (status !== 'all') {
      return result.filter((course) => course.status === status);
    }

    return result;
  }

  /**
   * Archive a course enrollment (hide from main list but preserve progress)
   */
  async archiveCourse(userId: string, courseId: string): Promise<Enrollment> {
    const enrollment = await this.checkEnrollment(userId, courseId);
    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    if (enrollment.isArchived) {
      throw new ConflictException('Course is already archived');
    }

    enrollment.isArchived = true;
    enrollment.archivedAt = new Date();

    return this.enrollmentRepository.save(enrollment);
  }

  /**
   * Unarchive a course enrollment (restore to main list)
   */
  async unarchiveCourse(userId: string, courseId: string): Promise<Enrollment> {
    const enrollment = await this.checkEnrollment(userId, courseId);
    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    if (!enrollment.isArchived) {
      throw new ConflictException('Course is not archived');
    }

    enrollment.isArchived = false;
    enrollment.archivedAt = null as unknown as Date;

    return this.enrollmentRepository.save(enrollment);
  }

  /**
   * Get course recommendations based on tags from user's enrolled courses
   * Algorithm:
   * 1. Collect all unique tags from user's enrolled courses
   * 2. Find published courses that share at least one tag
   * 3. Exclude courses the user is already enrolled in
   * 4. Score courses by number of matching tags
   * 5. Return top recommendations sorted by score
   */
  async getRecommendations(
    userId: string,
    limit = 6,
  ): Promise<CourseRecommendation[]> {
    // Step 1: Get all enrolled courses for the user
    const enrollments = await this.enrollmentRepository.find({
      where: { userId },
      relations: ['course'],
    });

    if (enrollments.length === 0) {
      // No enrolled courses - return popular courses instead
      const popularCourses = await this.coursesRepository
        .createQueryBuilder('course')
        .leftJoinAndSelect('course.instructor', 'instructor')
        .loadRelationCountAndMap('course.studentCount', 'course.enrollments')
        .where('course.isPublished = :isPublished', { isPublished: true })
        .orderBy('course.createdAt', 'DESC')
        .take(limit)
        .getMany();

      return popularCourses.map((course) => ({
        course,
        matchingTags: [],
        score: 0,
      }));
    }

    // Step 2: Collect unique tags from enrolled courses
    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    const userTags = new Set<string>();
    enrollments.forEach((enrollment) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- tags is nullable in DB
      enrollment.course.tags?.forEach((tag) => userTags.add(tag.toLowerCase()));
    });

    if (userTags.size === 0) {
      // No tags in enrolled courses - return popular courses
      const popularCourses = await this.coursesRepository
        .createQueryBuilder('course')
        .leftJoinAndSelect('course.instructor', 'instructor')
        .loadRelationCountAndMap('course.studentCount', 'course.enrollments')
        .where('course.isPublished = :isPublished', { isPublished: true })
        .andWhere('course.id NOT IN (:...enrolledIds)', {
          enrolledIds: Array.from(enrolledCourseIds),
        })
        .orderBy('course.createdAt', 'DESC')
        .take(limit)
        .getMany();

      return popularCourses.map((course) => ({
        course,
        matchingTags: [],
        score: 0,
      }));
    }

    // Step 3: Find all published courses (excluding enrolled ones)
    const queryBuilder = this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .loadRelationCountAndMap('course.studentCount', 'course.enrollments')
      .where('course.isPublished = :isPublished', { isPublished: true })
      .andWhere('course.id NOT IN (:...enrolledIds)', {
        enrolledIds: Array.from(enrolledCourseIds),
      });

    // Add tag matching conditions (OR for any tag match)
    const tagConditions = Array.from(userTags).map(
      (_, index) => `LOWER(course.tags) LIKE :tag_${index}`,
    );
    if (tagConditions.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          Array.from(userTags).forEach((tag, index) => {
            if (index === 0) {
              qb.where(`LOWER(course.tags) LIKE :tag_${index}`, {
                [`tag_${index}`]: `%${tag}%`,
              });
            } else {
              qb.orWhere(`LOWER(course.tags) LIKE :tag_${index}`, {
                [`tag_${index}`]: `%${tag}%`,
              });
            }
          });
        }),
      );
    }

    const candidateCourses = await queryBuilder.getMany();

    // Step 4: Score courses by number of matching tags
    const scoredCourses = candidateCourses.map((course) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- tags is nullable in DB
      const courseTags = course.tags?.map((t) => t.toLowerCase()) ?? [];
      const matchingTags = courseTags.filter((tag) => userTags.has(tag));
      return {
        course,
        matchingTags,
        score: matchingTags.length,
      };
    });

    // Step 5: Sort by score (descending) and return top recommendations
    scoredCourses.sort((a, b) => b.score - a.score);

    return scoredCourses.slice(0, limit);
  }
}
