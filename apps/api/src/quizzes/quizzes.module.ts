import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Question } from './entities/question.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { Quiz } from './entities/quiz.entity';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { AiQuizGeneratorService } from './services/ai-quiz-generator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, Question, QuizSubmission])],
  controllers: [QuizzesController],
  providers: [QuizzesService, AiQuizGeneratorService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
