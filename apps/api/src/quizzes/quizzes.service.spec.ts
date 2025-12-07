import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Question } from './entities/question.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { Quiz, QuizStatus } from './entities/quiz.entity';
import { QuizzesService } from './quizzes.service';
import { AiQuizGeneratorService } from './services/ai-quiz-generator.service';

import type { Repository, DeleteResult } from 'typeorm';

describe('QuizzesService', () => {
  let service: QuizzesService;
  let quizzesRepository: jest.Mocked<Repository<Quiz>>;
  let questionsRepository: jest.Mocked<Repository<Question>>;
  let submissionRepository: jest.Mocked<Repository<QuizSubmission>>;

  const mockQuiz: Partial<Quiz> = {
    id: 'quiz-1',
    title: 'Test Quiz',
    description: 'AI-generated quiz',
    status: QuizStatus.AI_GENERATED,
    createdBy: 'user-1',
    aiGenerated: true,
    questions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQuestion: Partial<Question> = {
    id: 'question-1',
    quizId: 'quiz-1',
    questionText: 'What is 2 + 2?',
    options: ['1', '2', '3', '4'],
    correctAnswer: 'D',
    explanation: 'Basic math',
    createdAt: new Date(),
  };

  const QUERY_BUILDER_MOCK = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        {
          provide: getRepositoryToken(Quiz),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => QUERY_BUILDER_MOCK),
          },
        },
        {
          provide: getRepositoryToken(Question),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => QUERY_BUILDER_MOCK),
          },
        },
        {
          provide: getRepositoryToken(QuizSubmission),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: AiQuizGeneratorService,
          useValue: {
            generateQuizFromText: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
    quizzesRepository = module.get(getRepositoryToken(Quiz));
    questionsRepository = module.get(getRepositoryToken(Question));
    submissionRepository = module.get(getRepositoryToken(QuizSubmission));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a quiz when found', async () => {
      quizzesRepository.findOne.mockResolvedValue(mockQuiz as Quiz);

      const result = await service.findOne('quiz-1');

      expect(quizzesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'quiz-1' },
        relations: ['questions'],
        order: {
          questions: {
            position: 'ASC',
          },
        },
      });
      expect(result).toEqual(mockQuiz);
    });

    it('should throw NotFoundException when quiz not found', async () => {
      quizzesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateQuestion', () => {
    it('should update a question successfully', async () => {
      const updatedQuestion = {
        ...mockQuestion,
        questionText: 'Updated question?',
      };
      questionsRepository.findOne.mockResolvedValue(mockQuestion as Question);
      questionsRepository.save.mockResolvedValue(updatedQuestion as Question);

      const result = await service.updateQuestion('question-1', {
        questionText: 'Updated question?',
      });

      expect(questionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'question-1' },
      });
      expect(result.questionText).toBe('Updated question?');
    });

    it('should throw NotFoundException when question not found', async () => {
      questionsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateQuestion('nonexistent', { questionText: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question successfully', async () => {
      questionsRepository.delete.mockResolvedValue({
        affected: 1,
      } as DeleteResult);

      await expect(service.deleteQuestion('question-1')).resolves.not.toThrow();
      expect(questionsRepository.delete).toHaveBeenCalledWith('question-1');
    });

    it('should throw NotFoundException when question not found', async () => {
      questionsRepository.delete.mockResolvedValue({
        affected: 0,
      } as DeleteResult);

      await expect(service.deleteQuestion('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approveQuiz', () => {
    it('should approve a quiz successfully', async () => {
      const approvedQuiz = { ...mockQuiz, status: QuizStatus.APPROVED };
      quizzesRepository.findOne.mockResolvedValue(mockQuiz as Quiz);
      quizzesRepository.save.mockResolvedValue(approvedQuiz as Quiz);

      const result = await service.approveQuiz('quiz-1');

      expect(result.status).toBe(QuizStatus.APPROVED);
    });
  });

  describe('findByInstructor', () => {
    it('should return quizzes for an instructor', async () => {
      const quizzes = [mockQuiz as Quiz];
      quizzesRepository.find.mockResolvedValue(quizzes);

      const result = await service.findByInstructor('user-1');

      expect(quizzesRepository.find).toHaveBeenCalledWith({
        where: { createdBy: 'user-1' },
        relations: ['questions'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(quizzes);
    });

    it('should return empty array when no quizzes found', async () => {
      quizzesRepository.find.mockResolvedValue([]);

      const result = await service.findByInstructor('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('reorderQuestions', () => {
    it('should reorder questions', async () => {
      const quizId = 'quiz-1';
      const questionIds = ['q1', 'q2'];
      const questions = [
        { id: 'q1', position: 1 },
        { id: 'q2', position: 0 },
      ];

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: quizId,
        questions: questions as any[],
      } as Quiz);

      (questionsRepository as any).manager = {
        transaction: jest.fn((cb) => cb({ update: jest.fn() })),
      };

      await service.reorderQuestions(quizId, questionIds);

      expect(service.findOne).toHaveBeenCalledWith(quizId);
    });

    it('should throw if question does not belong to quiz', async () => {
      const questions = [{ id: 'q1', position: 0 }] as Question[];
      const quizWithQuestions = { ...mockQuiz, questions };
      quizzesRepository.findOne.mockResolvedValue(quizWithQuestions as Quiz);

      await expect(service.reorderQuestions('quiz-1', ['q2'])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('submitQuiz', () => {
    it('should calculate score correctly (all correct)', async () => {
      const quizId = 'quiz-1';
      const userId = 'user-1';
      const questions = [
        { id: 'q1', correctAnswer: 'A', points: 2 },
        { id: 'q2', correctAnswer: 'B', points: 3 },
      ];
      const answers = { q1: 'A', q2: 'B' };

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: quizId,
        questions: questions as any[],
      } as Quiz);

      const saveSpy = (
        submissionRepository.save as jest.Mock
      ).mockResolvedValue({} as any);
      const createSpy = (
        submissionRepository.create as jest.Mock
      ).mockReturnValue({} as any);

      await service.submitQuiz(userId, quizId, { answers });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 5,
          totalPoints: 5,
          percentage: 100,
          userId,
          quizId,
        }),
      );
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should calculate score correctly (partial correct)', async () => {
      const quizId = 'quiz-1';
      const userId = 'user-1';
      const questions = [
        { id: 'q1', correctAnswer: 'A', points: 2 },
        { id: 'q2', correctAnswer: 'B', points: 3 },
      ];
      const answers = { q1: 'A', q2: 'C' }; // q2 wrong

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: quizId,
        questions: questions as any[],
      } as Quiz);

      const createSpy = (
        submissionRepository.create as jest.Mock
      ).mockReturnValue({} as any);
      (submissionRepository.save as jest.Mock).mockResolvedValue({} as any);

      await service.submitQuiz(userId, quizId, { answers });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 2,
          totalPoints: 5,
          percentage: 40,
        }),
      );
    });
  });
});
