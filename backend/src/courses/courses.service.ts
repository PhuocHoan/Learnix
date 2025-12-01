import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Course } from './entities/course.entity';
import { Enrollment } from './entities/enrollment.entity';
import { CourseFilterOptions } from './dto/filter-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  async findAllPublished(options: CourseFilterOptions) {
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

  async getUniqueTags() {
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

  async findOne(id: string) {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['instructor', 'sections', 'sections.lessons'],
      order: {
        sections: { orderIndex: 'ASC', lessons: { orderIndex: 'ASC' } },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async enroll(userId: string, courseId: string) {
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

  async checkEnrollment(userId: string, courseId: string) {
    return this.enrollmentRepository.findOne({
      where: { userId, courseId },
    });
  }

  async completeLesson(userId: string, courseId: string, lessonId: string) {
    const enrollment = await this.checkEnrollment(userId, courseId);
    if (!enrollment) {
      throw new NotFoundException('User is not enrolled in this course');
    }

    // Initialize array if null (legacy data safety)
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
}
