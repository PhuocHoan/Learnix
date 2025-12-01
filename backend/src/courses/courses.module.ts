import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './entities/course.entity';
import { CourseSection } from './entities/course-section.entity';
import { Lesson } from './entities/lesson.entity';
import { Enrollment } from './entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseSection, Lesson, Enrollment]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService], // Exporting service in case other modules need it
})
export class CoursesModule {}
