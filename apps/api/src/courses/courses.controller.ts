import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Query,
  Body,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  CoursesService,
  EnrolledCourseDto,
  CoursesListResult,
  CourseRecommendation,
} from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { GenerateQuizPreviewDto } from './dto/generate-quiz-preview.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CourseSection } from './entities/course-section.entity';
import { CourseLevel, Course } from './entities/course.entity';
import { Enrollment } from './entities/enrollment.entity';
import { LessonResource } from './entities/lesson-resource.entity';
import { Lesson } from './entities/lesson.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GeneratedQuestion } from '../quizzes/services/ai-quiz-generator.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR)
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

  @Get('instructor/my-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  getMyCourses(@CurrentUser() user: User): Promise<Course[]> {
    return this.coursesService.findInstructorCourses(user.id);
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findPending(): Promise<Course[]> {
    return this.coursesService.findAllPending();
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('level') level?: CourseLevel,
    @Query('tags') tags?: string,
    @Query('sort') sort?: 'price' | 'date',
    @Query('order') order?: 'ASC' | 'DESC',
  ): Promise<CoursesListResult> {
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
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: User,
  ): Promise<Course> {
    return this.coursesService.findOne(id, user);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR)
  async enroll(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Enrollment> {
    return this.coursesService.enroll(user.id, id);
  }

  @Get(':id/enrollment')
  @UseGuards(JwtAuthGuard)
  async checkEnrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<{
    isEnrolled: boolean;
    isInstructor: boolean;
    isAdmin: boolean;
    hasAccess: boolean;
    progress: Enrollment | null;
  }> {
    const accessInfo = await this.coursesService.checkCourseAccess(user, id);
    return {
      isEnrolled: accessInfo.isEnrolled,
      isInstructor: accessInfo.isInstructor,
      isAdmin: accessInfo.isAdmin,
      hasAccess: accessInfo.hasAccess,
      progress: accessInfo.enrollment,
    };
  }

  /**
   * Get a specific lesson with access control
   * Returns lesson content only if user is enrolled or lesson is free preview
   */
  @Get(':id/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  async getLesson(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() user: User,
  ): Promise<{ lesson: Lesson; hasAccess: boolean }> {
    return this.coursesService.getLessonWithAccessControl(
      user,
      courseId,
      lessonId,
    );
  }

  @Post(':id/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR)
  async completeLesson(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() user: User,
  ): Promise<Enrollment | null> {
    return this.coursesService.completeLesson(user, courseId, lessonId);
  }

  /**
   * Archive a course (hide from main list, preserve progress)
   */
  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR)
  async archiveCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    await this.coursesService.archiveCourse(user.id, id);
    return { success: true, message: 'Course archived successfully' };
  }

  /**
   * Unarchive a course (restore to main list)
   */
  @Patch(':id/unarchive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR)
  async unarchiveCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    await this.coursesService.unarchiveCourse(user.id, id);
    return { success: true, message: 'Course unarchived successfully' };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: User,
  ): Promise<Course> {
    return this.coursesService.create(createCourseDto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: User,
  ): Promise<Course> {
    return this.coursesService.update(id, updateCourseDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.coursesService.remove(id, user.id);
  }

  // --- Sections & Lessons ---

  @Post(':id/sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  createSection(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateSectionDto,
    @CurrentUser() user: User,
  ): Promise<CourseSection> {
    return this.coursesService.createSection(courseId, dto, user.id);
  }

  @Delete('sections/:sectionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  deleteSection(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.coursesService.removeSection(sectionId, user.id);
  }

  @Post('sections/:sectionId/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  createLesson(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: User,
  ): Promise<Lesson> {
    return this.coursesService.createLesson(sectionId, dto, user.id);
  }

  @Patch('lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  updateLesson(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: User,
  ): Promise<Lesson> {
    return this.coursesService.updateLesson(lessonId, dto, user.id);
  }

  @Delete('lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  deleteLesson(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.coursesService.removeLesson(lessonId, user.id);
  }

  @Post(':id/lessons/:lessonId/resources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  async addResource(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateResourceDto,
    @CurrentUser() user: User,
  ): Promise<LessonResource> {
    return this.coursesService.addResource(lessonId, dto, user.id);
  }

  @Delete('lessons/resources/:resourceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  async removeResource(
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.coursesService.removeResource(resourceId, user.id);
  }

  @Post(':id/sections/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  reorderSections(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body('sectionIds') sectionIds: string[],
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.coursesService.reorderSections(courseId, sectionIds, user.id);
  }

  @Post('sections/:sectionId/lessons/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  reorderLessons(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body('lessonIds') lessonIds: string[],
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.coursesService.reorderLessons(sectionId, lessonIds, user.id);
  }
  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: User,
  ): Promise<Course> {
    return this.coursesService.submitForApproval(id);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  approve(@Param('id', ParseUUIDPipe) id: string): Promise<Course> {
    return this.coursesService.approveCourse(id);
  }

  @Post(':id/sections/:sectionId/generate-quiz-preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  async generateQuiz(
    @Body() dto: GenerateQuizPreviewDto,
  ): Promise<{ title: string; questions: GeneratedQuestion[] }> {
    return this.coursesService.generateQuizPreview(dto);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ): Promise<Course> {
    return this.coursesService.rejectCourse(id, reason);
  }
}
