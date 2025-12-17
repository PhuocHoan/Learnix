import { Test, type TestingModule } from '@nestjs/testing';

import { AdminService } from './admin.service';
import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';

describe('AdminService', () => {
  let service: AdminService;
  let usersService: jest.Mocked<UsersService>;
  let coursesService: jest.Mocked<CoursesService>;

  const mockUsersService: Partial<jest.Mocked<UsersService>> = {
    count: jest.fn(),
    findAll: jest.fn(),
    updateRole: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockCoursesService: Partial<jest.Mocked<CoursesService>> = {
    count: jest.fn(),
    countEnrollments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: CoursesService, useValue: mockCoursesService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    usersService = module.get(UsersService);
    coursesService = module.get(CoursesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemStats', () => {
    it('should return system statistics with counts', async () => {
      const userCount = 42;
      const courseCount = 10;
      const enrollmentCount = 150;

      usersService.count.mockResolvedValue(userCount);
      coursesService.count.mockResolvedValue(courseCount);
      coursesService.countEnrollments.mockResolvedValue(enrollmentCount);

      const result = await service.getSystemStats();

      expect(usersService.count).toHaveBeenCalledTimes(1);
      expect(coursesService.count).toHaveBeenCalledTimes(1);
      expect(coursesService.countEnrollments).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        totalUsers: userCount,
        totalCourses: courseCount,
        totalEnrollments: enrollmentCount,
      });
    });

    it('should return zero counts when no data exists', async () => {
      usersService.count.mockResolvedValue(0);
      coursesService.count.mockResolvedValue(0);
      coursesService.countEnrollments.mockResolvedValue(0);

      const result = await service.getSystemStats();

      expect(result).toEqual({
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
      });
    });
  });
});
