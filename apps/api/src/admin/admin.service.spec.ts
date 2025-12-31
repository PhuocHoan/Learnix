import { Test, type TestingModule } from '@nestjs/testing';

import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';

import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let usersService: jest.Mocked<UsersService>;
  let coursesService: jest.Mocked<CoursesService>;

  const mockUsersService: Partial<jest.Mocked<UsersService>> = {
    count: jest.fn(),
    findAll: jest.fn(),
    updateRole: jest.fn(),
    updateStatus: jest.fn(),
    getGrowthStats: jest.fn(),
    getActiveInstructorsCount: jest.fn(),
  };

  const mockCoursesService: Partial<jest.Mocked<CoursesService>> = {
    count: jest.fn(),
    countPublished: jest.fn(),
    countEnrollments: jest.fn(),
    countPublishedEnrollments: jest.fn(),
    getCourseGrowthStats: jest.fn(),
    getEnrollmentGrowthStats: jest.fn(),
    getRevenueGrowthStats: jest.fn(),
    getAverageCompletionRate: jest.fn(),
    getTotalRevenue: jest.fn(),
    getCourseCategoryDistribution: jest.fn(),
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
      usersService.getGrowthStats.mockResolvedValue([]);
      usersService.getActiveInstructorsCount.mockResolvedValue(5);

      coursesService.countPublished.mockResolvedValue(courseCount);
      coursesService.countPublishedEnrollments.mockResolvedValue(
        enrollmentCount,
      );
      coursesService.getCourseGrowthStats.mockResolvedValue([]);
      coursesService.getEnrollmentGrowthStats.mockResolvedValue([]);
      coursesService.getRevenueGrowthStats.mockResolvedValue([]);
      coursesService.getAverageCompletionRate.mockResolvedValue(75);
      coursesService.getTotalRevenue.mockResolvedValue(1000);
      coursesService.getCourseCategoryDistribution.mockResolvedValue([]);

      const result = await service.getSystemStats();

      expect(usersService.count).toHaveBeenCalledTimes(1);
      expect(coursesService.countPublished).toHaveBeenCalledTimes(1);
      expect(coursesService.countPublishedEnrollments).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        totalUsers: userCount,
        totalCourses: courseCount,
        totalEnrollments: enrollmentCount,
        userGrowth: [],
        courseGrowth: [],
        enrollmentGrowth: [],
        revenueGrowth: [],
        avgCompletionRate: 75,
        totalRevenue: 1000,
        activeInstructors: 5,
        categoryDistribution: [],
      });
    });

    it('should return zero counts when no data exists', async () => {
      usersService.count.mockResolvedValue(0);
      usersService.getGrowthStats.mockResolvedValue([]);
      usersService.getActiveInstructorsCount.mockResolvedValue(0);

      coursesService.countPublished.mockResolvedValue(0);
      coursesService.countPublishedEnrollments.mockResolvedValue(0);
      coursesService.getCourseGrowthStats.mockResolvedValue([]);
      coursesService.getEnrollmentGrowthStats.mockResolvedValue([]);
      coursesService.getRevenueGrowthStats.mockResolvedValue([]);
      coursesService.getAverageCompletionRate.mockResolvedValue(0);
      coursesService.getTotalRevenue.mockResolvedValue(0);
      coursesService.getCourseCategoryDistribution.mockResolvedValue([]);

      const result = await service.getSystemStats();

      expect(result).toEqual({
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        userGrowth: [],
        courseGrowth: [],
        enrollmentGrowth: [],
        revenueGrowth: [],
        avgCompletionRate: 0,
        totalRevenue: 0,
        activeInstructors: 0,
        categoryDistribution: [],
      });
    });
  });
});
