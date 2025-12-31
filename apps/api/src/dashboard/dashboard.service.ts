import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { CourseStatus } from '../courses/enums/course-status.enum';
import { QuizSubmission } from '../quizzes/entities/quiz-submission.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

// Define a local interface for the activity object structure
export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  course?: string;
  timestamp: string;
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  activeStudents: number;
  newUsersCount: number;
  newCoursesCount: number;
}

export interface InstructorStats {
  coursesCreated: number;
  totalStudents: number;
  activeStudents: number;
  newStudentsCount: number;
}

export interface StudentStats {
  coursesEnrolled: number;
  hoursLearned: number;
  averageScore: number;
}

export interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export interface ProgressResult {
  currentCourses: CourseProgress[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(QuizSubmission)
    private quizSubmissionRepository: Repository<QuizSubmission>,
  ) {}

  async getUserStats(
    user: User,
  ): Promise<AdminStats | InstructorStats | StudentStats> {
    // 1. ADMIN STATS
    if (user.role === UserRole.ADMIN) {
      const totalUsers = await this.userRepository.count();
      const totalCourses = await this.courseRepository.count({
        where: { isPublished: true, status: CourseStatus.PUBLISHED },
      });

      const totalEnrollments = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .leftJoin('enrollment.course', 'course')
        .where('course.isPublished = :isPublished', { isPublished: true })
        .andWhere('course.status = :status', { status: CourseStatus.PUBLISHED })
        .getCount();

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const activeStudents = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .where('enrollment.lastAccessedAt >= :lastWeek', { lastWeek })
        .getCount();

      const newUsersCount = await this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :lastWeek', { lastWeek })
        .getCount();

      const newCoursesCount = await this.courseRepository
        .createQueryBuilder('course')
        .where('course.createdAt >= :lastWeek', { lastWeek })
        .andWhere('course.isPublished = :isPublished', { isPublished: true })
        .getCount();

      return {
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeStudents,
        newUsersCount,
        newCoursesCount,
      };
    }

    // 2. INSTRUCTOR STATS
    if (user.role === UserRole.INSTRUCTOR) {
      const coursesCreated = await this.courseRepository.count({
        where: { instructor: { id: user.id } },
      });

      // Fix: Added generic type to getRawOne to avoid 'any' errors
      const result = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .leftJoin('enrollment.course', 'course')
        .where('course.instructorId = :instructorId', { instructorId: user.id })
        .andWhere('course.isPublished = :isPublished', { isPublished: true }) // Filter unpublished
        .select('COUNT(DISTINCT enrollment.userId)', 'total')
        .getRawOne<{ total: string }>();

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      // Active Students (accessed in last 7 days)
      const activeStudentsResult = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .leftJoin('enrollment.course', 'course')
        .where('course.instructorId = :instructorId', { instructorId: user.id })
        .andWhere('enrollment.lastAccessedAt >= :lastWeek', { lastWeek })
        .andWhere('course.isPublished = :isPublished', { isPublished: true })
        .select('COUNT(DISTINCT enrollment.userId)', 'total')
        .getRawOne<{ total: string }>();

      // New Students (enrolled in last 7 days)
      const newStudentsResult = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .leftJoin('enrollment.course', 'course')
        .where('course.instructorId = :instructorId', { instructorId: user.id })
        .andWhere('enrollment.enrolledAt >= :lastWeek', { lastWeek })
        .andWhere('course.isPublished = :isPublished', { isPublished: true })
        .select('COUNT(DISTINCT enrollment.userId)', 'total')
        .getRawOne<{ total: string }>();

      return {
        coursesCreated,
        totalStudents: parseInt(result?.total ?? '0', 10),
        activeStudents: parseInt(activeStudentsResult?.total ?? '0', 10),
        newStudentsCount: parseInt(newStudentsResult?.total ?? '0', 10),
      };
    }

    // 3. STUDENT STATS
    const enrollments = await this.enrollmentRepository.find({
      where: {
        userId: user.id,
        course: {
          isPublished: true,
          status: CourseStatus.PUBLISHED,
        },
      },
      relations: ['course', 'course.sections', 'course.sections.lessons'],
    });

    let totalDurationSeconds = 0;

    for (const enrollment of enrollments) {
      const { completedLessonIds } = enrollment;
      if (!completedLessonIds || completedLessonIds.length === 0) {
        continue;
      }

      const allLessons = enrollment.course.sections.flatMap((s) => s.lessons);

      const completedLessons = allLessons.filter((l) =>
        completedLessonIds.includes(l.id),
      );

      totalDurationSeconds += completedLessons.reduce(
        (sum, l) => sum + l.durationSeconds,
        0,
      );
    }

    // Calculate Average Quiz Score
    const result = await this.quizSubmissionRepository
      .createQueryBuilder('submission')
      .select('AVG(submission.percentage)', 'avgScore')
      .where('submission.userId = :userId', { userId: user.id })
      .getRawOne<{ avgScore: string | null }>();

    const avgScore = result?.avgScore;

    return {
      coursesEnrolled: enrollments.length,
      hoursLearned: Math.round(totalDurationSeconds / 3600),
      averageScore: avgScore ? Math.round(parseFloat(avgScore)) : 0,
    };
  }

  async getUserProgress(user: User): Promise<ProgressResult> {
    const enrollments = await this.enrollmentRepository.find({
      where: {
        userId: user.id,
        course: {
          isPublished: true,
          status: CourseStatus.PUBLISHED,
        },
      },
      relations: ['course', 'course.sections', 'course.sections.lessons'],
      order: { lastAccessedAt: 'DESC' },
    });

    const currentCourses = enrollments.map((enrollment) => {
      const allLessons = enrollment.course.sections.flatMap((s) => s.lessons);
      const totalLessons = allLessons.length;

      // Filter completed IDs to only count existing lessons
      const validCompletedIds = (enrollment.completedLessonIds ?? []).filter(
        (id) => allLessons.some((l) => l.id === id),
      );
      const completedCount = validCompletedIds.length;

      const progress =
        totalLessons > 0
          ? Math.min(100, Math.round((completedCount / totalLessons) * 100))
          : 0;

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        progress,
        totalLessons,
        completedLessons: completedCount,
      };
    });

    return { currentCourses };
  }

  async getUserActivity(user: User): Promise<{ activities: ActivityItem[] }> {
    // FIX: Explicitly type the array here
    const activities: ActivityItem[] = [];

    // 1. Enrollment Activities
    if (user.role === UserRole.STUDENT || !user.role) {
      const recentEnrollments = await this.enrollmentRepository.find({
        where: { userId: user.id },
        relations: ['course'],
        order: { enrolledAt: 'DESC' },
        take: 5,
      });

      recentEnrollments.forEach((enrollment) => {
        activities.push({
          id: enrollment.id,
          type: 'enrollment',
          title: `Enrolled in "${enrollment.course.title}"`,
          course: enrollment.course.title,
          timestamp: enrollment.enrolledAt.toISOString(),
        });
      });
    }

    // 2. Course Creation Activities
    if (user.role === UserRole.INSTRUCTOR) {
      const recentCourses = await this.courseRepository.find({
        where: { instructor: { id: user.id } },
        order: { createdAt: 'DESC' },
        take: 5,
      });

      recentCourses.forEach((course) => {
        activities.push({
          id: course.id,
          type: 'course_created',
          title: `Created course "${course.title}"`,
          timestamp: course.createdAt.toISOString(),
        });
      });
    }

    // 3. User Registration Activity
    if (user.role === UserRole.ADMIN) {
      const recentUsers = await this.userRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
      });

      recentUsers.forEach((u) => {
        activities.push({
          id: u.id,
          type: 'user_registered',
          title: `New user registered: ${u.email}`,
          timestamp: u.createdAt.toISOString(),
        });
      });
    }

    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return { activities };
  }
}
