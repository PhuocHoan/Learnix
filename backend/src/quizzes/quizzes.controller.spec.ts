/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { Quiz, QuizStatus } from './entities/quiz.entity';
import { Question } from './entities/question.entity';

describe('QuizzesController', () => {
  let controller: QuizzesController;
  let quizzesService: jest.Mocked<QuizzesService>;

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
    correctAnswer: 3,
    explanation: 'Basic math',
  };

  const mockUser = {
    id: 'user-1',
    email: 'instructor@example.com',
    role: 'instructor',
  };

  beforeEach(async () => {
    const mockQuizzesService: Partial<jest.Mocked<QuizzesService>> = {
      generateQuizWithAI: jest.fn(),
      findByInstructor: jest.fn(),
      findOne: jest.fn(),
      approveQuiz: jest.fn(),
      updateQuestion: jest.fn(),
      deleteQuestion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [{ provide: QuizzesService, useValue: mockQuizzesService }],
    }).compile();

    controller = module.get<QuizzesController>(QuizzesController);
    quizzesService = module.get(QuizzesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateQuiz', () => {
    it('should generate a quiz using AI', async () => {
      quizzesService.generateQuizWithAI.mockResolvedValue(mockQuiz as Quiz);

      const generateDto = {
        title: 'Test Quiz',
        lessonText: 'Some lesson content',
        numberOfQuestions: 5,
      };

      const result = await controller.generateQuiz(generateDto, mockUser);

      expect(quizzesService.generateQuizWithAI).toHaveBeenCalledWith(
        generateDto,
        mockUser.id,
      );
      expect(result).toEqual(mockQuiz);
    });
  });

  describe('getMyQuizzes', () => {
    it('should return quizzes for the current instructor', async () => {
      const quizzes = [mockQuiz as Quiz];
      quizzesService.findByInstructor.mockResolvedValue(quizzes);

      const result = await controller.getMyQuizzes(mockUser);

      expect(quizzesService.findByInstructor).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual(quizzes);
    });
  });

  describe('getQuiz', () => {
    it('should return a specific quiz', async () => {
      quizzesService.findOne.mockResolvedValue(mockQuiz as Quiz);

      const result = await controller.getQuiz('quiz-1');

      expect(quizzesService.findOne).toHaveBeenCalledWith('quiz-1');
      expect(result).toEqual(mockQuiz);
    });
  });

  describe('approveQuiz', () => {
    it('should approve a quiz', async () => {
      const approvedQuiz = { ...mockQuiz, status: QuizStatus.APPROVED };
      quizzesService.approveQuiz.mockResolvedValue(approvedQuiz as Quiz);

      const result = await controller.approveQuiz('quiz-1');

      expect(quizzesService.approveQuiz).toHaveBeenCalledWith('quiz-1');
      expect(result.status).toBe(QuizStatus.APPROVED);
    });
  });

  describe('updateQuestion', () => {
    it('should update a question', async () => {
      const updatedQuestion = { ...mockQuestion, questionText: 'Updated?' };
      quizzesService.updateQuestion.mockResolvedValue(
        updatedQuestion as Question,
      );

      const result = await controller.updateQuestion('question-1', {
        questionText: 'Updated?',
      });

      expect(quizzesService.updateQuestion).toHaveBeenCalledWith('question-1', {
        questionText: 'Updated?',
      });
      expect(result.questionText).toBe('Updated?');
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      quizzesService.deleteQuestion.mockResolvedValue(undefined);

      const result = await controller.deleteQuestion('question-1');

      expect(quizzesService.deleteQuestion).toHaveBeenCalledWith('question-1');
      expect(result).toEqual({ message: 'Question deleted successfully' });
    });
  });
});
