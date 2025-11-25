import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@CurrentUser() user: User) {
    return this.dashboardService.getUserStats(user);
  }

  @Get('progress')
  getProgress(@CurrentUser() user: User) {
    return this.dashboardService.getUserProgress(user);
  }

  @Get('activity')
  getActivity(@CurrentUser() user: User) {
    return this.dashboardService.getUserActivity(user);
  }
}
