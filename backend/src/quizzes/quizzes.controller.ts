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
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

interface JwtUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post('generate')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async generateQuiz(
    @Body() generateDto: GenerateQuizDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.quizzesService.generateQuizWithAI(generateDto, user.userId);
  }

  @Get('my-quizzes')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getMyQuizzes(@CurrentUser() user: JwtUser) {
    return this.quizzesService.findByInstructor(user.userId);
  }

  @Get(':id')
  async getQuiz(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async approveQuiz(@Param('id') id: string) {
    return this.quizzesService.approveQuiz(id);
  }

  @Patch('questions/:questionId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateDto: UpdateQuestionDto,
  ) {
    return this.quizzesService.updateQuestion(questionId, updateDto);
  }

  @Delete('questions/:questionId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async deleteQuestion(@Param('questionId') questionId: string) {
    await this.quizzesService.deleteQuestion(questionId);
    return { message: 'Question deleted successfully' };
  }
}
