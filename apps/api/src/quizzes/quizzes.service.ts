import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, IsNull } from 'typeorm';

import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Question } from './entities/question.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { Quiz, QuizStatus } from './entities/quiz.entity';
import { AiQuizGeneratorService } from './services/ai-quiz-generator.service';
import { Lesson } from '../courses/entities/lesson.entity';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private quizzesRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(QuizSubmission)
    private submissionRepository: Repository<QuizSubmission>,
    @InjectRepository(Lesson)
    private lessonsRepository: Repository<Lesson>,
    private aiQuizGenerator: AiQuizGeneratorService,
  ) {}

  async create(createDto: CreateQuizDto, instructorId: string): Promise<Quiz> {
    const { questions, ...quizData } = createDto;
    const quiz = this.quizzesRepository.create({
      ...quizData,
      status: QuizStatus.DRAFT,
      createdBy: instructorId,
      aiGenerated: false,
    });

    // If questions are provided, we can handle them here or after save.
    // However, questions need quizId, so we must save quiz first.
    const savedQuiz = await this.quizzesRepository.save(quiz);

    if (questions && questions.length > 0) {
      const questionEntities = questions.map((q, index) =>
        this.questionsRepository.create({
          quizId: savedQuiz.id,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          type: q.type,
          position: index,
          points: 1,
        }),
      );
      await this.questionsRepository.save(questionEntities);
    }

    return this.findOne(savedQuiz.id);
  }

  async update(id: string, updateDto: UpdateQuizDto): Promise<Quiz> {
    const quiz = await this.findOne(id);

    // Check if we need to update basic fields
    const { questions: _questions, ...data } = updateDto;

    Object.assign(quiz, data);

    // If title is updated and quiz is linked to a lesson, update lesson title
    if (data.title && quiz.lessonId) {
      await this.lessonsRepository.update(quiz.lessonId, { title: data.title });
    }

    return this.quizzesRepository.save(quiz);
  }

  async createQuestion(
    quizId: string,
    createDto: CreateQuestionDto,
  ): Promise<Question> {
    await this.findOne(quizId);

    const question = this.questionsRepository.create({
      quizId,
      ...createDto,
    });

    // Get max position to append to end
    const lastQuestion = await this.questionsRepository.findOne({
      where: { quizId },
      order: { position: 'DESC' },
    });
    question.position = (lastQuestion?.position ?? 0) + 1;

    return this.questionsRepository.save(question);
  }

  async findByLesson(lessonId: string): Promise<Quiz | null> {
    return this.quizzesRepository.findOne({
      where: { lessonId },
      relations: ['questions'],
      order: {
        createdAt: 'DESC', // For the quiz itself
        questions: {
          position: 'ASC',
        },
      },
    });
  }

  async findOne(id: string): Promise<Quiz> {
    const quiz = await this.quizzesRepository.findOne({
      where: { id },
      relations: ['questions'],
      order: {
        questions: {
          position: 'ASC',
        },
      },
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

  async reorderQuestions(quizId: string, questionIds: string[]): Promise<void> {
    const quiz = await this.findOne(quizId);

    // Validate all questions belong to this quiz
    const quizQuestionIds = quiz.questions.map((q) => q.id);
    const validIds = questionIds.every((id) => quizQuestionIds.includes(id));

    if (!validIds) {
      throw new NotFoundException('Some questions do not belong to this quiz');
    }

    // Update positions
    await this.questionsRepository.manager.transaction(async (manager) => {
      for (const [index, questionId] of questionIds.entries()) {
        await manager.update(Question, questionId, { position: index });
      }
    });
  }

  async saveProgress(
    userId: string,
    quizId: string,
    answers: Record<string, string>,
  ): Promise<QuizSubmission> {
    // Find latest incomplete submission or create new
    let submission = await this.submissionRepository.findOne({
      where: { userId, quizId, completedAt: IsNull() },
      order: { completedAt: 'DESC' },
    });

    if (!submission) {
      submission = this.submissionRepository.create({
        userId,
        quizId,
        responses: answers,
      });
    } else {
      submission.responses = { ...submission.responses, ...answers };
    }

    return this.submissionRepository.save(submission);
  }

  async submitQuiz(
    userId: string,
    quizId: string,
    submitDto: SubmitQuizDto,
  ): Promise<QuizSubmission> {
    const quiz = await this.findOne(quizId);

    let score = 0;
    let totalPoints = 0;

    const answersMap = new Map(Object.entries(submitDto.answers));

    quiz.questions.forEach((question) => {
      const studentAnswer = answersMap.get(question.id) ?? '';
      let isCorrect = false;
      const points = question.points || 1;

      if (question.type === 'multi_select') {
        const studentChoices = studentAnswer
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .sort();
        const correctChoices = question.correctAnswer
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .sort();
        isCorrect =
          studentChoices.length === correctChoices.length &&
          studentChoices.every(
            (val, index) => val === correctChoices.at(index),
          );
      } else if (question.type === 'short_answer') {
        isCorrect =
          studentAnswer.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase();
      } else {
        isCorrect = studentAnswer.trim() === question.correctAnswer.trim();
      }

      totalPoints += points;
      if (isCorrect) {
        score += points;
      }
    });

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

    // Check for existing pending submission to update
    let submission = await this.submissionRepository.findOne({
      where: { userId, quizId, completedAt: IsNull() },
    });

    if (submission) {
      submission.score = score;
      submission.totalPoints = totalPoints;
      submission.percentage = percentage;
      submission.responses = submitDto.answers;
      submission.completedAt = new Date();
    } else {
      submission = this.submissionRepository.create({
        quizId,
        userId,
        score,
        totalPoints,
        percentage,
        responses: submitDto.answers,
        completedAt: new Date(),
      });
    }

    return this.submissionRepository.save(submission);
  }

  async getSubmission(
    userId: string,
    quizId: string,
  ): Promise<QuizSubmission | null> {
    // Return the latest submission, regardless of completion status.
    // Frontend handles distinguishing incomplete/complete.
    return this.submissionRepository.findOne({
      where: { userId, quizId },
      order: { completedAt: 'DESC' },
    });
  }
}
