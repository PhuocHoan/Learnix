import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('tags')
  getTags() {
    return this.coursesService.getUniqueTags();
  }

  @Get()
  findAll(@Query('limit') limit?: number) {
    return this.coursesService.findAllPublished(limit);
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
