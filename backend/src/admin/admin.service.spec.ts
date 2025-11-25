/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';

describe('AdminService', () => {
  let service: AdminService;
  let usersService: jest.Mocked<UsersService>;

  const mockUsersService: Partial<jest.Mocked<UsersService>> = {
    count: jest.fn(),
    findAll: jest.fn(),
    updateRole: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemStats', () => {
    it('should return system statistics with total users count', async () => {
      const expectedCount = 42;
      usersService.count.mockResolvedValue(expectedCount);

      const result = await service.getSystemStats();

      expect(usersService.count).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        totalUsers: expectedCount,
        totalCourses: 0,
        totalEnrollments: 0,
      });
    });

    it('should return zero users when no users exist', async () => {
      usersService.count.mockResolvedValue(0);

      const result = await service.getSystemStats();

      expect(result.totalUsers).toBe(0);
    });
  });
});
