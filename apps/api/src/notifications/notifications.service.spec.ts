import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Notification } from './entities/notification.entity';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockGateway = {
    emitToUser: jest.fn(),
    emitUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
        {
          provide: NotificationsGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a notification', async () => {
      const data = { userId: 'u1', title: 'Test', message: 'Hello' };
      mockRepository.create.mockReturnValue(data);
      mockRepository.save.mockResolvedValue({ id: 'n1', ...data });

      const result = await service.create('u1', 'Test', 'Hello');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          title: 'Test',
          message: 'Hello',
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockGateway.emitToUser).toHaveBeenCalledWith(
        'u1',
        expect.anything(),
      );
      expect(result.id).toBe('n1');
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      mockRepository.findAndCount.mockResolvedValue([[{ id: 'n1' }], 1]);
      mockRepository.count.mockResolvedValue(0);

      const result = await service.findAll('u1', 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = { id: 'n1', isRead: false };
      mockRepository.findOne.mockResolvedValue(notification);
      mockRepository.save.mockResolvedValue({ ...notification, isRead: true });

      await service.markAsRead('u1', 'n1');

      expect(notification.isRead).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('notifyEnrollment should call create with correct params', async () => {
      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue({} as any);
      await service.notifyEnrollment('u1', 'Math 101', 'c1');

      expect(createSpy).toHaveBeenCalledWith(
        'u1',
        'Enrolled Successfully! 🎉',
        expect.stringContaining('Math 101'),
        'success',
        NotificationType.ENROLLMENT,
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
