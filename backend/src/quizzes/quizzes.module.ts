import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { AiQuizGeneratorService } from './services/ai-quiz-generator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, Question])],
  controllers: [QuizzesController],
  providers: [QuizzesService, AiQuizGeneratorService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
