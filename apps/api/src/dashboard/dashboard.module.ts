import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { User } from '../users/entities/user.entity';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Course, Enrollment, Lesson])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
