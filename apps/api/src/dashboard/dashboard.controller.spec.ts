import { Test, type TestingModule } from '@nestjs/testing';

import { type User } from '../users/entities/user.entity';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const mockDashboardService = {
      getUserStats: jest.fn(),
      getUserProgress: jest.fn(),
      getUserActivity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get(DashboardService);
  });

  const mockUser = { id: 'user-1' } as User;

  describe('getStats', () => {
    it('should call service.getUserStats', async () => {
      const mockStats = { totalCourses: 1 } as any;
      service.getUserStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockUser);

      expect(service.getUserStats).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockStats);
    });
  });

  describe('getProgress', () => {
    it('should call service.getUserProgress', async () => {
      const mockProgress = { enrolledCourses: 1 } as any;
      service.getUserProgress.mockResolvedValue(mockProgress);

      const result = await controller.getProgress(mockUser);

      expect(service.getUserProgress).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockProgress);
    });
  });

  describe('getActivity', () => {
    it('should call service.getUserActivity', async () => {
      const mockActivity = { activities: [] };
      service.getUserActivity.mockResolvedValue(mockActivity);

      const result = await controller.getActivity(mockUser);

      expect(service.getUserActivity).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockActivity);
    });
  });
});
