import { Injectable } from '@nestjs/common';

import { UsersService } from '../users/users.service';

export interface SystemStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
}

@Injectable()
export class AdminService {
  constructor(private usersService: UsersService) {}

  async getSystemStats(): Promise<SystemStats> {
    const totalUsers = await this.usersService.count();

    return {
      totalUsers,
      totalCourses: 0, // Will be implemented when courses module is created
      totalEnrollments: 0, // Will be implemented when enrollments module is created
    };
  }
}
