import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Question } from './entities/question.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { Quiz } from './entities/quiz.entity';
import { QuizzesService } from './quizzes.service';
import { GeneratedQuestion } from './services/ai-quiz-generator.service';

@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Patch(':id/reorder-questions')
  @Roles(UserRole.INSTRUCTOR)
  async reorderQuestions(
    @Param('id') id: string,
    @Body() body: { questionIds: string[] },
  ): Promise<{ message: string }> {
    await this.quizzesService.reorderQuestions(id, body.questionIds);
    return { message: 'Questions reordered successfully' };
  }

  @Post()
  @Roles(UserRole.INSTRUCTOR)
  async createQuiz(
    @Body() createDto: CreateQuizDto,
    @CurrentUser() user: User,
  ): Promise<Quiz> {
    return await this.quizzesService.create(createDto, user.id);
  }

  @Post(':id/questions')
  @Roles(UserRole.INSTRUCTOR)
  async createQuestion(
    @Param('id') quizId: string,
    @Body() createDto: CreateQuestionDto,
  ): Promise<Question> {
    return await this.quizzesService.createQuestion(quizId, createDto);
  }

  @Post('generate')
  @Roles(UserRole.INSTRUCTOR)
  async generateQuiz(
    @Body() body: { text: string; count: number; types: string[] },
  ): Promise<{ title: string; questions: GeneratedQuestion[] }> {
    return await this.quizzesService.generateQuiz(
      body.text,
      body.count,
      body.types,
    );
  }

  @Get('by-lesson/:lessonId')
  async getQuizByLesson(
    @Param('lessonId') lessonId: string,
  ): Promise<Quiz | null> {
    const quiz = await this.quizzesService.findByLesson(lessonId);
    return quiz ?? null;
  }

  @Get('my-quizzes')
  @Roles(UserRole.INSTRUCTOR)
  async getMyQuizzes(@CurrentUser() user: User): Promise<Quiz[]> {
    return await this.quizzesService.findByInstructor(user.id);
  }

  @Get(':id')
  async getQuiz(@Param('id') id: string): Promise<Quiz> {
    return await this.quizzesService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.INSTRUCTOR)
  async approveQuiz(@Param('id') id: string): Promise<Quiz> {
    return await this.quizzesService.approveQuiz(id);
  }

  @Patch('questions/:questionId')
  @Roles(UserRole.INSTRUCTOR)
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateDto: UpdateQuestionDto,
  ): Promise<Question> {
    return await this.quizzesService.updateQuestion(questionId, updateDto);
  }

  @Delete('questions/:questionId')
  @Roles(UserRole.INSTRUCTOR)
  async deleteQuestion(
    @Param('questionId') questionId: string,
  ): Promise<{ message: string }> {
    await this.quizzesService.deleteQuestion(questionId);
    return { message: 'Question deleted successfully' };
  }

  @Patch(':id')
  @Roles(UserRole.INSTRUCTOR)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuizDto,
  ): Promise<Quiz> {
    return await this.quizzesService.update(id, updateDto);
  }

  @Post(':id/save-progress')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  async saveProgress(
    @Param('id') id: string,
    @Body() submitDto: SubmitQuizDto,
    @CurrentUser() user: User,
  ): Promise<QuizSubmission> {
    return await this.quizzesService.saveProgress(
      user.id,
      id,
      submitDto.answers,
    );
  }
  @Post(':id/submit')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  async submitQuiz(
    @Param('id') id: string,
    @Body() submitDto: SubmitQuizDto,
    @CurrentUser() user: User,
  ): Promise<QuizSubmission> {
    return await this.quizzesService.submitQuiz(user.id, id, submitDto);
  }

  @Get(':id/submission')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getSubmission(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<QuizSubmission | null> {
    const submission = await this.quizzesService.getSubmission(user.id, id);
    if (!submission) {
      // It's not an error to not have a submission, just return empty/null-like structure or null
      // But for API consistency, let's allow 200 OK with null content or 404
      // Let's return null to signify no attempt yet.
      return null;
    }
    return submission;
  }
}
