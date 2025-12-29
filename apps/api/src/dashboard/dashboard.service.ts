import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
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
}

export interface InstructorStats {
  coursesCreated: number;
  totalStudents: number;
  averageRating: number;
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
  ) {}

  async getUserStats(
    user: User,
  ): Promise<AdminStats | InstructorStats | StudentStats> {
    // 1. ADMIN STATS
    if (user.role === UserRole.ADMIN) {
      const totalUsers = await this.userRepository.count();
      const totalCourses = await this.courseRepository.count();
      const totalEnrollments = await this.enrollmentRepository.count();

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const activeStudents = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .where('enrollment.lastAccessedAt >= :lastWeek', { lastWeek })
        .getCount();

      return {
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeStudents,
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
        .select('COUNT(DISTINCT enrollment.userId)', 'total')
        .getRawOne<{ total: string }>();

      return {
        coursesCreated,
        totalStudents: parseInt(result?.total ?? '0', 10),
        averageRating: 0,
      };
    }

    // 3. STUDENT STATS
    const enrollments = await this.enrollmentRepository.find({
      where: { userId: user.id },
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

    return {
      coursesEnrolled: enrollments.length,
      hoursLearned: Math.round(totalDurationSeconds / 3600),
      averageScore: 0,
    };
  }

  async getUserProgress(user: User): Promise<ProgressResult> {
    const enrollments = await this.enrollmentRepository.find({
      where: { userId: user.id },
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
