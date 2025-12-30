import { Test, type TestingModule } from '@nestjs/testing';

import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import type { User } from '../users/entities/user.entity';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;
  let usersService: jest.Mocked<UsersService>;

  const mockAdminService: Partial<jest.Mocked<AdminService>> = {
    getSystemStats: jest.fn(),
  };

  const mockUsersService: Partial<jest.Mocked<UsersService>> = {
    findAll: jest.fn(),
    updateRole: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockUser: Partial<User> = {
    id: '1',
    email: 'test@example.com',
    fullName: 'Test User',
    role: UserRole.STUDENT,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get(AdminService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      const users = [mockUser as User];
      usersService.findAll.mockResolvedValue(users);

      const result = await controller.getAllUsers();

      expect(usersService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });

    it('should return empty array when no users exist', async () => {
      usersService.findAll.mockResolvedValue([]);

      const result = await controller.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const updatedUser = { ...mockUser, role: UserRole.ADMIN } as User;
      usersService.updateRole.mockResolvedValue(updatedUser);

      const result = await controller.updateUserRole('1', {
        role: UserRole.ADMIN,
      });

      expect(usersService.updateRole).toHaveBeenCalledWith('1', UserRole.ADMIN);
      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('updateUserStatus', () => {
    it('should deactivate user', async () => {
      const deactivatedUser = { ...mockUser, isActive: false } as User;
      usersService.updateStatus.mockResolvedValue(deactivatedUser);

      const result = await controller.updateUserStatus('1', {
        isActive: false,
      });

      expect(usersService.updateStatus).toHaveBeenCalledWith('1', false);
      expect(result.isActive).toBe(false);
    });

    it('should activate user', async () => {
      const activatedUser = { ...mockUser, isActive: true } as User;
      usersService.updateStatus.mockResolvedValue(activatedUser);

      const result = await controller.updateUserStatus('1', { isActive: true });

      expect(usersService.updateStatus).toHaveBeenCalledWith('1', true);
      expect(result.isActive).toBe(true);
    });
  });

  describe('getSystemStats', () => {
    it('should return system statistics', async () => {
      const stats = {
        totalUsers: 10,
        totalCourses: 5,
        totalEnrollments: 20,
        userGrowth: [],
        courseGrowth: [],
        enrollmentGrowth: [],
        revenueGrowth: [],
        avgCompletionRate: 0,
        totalRevenue: 0,
        activeInstructors: 0,
        categoryDistribution: [],
      };
      adminService.getSystemStats.mockResolvedValue(stats);

      const result = await controller.getSystemStats();

      expect(adminService.getSystemStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(stats);
    });
  });
});
