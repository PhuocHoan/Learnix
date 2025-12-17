import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, Brackets } from 'typeorm';

import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CourseFilterOptions } from './dto/filter-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CourseSection } from './entities/course-section.entity';
import { Course } from './entities/course.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Lesson } from './entities/lesson.entity';
import { CourseStatus } from './enums/course-status.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

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
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(CourseSection)
    private sectionRepository: Repository<CourseSection>,
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
      const searchLower = `% ${search.toLowerCase()}% `;
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
            const paramName = `tag_${index} `;
            qb.orWhere(`course.tags LIKE:${paramName} `, {
              [paramName]: `% ${tag}% `,
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
      course.tags?.forEach((tag) => uniqueTags.add(tag));
    });

    return Array.from(uniqueTags);
  }

  async findOne(id: string, user?: Partial<User>): Promise<Course> {
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

    // Access Control:
    // If course is NOT published, only the Instructor or Admin can view it.
    if (!course.isPublished) {
      const isInstructor = user?.id === course.instructor?.id;
      const isAdmin = user?.role === UserRole.ADMIN;

      if (!isInstructor && !isAdmin) {
        throw new NotFoundException('Course not found');
      }
    }

    return course;
  }

  async enroll(userId: string, courseId: string): Promise<Enrollment> {
    // Check if course exists and is accessible
    // Passing generic user object to allow enrollment only if visible
    await this.findOne(courseId, { id: userId } as User);

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
    enrollment.completedLessonIds ??= [];

    // Add lesson ID if not already present
    if (!enrollment.completedLessonIds.includes(lessonId)) {
      enrollment.completedLessonIds.push(lessonId);
      enrollment.lastAccessedAt = new Date();
      await this.enrollmentRepository.save(enrollment);
    }

    return enrollment;
  }

  /**
   * Get a specific lesson with access control
   * Returns full lesson content only if:
   * 1. User is enrolled in the course, OR
   * 2. Lesson is marked as free preview
   * Otherwise, throws ForbiddenException
   */
  async getLessonWithAccessControl(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<{ lesson: Lesson; hasAccess: boolean }> {
    // Find the lesson
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['section', 'section.course'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Verify the lesson belongs to the specified course
    if (lesson.section.course.id !== courseId) {
      throw new NotFoundException('Lesson not found in this course');
    }

    // Check if user is enrolled
    const enrollment = await this.checkEnrollment(userId, courseId);
    const isEnrolled = Boolean(enrollment);

    // Check access: enrolled OR free preview
    const hasAccess = isEnrolled || lesson.isFreePreview;

    if (!hasAccess) {
      throw new ForbiddenException(
        'You must enroll in this course to access this lesson',
      );
    }

    return { lesson, hasAccess: true };
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
      const allLessons = enrollment.course.sections.flatMap((s) => s.lessons);
      const totalLessons = allLessons.length;

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

        instructor: {
          id: enrollment.course.instructor?.id ?? '',
          fullName:
            enrollment.course.instructor?.fullName ?? 'Unknown Instructor',
        },
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
      enrollment.course.tags?.forEach((tag) => userTags.add(tag.toLowerCase()));
    });

    if (userTags.size === 0) {
      // No tags in enrolled courses - return popular courses
      const popularCourses = await this.coursesRepository
        .createQueryBuilder('course')
        .leftJoinAndSelect('course.instructor', 'instructor')
        .loadRelationCountAndMap('course.studentCount', 'course.enrollments')
        .where('course.status = :status', { status: CourseStatus.PUBLISHED })
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
      .where('course.status = :status', { status: CourseStatus.PUBLISHED })
      .andWhere('course.id NOT IN (:...enrolledIds)', {
        enrolledIds: Array.from(enrolledCourseIds),
      });

    // Add tag matching conditions (OR for any tag match)
    const tagConditions = Array.from(userTags).map(
      (_, index) => `LOWER(course.tags) LIKE:tag_${index} `,
    );
    if (tagConditions.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          Array.from(userTags).forEach((tag, index) => {
            if (index === 0) {
              qb.where(`LOWER(course.tags) LIKE:tag_${index} `, {
                [`tag_${index} `]: ` % ${tag}% `,
              });
            } else {
              qb.orWhere(`LOWER(course.tags) LIKE:tag_${index} `, {
                [`tag_${index} `]: ` % ${tag}% `,
              });
            }
          });
        }),
      );
    }

    const candidateCourses = await queryBuilder.getMany();

    // Step 4: Score courses by number of matching tags
    const scoredCourses = candidateCourses.map((course) => {
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

  // --- Instructor: Course Management ---

  async create(
    createCourseDto: CreateCourseDto,
    instructorId: string,
  ): Promise<Course> {
    const course = this.coursesRepository.create({
      ...createCourseDto,
      instructor: { id: instructorId },
      status: CourseStatus.DRAFT, // Default to draft
      isPublished: false, // Legacy field
    });
    return this.coursesRepository.save(course);
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    instructorId: string,
  ): Promise<Course> {
    const course = await this.findOne(id, {
      id: instructorId,
      role: UserRole.INSTRUCTOR,
    } as User);
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You can only update your own courses');
    }
    Object.assign(course, updateCourseDto);
    return this.coursesRepository.save(course);
  }

  async remove(id: string, instructorId: string): Promise<void> {
    const course = await this.findOne(id, {
      id: instructorId,
      role: UserRole.INSTRUCTOR,
    } as User);
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You can only delete your own courses');
    }
    await this.coursesRepository.remove(course);
  }

  async findInstructorCourses(instructorId: string): Promise<Course[]> {
    return this.coursesRepository.find({
      where: { instructorId },
      order: { createdAt: 'DESC' },
      relations: ['sections', 'sections.lessons'], // Load structure
    });
  }

  // --- Instructor: Section Management ---

  async createSection(
    courseId: string,
    dto: CreateSectionDto,
    instructorId: string,
  ): Promise<CourseSection> {
    const course = await this.findOne(courseId, {
      id: instructorId,
      role: UserRole.INSTRUCTOR,
    } as User);
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException(
        'You can only add sections to your own courses',
      );
    }

    // We need to inject CourseSection repository or use dataSource in constructor
    // Assuming you inject it as @InjectRepository(CourseSection) private sectionRepo: Repository<CourseSection>
    // For now, using query runner or assuming it's injected (add to constructor if missing)

    // Quick fix: Add CourseSection to constructor injection if not present:
    // @InjectRepository(CourseSection) private sectionRepository: Repository<CourseSection>

    // Temporary implementation using createQueryBuilder if repo not available directly in snippet context
    // Ideally, update constructor to include sectionRepository

    return this.sectionRepository.save(
      this.sectionRepository.create({ ...dto, courseId }),
    );
  }

  async removeSection(sectionId: string, instructorId: string): Promise<void> {
    const section = await this.sectionRepository.findOne({
      where: { id: sectionId },
      relations: ['course'],
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }
    if (section.course.instructorId !== instructorId) {
      throw new ForbiddenException('Access denied');
    }

    await this.sectionRepository.remove(section);
  }

  // --- Instructor: Lesson Management ---

  async createLesson(
    sectionId: string,
    dto: CreateLessonDto,
    instructorId: string,
  ): Promise<Lesson> {
    const section = await this.sectionRepository.findOne({
      where: { id: sectionId },
      relations: ['course'],
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }
    if (section.course.instructorId !== instructorId) {
      throw new ForbiddenException('Access denied');
    }

    return this.lessonRepository.save(
      this.lessonRepository.create({ ...dto, sectionId }),
    );
  }

  async updateLesson(
    lessonId: string,
    dto: UpdateLessonDto,
    instructorId: string,
  ): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['section', 'section.course'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    if (lesson.section.course.instructorId !== instructorId) {
      throw new ForbiddenException('Access denied');
    }

    Object.assign(lesson, dto);
    return this.lessonRepository.save(lesson);
  }

  async removeLesson(lessonId: string, instructorId: string): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['section', 'section.course'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    if (lesson.section.course.instructorId !== instructorId) {
      throw new ForbiddenException('Access denied');
    }

    await this.lessonRepository.remove(lesson);
  }

  // --- Statistics ---

  async count(): Promise<number> {
    return this.coursesRepository.count();
  }

  async countEnrollments(): Promise<number> {
    return this.enrollmentRepository.count();
  }

  // --- Moderation ---

  async submitForApproval(id: string, userId: string): Promise<Course> {
    const course = await this.findOne(id, { id: userId });
    if (course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only the instructor can submit this course',
      );
    }
    course.status = CourseStatus.PENDING;
    return this.coursesRepository.save(course);
  }

  async approveCourse(id: string): Promise<Course> {
    const course = await this.findOne(id, { role: UserRole.ADMIN });
    course.status = CourseStatus.PUBLISHED;
    course.isPublished = true;
    return this.coursesRepository.save(course);
  }

  async rejectCourse(id: string): Promise<Course> {
    const course = await this.findOne(id, { role: UserRole.ADMIN });
    course.status = CourseStatus.REJECTED;
    course.isPublished = false;
    return this.coursesRepository.save(course);
  }

  async findAllPending(): Promise<Course[]> {
    return this.coursesRepository.find({
      where: { status: CourseStatus.PENDING },
      relations: ['instructor'],
      order: { createdAt: 'DESC' },
    });
  }
}
