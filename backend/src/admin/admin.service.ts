import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(private usersService: UsersService) {}

  async getSystemStats() {
    const totalUsers = await this.usersService.count();

    return {
      totalUsers,
      totalCourses: 0, // Will be implemented when courses module is created
      totalEnrollments: 0, // Will be implemented when enrollments module is created
    };
  }
}
