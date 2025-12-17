import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { CourseSection } from './entities/course-section.entity';
import { Course } from './entities/course.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Lesson } from './entities/lesson.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseSection, Lesson, Enrollment]),
    QuizzesModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService], // Exporting service in case other modules need it
})
export class CoursesModule {}
