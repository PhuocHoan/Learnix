import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CoursesService } from '../courses/courses.service';
import { Course } from '../courses/entities/course.entity';
import { NotificationsService } from '../notifications/notifications.service';

import { Payment, PaymentStatus } from './entities/payment.entity';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPaymentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockCourseRepository = {
    findOne: jest.fn(),
  };

  const mockCoursesService = {
    checkEnrollment: jest.fn(),
    enroll: jest.fn(),
  };

  const mockNotificationsService = {
    notifyPaymentSuccess: jest.fn(),
    notifyPaymentFailed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create a pending payment if valid', async () => {
      const userId = 'user-1';
      const courseId = 'course-1';
      const dto = { courseId };
      const course = { id: courseId, price: 50 };

      mockCourseRepository.findOne.mockResolvedValue(course);
      mockCoursesService.checkEnrollment.mockResolvedValue(false);
      mockPaymentRepository.create.mockReturnValue({
        userId,
        courseId,
        amount: 50,
        status: PaymentStatus.PENDING,
      });
      mockPaymentRepository.save.mockResolvedValue({ id: 'payment-1' });

      const result = await service.createCheckoutSession(userId, dto);

      expect(mockCourseRepository.findOne).toHaveBeenCalledWith({
        where: { id: courseId },
      });
      expect(mockCoursesService.checkEnrollment).toHaveBeenCalledWith(
        userId,
        courseId,
      );
      expect(mockPaymentRepository.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'payment-1' });
    });

    it('should throw NotFoundException if course does not exist', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);
      await expect(
        service.createCheckoutSession('u1', { courseId: 'c1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already enrolled', async () => {
      mockCourseRepository.findOne.mockResolvedValue({ id: 'c1' });
      mockCoursesService.checkEnrollment.mockResolvedValue(true);
      await expect(
        service.createCheckoutSession('u1', { courseId: 'c1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processPayment', () => {
    const payment = {
      id: 'p1',
      userId: 'u1',
      courseId: 'c1',
      amount: 50,
      status: PaymentStatus.PENDING,
      course: { title: 'JS Course', instructorId: 'inst-1' },
    };

    it('should process successful payment', async () => {
      mockPaymentRepository.findOne.mockResolvedValue({ ...payment });
      mockPaymentRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.processPayment('u1', {
        paymentId: 'p1',
        cardDetails: {
          cardNumber: '4242424242424242',
          expiryDate: '12/29',
          cvc: '123',
          cardHolderName: 'Test User',
        },
      });

      expect(result.success).toBe(true);
      expect(result.payment.status).toBe(PaymentStatus.COMPLETED);
      expect(mockCoursesService.enroll).toHaveBeenCalledWith('u1', 'c1');
      expect(mockNotificationsService.notifyPaymentSuccess).toHaveBeenCalled();
    });

    it('should fail payment if mock card failure used', async () => {
      mockPaymentRepository.findOne.mockResolvedValue({ ...payment });
      mockPaymentRepository.save.mockImplementation((p) => Promise.resolve(p));

      await expect(
        service.processPayment('u1', {
          paymentId: 'p1',
          cardDetails: {
            cardNumber: '4000000000000000',
            expiryDate: '12/29',
            cvc: '123',
            cardHolderName: 'Test User',
          },
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockNotificationsService.notifyPaymentFailed).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);
      await expect(
        service.processPayment('u1', {
          paymentId: 'p1',
          cardDetails: { cardNumber: '123' } as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
