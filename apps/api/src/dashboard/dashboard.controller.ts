import { Controller, Get, UseGuards } from '@nestjs/common';

import {
  DashboardService,
  ActivityItem,
  AdminStats,
  InstructorStats,
  StudentStats,
  ProgressResult,
} from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(
    @CurrentUser() user: User,
  ): Promise<AdminStats | InstructorStats | StudentStats> {
    return this.dashboardService.getUserStats(user);
  }

  @Get('progress')
  getProgress(@CurrentUser() user: User): Promise<ProgressResult> {
    return this.dashboardService.getUserProgress(user);
  }

  @Get('activity')
  getActivity(
    @CurrentUser() user: User,
  ): Promise<{ activities: ActivityItem[] }> {
    return this.dashboardService.getUserActivity(user);
  }
}
