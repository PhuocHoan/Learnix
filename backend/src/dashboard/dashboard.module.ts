import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { Lesson } from '../courses/entities/lesson.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Course, Enrollment, Lesson])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
