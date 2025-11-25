import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz, QuizStatus } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import {
  AiQuizGeneratorService,
  GeneratedQuestion,
} from './services/ai-quiz-generator.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private quizzesRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    private aiQuizGenerator: AiQuizGeneratorService,
  ) {}

  async generateQuizWithAI(
    generateDto: GenerateQuizDto,
    instructorId: string,
  ): Promise<Quiz> {
    // Generate questions using AI
    const generatedQuestions = await this.aiQuizGenerator.generateQuizFromText(
      generateDto.lessonText,
      generateDto.numberOfQuestions,
    );

    // Create quiz entity
    const quiz = this.quizzesRepository.create({
      title: generateDto.title,
      description: 'AI-generated quiz',
      status: QuizStatus.AI_GENERATED,
      createdBy: instructorId,
      aiGenerated: true,
    });

    const savedQuiz = await this.quizzesRepository.save(quiz);

    // Create question entities
    const questions = generatedQuestions.map((q: GeneratedQuestion) =>
      this.questionsRepository.create({
        quizId: savedQuiz.id,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }),
    );

    await this.questionsRepository.save(questions);

    // Return quiz with questions
    return this.findOne(savedQuiz.id);
  }

  async findOne(id: string): Promise<Quiz> {
    const quiz = await this.quizzesRepository.findOne({
      where: { id },
      relations: ['questions'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async updateQuestion(
    questionId: string,
    updateDto: UpdateQuestionDto,
  ): Promise<Question> {
    const question = await this.questionsRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    Object.assign(question, updateDto);
    return this.questionsRepository.save(question);
  }

  async deleteQuestion(questionId: string): Promise<void> {
    const result = await this.questionsRepository.delete(questionId);
    if (result.affected === 0) {
      throw new NotFoundException('Question not found');
    }
  }

  async approveQuiz(quizId: string): Promise<Quiz> {
    const quiz = await this.findOne(quizId);
    quiz.status = QuizStatus.APPROVED;
    return this.quizzesRepository.save(quiz);
  }

  async findByInstructor(instructorId: string): Promise<Quiz[]> {
    return this.quizzesRepository.find({
      where: { createdBy: instructorId },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
    });
  }
}
