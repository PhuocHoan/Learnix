import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockUserRepository: Record<string, jest.Mock>;
  let mockCourseRepository: Record<string, jest.Mock>;
  let mockEnrollmentRepository: Record<string, jest.Mock>;

  const mockStudent: User = {
    id: 'student-1',
    email: 'student@example.com',
    fullName: 'Test Student',
    role: UserRole.STUDENT,
    createdAt: new Date(),
  } as User;

  const mockInstructor: User = {
    id: 'instructor-1',
    email: 'instructor@example.com',
    fullName: 'Test Instructor',
    role: UserRole.INSTRUCTOR,
    createdAt: new Date(),
  } as User;

  const mockAdmin: User = {
    id: 'admin-1',
    email: 'admin@example.com',
    fullName: 'Test Admin',
    role: UserRole.ADMIN,
    createdAt: new Date(),
  } as User;

  beforeEach(async () => {
    mockUserRepository = {
      count: jest.fn(),
      find: jest.fn(),
    };

    mockCourseRepository = {
      count: jest.fn(),
      find: jest.fn(),
    };

    mockEnrollmentRepository = {
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
        getRawOne: jest.fn().mockResolvedValue({ total: '10' }),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mockEnrollmentRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserStats', () => {
    describe('Admin Stats', () => {
      it('should return admin-specific stats', async () => {
        mockUserRepository.count.mockResolvedValue(100);
        mockCourseRepository.count.mockResolvedValue(25);
        mockEnrollmentRepository.count.mockResolvedValue(500);

        const result = await service.getUserStats(mockAdmin);

        expect(result).toEqual({
          totalUsers: 100,
          totalCourses: 25,
          totalEnrollments: 500,
          activeStudents: 5,
        });
      });
    });

    describe('Instructor Stats', () => {
      it('should return instructor-specific stats', async () => {
        mockCourseRepository.count.mockResolvedValue(5);

        const result = await service.getUserStats(mockInstructor);

        expect(result).toEqual({
          coursesCreated: 5,
          totalStudents: 10,
          averageRating: 0,
        });
        expect(mockCourseRepository.count).toHaveBeenCalledWith({
          where: { instructor: { id: 'instructor-1' } },
        });
      });
    });

    describe('Student Stats', () => {
      it('should return student-specific stats', async () => {
        const mockEnrollments = [
          {
            id: 'enrollment-1',
            completedLessonIds: ['lesson-1', 'lesson-2'],
            course: {
              id: 'course-1',
              sections: [
                {
                  id: 'section-1',
                  lessons: [
                    { id: 'lesson-1', durationSeconds: 600 },
                    { id: 'lesson-2', durationSeconds: 900 },
                    { id: 'lesson-3', durationSeconds: 1200 },
                  ],
                },
              ],
            },
          },
        ];
        mockEnrollmentRepository.find.mockResolvedValue(mockEnrollments);

        const result = await service.getUserStats(mockStudent);

        expect(result).toEqual({
          coursesEnrolled: 1,
          hoursLearned: 0, // 1500 seconds = ~0.4 hours rounds to 0
          averageScore: 0,
        });
      });

      it('should handle empty enrollments', async () => {
        mockEnrollmentRepository.find.mockResolvedValue([]);

        const result = await service.getUserStats(mockStudent);

        expect(result).toEqual({
          coursesEnrolled: 0,
          hoursLearned: 0,
          averageScore: 0,
        });
      });
    });
  });

  describe('getUserProgress', () => {
    it('should return course progress for student', async () => {
      const mockEnrollments = [
        {
          completedLessonIds: ['lesson-1', 'lesson-2'],
          course: {
            id: 'course-1',
            title: 'React Course',
            sections: [
              {
                lessons: [
                  { id: 'lesson-1' },
                  { id: 'lesson-2' },
                  { id: 'lesson-3' },
                  { id: 'lesson-4' },
                ],
              },
            ],
          },
        },
      ];
      mockEnrollmentRepository.find.mockResolvedValue(mockEnrollments);

      const result = await service.getUserProgress(mockStudent);

      expect(result.currentCourses).toHaveLength(1);
      expect(result.currentCourses[0]).toEqual({
        id: 'course-1',
        title: 'React Course',
        progress: 50, // 2/4 = 50%
        totalLessons: 4,
        completedLessons: 2,
      });
    });

    it('should handle courses with no lessons', async () => {
      const mockEnrollments = [
        {
          completedLessonIds: [],
          course: {
            id: 'course-1',
            title: 'Empty Course',
            sections: [],
          },
        },
      ];
      mockEnrollmentRepository.find.mockResolvedValue(mockEnrollments);

      const result = await service.getUserProgress(mockStudent);

      expect(result.currentCourses[0].progress).toBe(0);
    });
  });

  describe('getUserActivity', () => {
    it('should return enrollment activities for student', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          enrolledAt: new Date('2024-01-15'),
          course: { title: 'React Course' },
        },
      ];
      mockEnrollmentRepository.find.mockResolvedValue(mockEnrollments);

      const result = await service.getUserActivity(mockStudent);

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0]).toEqual({
        id: 'enrollment-1',
        type: 'enrollment',
        title: 'Enrolled in "React Course"',
        course: 'React Course',
        timestamp: expect.any(String),
      });
    });

    it('should return course creation activities for instructor', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'New Course',
          createdAt: new Date('2024-01-10'),
        },
      ];
      mockEnrollmentRepository.find.mockResolvedValue([]);
      mockCourseRepository.find.mockResolvedValue(mockCourses);

      const result = await service.getUserActivity(mockInstructor);

      expect(result.activities.some((a) => a.type === 'course_created')).toBe(
        true,
      );
    });

    it('should return user registration activities for admin', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'new@example.com',
          createdAt: new Date('2024-01-20'),
        },
      ];
      mockEnrollmentRepository.find.mockResolvedValue([]);
      mockUserRepository.find.mockResolvedValue(mockUsers);

      const result = await service.getUserActivity(mockAdmin);

      expect(result.activities.some((a) => a.type === 'user_registered')).toBe(
        true,
      );
    });

    it('should sort activities by timestamp descending', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          enrolledAt: new Date('2024-01-10'),
          course: { title: 'Course 1' },
        },
        {
          id: 'enrollment-2',
          enrolledAt: new Date('2024-01-15'),
          course: { title: 'Course 2' },
        },
      ];
      mockEnrollmentRepository.find.mockResolvedValue(mockEnrollments);

      const result = await service.getUserActivity(mockStudent);

      expect(result.activities[0].title).toContain('Course 2');
      expect(result.activities[1].title).toContain('Course 1');
    });
  });
});
