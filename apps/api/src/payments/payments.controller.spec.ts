import { Test, type TestingModule } from '@nestjs/testing';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: jest.Mocked<PaymentsService>;

  beforeEach(async () => {
    const mockPaymentsService = {
      createCheckoutSession: jest.fn(),
      processPayment: jest.fn(),
      getUserPayments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get(PaymentsService);
  });

  const mockUser = { id: 'user-1' };
  const mockReq = { user: mockUser } as any;

  describe('createCheckoutSession', () => {
    it('should call service.createCheckoutSession', async () => {
      const dto = { courseId: 'course-1' } as any;
      service.createCheckoutSession.mockResolvedValue({
        url: 'http://stripe.url',
      } as any);

      const result = await controller.createCheckoutSession(mockReq, dto);

      expect(service.createCheckoutSession).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual({ url: 'http://stripe.url' });
    });
  });

  describe('processPayment', () => {
    it('should call service.processPayment', async () => {
      const dto = { sessionId: 'session-1' } as any;
      service.processPayment.mockResolvedValue({ success: true } as any);

      const result = await controller.processPayment(mockReq, dto);

      expect(service.processPayment).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual({ success: true });
    });
  });

  describe('getUserPayments', () => {
    it('should call service.getUserPayments', async () => {
      const mockPayments = [{ id: 'payment-1' }] as any;
      service.getUserPayments.mockResolvedValue(mockPayments);

      const result = await controller.getUserPayments(mockReq);

      expect(service.getUserPayments).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockPayments);
    });
  });
});
