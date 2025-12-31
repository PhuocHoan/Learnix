import { Injectable } from '@nestjs/common';

import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';

export interface SystemStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  userGrowth: { date: string; count: number }[];
  courseGrowth: { date: string; count: number }[];
  enrollmentGrowth: { date: string; count: number }[];
  revenueGrowth: { date: string; count: number }[];
  avgCompletionRate: number;
  totalRevenue: number;
  activeInstructors: number;
  categoryDistribution: { name: string; value: number }[];
}

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private coursesService: CoursesService,
  ) {}

  async getSystemStats(): Promise<SystemStats> {
    const totalUsers = await this.usersService.count();
    const totalCourses = await this.coursesService.countPublished();
    const totalEnrollments =
      await this.coursesService.countPublishedEnrollments();

    // Get trend data (last 30 days)
    const userGrowth = await this.usersService.getGrowthStats(30);
    const courseGrowth = await this.coursesService.getCourseGrowthStats(30);
    const enrollmentGrowth =
      await this.coursesService.getEnrollmentGrowthStats(30);
    const revenueGrowth = await this.coursesService.getRevenueGrowthStats(30);

    // New stats
    const avgCompletionRate =
      await this.coursesService.getAverageCompletionRate();
    const totalRevenue = await this.coursesService.getTotalRevenue();
    const activeInstructors =
      await this.usersService.getActiveInstructorsCount();
    const categoryDistribution =
      await this.coursesService.getCourseCategoryDistribution();

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      userGrowth,
      courseGrowth,
      enrollmentGrowth,
      revenueGrowth,
      avgCompletionRate,
      totalRevenue,
      activeInstructors,
      categoryDistribution,
    };
  }
}
