import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { Enrollment } from './entities/enrollment.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  // CẬP NHẬT: Thêm tham số limit
  async findAllPublished(limit?: number) {
    return this.coursesRepository.find({
      where: { isPublished: true },
      relations: ['instructor'],
      order: { createdAt: 'DESC' },
      take: limit, // Áp dụng giới hạn nếu có
    });
  }

  // THÊM MỚI: Lấy danh sách tags duy nhất
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
