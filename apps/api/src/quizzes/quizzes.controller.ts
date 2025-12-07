import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';

import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question } from './entities/question.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { Quiz } from './entities/quiz.entity';
import { QuizzesService } from './quizzes.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Patch(':id/reorder-questions')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async reorderQuestions(
    @Param('id') id: string,
    @Body() body: { questionIds: string[] },
  ): Promise<{ message: string }> {
    await this.quizzesService.reorderQuestions(id, body.questionIds);
    return { message: 'Questions reordered successfully' };
  }

  @Post()
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createQuiz(
    @Body() createDto: CreateQuizDto,
    @CurrentUser() user: User,
  ): Promise<Quiz> {
    return this.quizzesService.create(createDto, user.id);
  }

  @Post(':id/questions')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createQuestion(
    @Param('id') quizId: string,
    @Body() createDto: CreateQuestionDto,
  ): Promise<Question> {
    return this.quizzesService.createQuestion(quizId, createDto);
  }

  @Get('by-lesson/:lessonId')
  async getQuizByLesson(@Param('lessonId') lessonId: string): Promise<Quiz> {
    const quiz = await this.quizzesService.findByLesson(lessonId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found for this lesson');
    }
    return quiz;
  }

  @Post('generate')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async generateQuiz(
    @Body() generateDto: GenerateQuizDto,
    @CurrentUser() user: User,
  ): Promise<Quiz> {
    return this.quizzesService.generateQuizWithAI(generateDto, user.id);
  }

  @Get('my-quizzes')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getMyQuizzes(@CurrentUser() user: User): Promise<Quiz[]> {
    return this.quizzesService.findByInstructor(user.id);
  }

  @Get(':id')
  async getQuiz(@Param('id') id: string): Promise<Quiz> {
    return this.quizzesService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async approveQuiz(@Param('id') id: string): Promise<Quiz> {
    return this.quizzesService.approveQuiz(id);
  }

  @Patch('questions/:questionId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateDto: UpdateQuestionDto,
  ): Promise<Question> {
    return this.quizzesService.updateQuestion(questionId, updateDto);
  }

  @Delete('questions/:questionId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async deleteQuestion(
    @Param('questionId') questionId: string,
  ): Promise<{ message: string }> {
    await this.quizzesService.deleteQuestion(questionId);
    return { message: 'Question deleted successfully' };
  }

  @Post(':id/save-progress')
  async saveProgress(
    @Param('id') id: string,
    @Body() submitDto: SubmitQuizDto,
    @CurrentUser() user: User,
  ): Promise<QuizSubmission> {
    return this.quizzesService.saveProgress(user.id, id, submitDto.answers);
  }
  @Post(':id/submit')
  async submitQuiz(
    @Param('id') id: string,
    @Body() submitDto: SubmitQuizDto,
    @CurrentUser() user: User,
  ): Promise<QuizSubmission> {
    return this.quizzesService.submitQuiz(user.id, id, submitDto);
  }

  @Get(':id/submission')
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
