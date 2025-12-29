import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoursesModule } from '../courses/courses.module';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UsersModule, CoursesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
