import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { CourseSection } from '../courses/entities/course-section.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { NotificationsService } from '../notifications/notifications.service';

import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Question } from './entities/question.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { Quiz, QuizStatus } from './entities/quiz.entity';
import {
  AiQuizGeneratorService,
  GeneratedQuestion,
} from './services/ai-quiz-generator.service';

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
    private notificationsService: NotificationsService,
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

    return await this.findOne(savedQuiz.id);
  }

  async generateQuiz(
    lessonText: string,
    count: number,
    types: string[],
  ): Promise<{ title: string; questions: GeneratedQuestion[] }> {
    return await this.aiQuizGenerator.generateQuizFromText(
      lessonText,
      count,
      types,
    );
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

    return await this.quizzesRepository.save(quiz);
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

    return await this.questionsRepository.save(question);
  }

  async findByLesson(lessonId: string): Promise<Quiz | null> {
    // Prefer the newest quiz that actually has questions.
    // This avoids returning an empty draft quiz (0 questions) in learner view.
    const quizWithQuestions = await this.quizzesRepository
      .createQueryBuilder('quiz')
      .innerJoinAndSelect('quiz.questions', 'question')
      .where('quiz.lessonId = :lessonId', { lessonId })
      .orderBy('quiz.createdAt', 'DESC')
      .addOrderBy('question.position', 'ASC')
      .getOne();

    if (quizWithQuestions) {
      return quizWithQuestions;
    }

    // Fallback: return latest quiz even if it has no questions.
    return await this.quizzesRepository.findOne({
      where: { lessonId },
      relations: ['questions'],
      order: {
        createdAt: 'DESC',
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
    return await this.questionsRepository.save(question);
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
    return await this.quizzesRepository.save(quiz);
  }

  async findByInstructor(instructorId: string): Promise<Quiz[]> {
    return await this.quizzesRepository.find({
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

    return await this.submissionRepository.save(submission);
  }

  async submitQuiz(
    userId: string,
    quizId: string,
    submitDto: SubmitQuizDto,
  ): Promise<QuizSubmission> {
    const quiz = await this.findOne(quizId);

    // Resolve courseId if missing (often missing on quizzes attached to lessons)
    if (!quiz.courseId && quiz.lessonId) {
      const lesson = await this.lessonsRepository.findOne({
        where: { id: quiz.lessonId },
        relations: ['section'],
      });
      if (lesson?.section?.courseId) {
        quiz.courseId = lesson.section.courseId;
      } else if (lesson?.sectionId) {
        // Fallback: try to find section directly
        const section = await this.lessonsRepository.manager
          .getRepository(CourseSection)
          .findOne({ where: { id: lesson.sectionId } });
        if (section?.courseId) {
          quiz.courseId = section.courseId;
        }
      }
    }

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

    const savedSubmission = await this.submissionRepository.save(submission);

    return savedSubmission;
  }

  async getSubmission(
    userId: string,
    quizId: string,
  ): Promise<QuizSubmission | null> {
    // Return the latest submission, regardless of completion status.
    // Frontend handles distinguishing incomplete/complete.
    return await this.submissionRepository.findOne({
      where: { userId, quizId },
      order: { completedAt: 'DESC' },
    });
  }
}
