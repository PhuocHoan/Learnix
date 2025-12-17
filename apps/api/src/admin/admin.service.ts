import { Injectable } from '@nestjs/common';

import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';

export interface SystemStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
}

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private coursesService: CoursesService,
  ) {}

  async getSystemStats(): Promise<SystemStats> {
    const totalUsers = await this.usersService.count();
    const totalCourses = await this.coursesService.count();
    const totalEnrollments = await this.coursesService.countEnrollments();

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
    };
  }
}
