import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CourseLevel } from './entities/course.entity';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('tags')
  getTags() {
    return this.coursesService.getUniqueTags();
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
  ) {
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
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async enroll(@Param('id') id: string, @CurrentUser() user: User) {
    return this.coursesService.enroll(user.id, id);
  }

  @Get(':id/enrollment')
  @UseGuards(JwtAuthGuard)
  async checkEnrollment(@Param('id') id: string, @CurrentUser() user: User) {
    const enrollment = await this.coursesService.checkEnrollment(user.id, id);
    return { isEnrolled: !!enrollment, progress: enrollment };
  }

  @Post(':id/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  async completeLesson(
    @Param('id') courseId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.completeLesson(user.id, courseId, lessonId);
  }
}
