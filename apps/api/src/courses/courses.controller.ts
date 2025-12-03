import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';

import {
  CoursesService,
  EnrolledCourseDto,
  CoursesListResult,
  CourseRecommendation,
} from './courses.service';
import { CourseLevel, Course } from './entities/course.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Lesson } from './entities/lesson.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('tags')
  getTags(): Promise<string[]> {
    return this.coursesService.getUniqueTags();
  }

  /**
   * Get course recommendations based on enrolled course tags
   */
  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  getRecommendations(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
  ): Promise<CourseRecommendation[]> {
    return this.coursesService.getRecommendations(
      user.id,
      limit ? Number(limit) : 6,
    );
  }

  /**
   * Get enrolled courses for the current user (My Learning)
   */
  @Get('enrolled')
  @UseGuards(JwtAuthGuard)
  getEnrolledCourses(
    @CurrentUser() user: User,
    @Query('archived') archived?: string,
    @Query('status') status?: 'all' | 'in-progress' | 'completed',
  ): Promise<EnrolledCourseDto[]> {
    return this.coursesService.getEnrolledCourses(user.id, {
      archived: archived === 'true',
      status: status ?? 'all',
    });
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('level') level?: CourseLevel,
    @Query('tags') tags?: string, // Received as comma-separated string "react,js"
    @Query('sort') sort?: 'price' | 'date',
    @Query('order') order?: 'ASC' | 'DESC',
  ): Promise<CoursesListResult> {
    // Parse tags string into array if it exists
    const tagsArray = tags ? tags.split(',').map((t) => t.trim()) : undefined;

    return this.coursesService.findAllPublished({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      level,
      tags: tagsArray,
      sort,
      order,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Course> {
    return this.coursesService.findOne(id);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async enroll(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Enrollment> {
    return this.coursesService.enroll(user.id, id);
  }

  @Get(':id/enrollment')
  @UseGuards(JwtAuthGuard)
  async checkEnrollment(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ isEnrolled: boolean; progress: Enrollment | null }> {
    const enrollment = await this.coursesService.checkEnrollment(user.id, id);
    return { isEnrolled: Boolean(enrollment), progress: enrollment };
  }

  /**
   * Get a specific lesson with access control
   * Returns lesson content only if user is enrolled or lesson is free preview
   */
  @Get(':id/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  async getLesson(
    @Param('id') courseId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
  ): Promise<{ lesson: Lesson; hasAccess: boolean }> {
    return this.coursesService.getLessonWithAccessControl(
      user.id,
      courseId,
      lessonId,
    );
  }

  @Post(':id/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  async completeLesson(
    @Param('id') courseId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
  ): Promise<Enrollment> {
    return this.coursesService.completeLesson(user.id, courseId, lessonId);
  }

  /**
   * Archive a course (hide from main list, preserve progress)
   */
  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard)
  async archiveCourse(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    await this.coursesService.archiveCourse(user.id, id);
    return { success: true, message: 'Course archived successfully' };
  }

  /**
   * Unarchive a course (restore to main list)
   */
  @Patch(':id/unarchive')
  @UseGuards(JwtAuthGuard)
  async unarchiveCourse(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    await this.coursesService.unarchiveCourse(user.id, id);
    return { success: true, message: 'Course unarchived successfully' };
  }
}
