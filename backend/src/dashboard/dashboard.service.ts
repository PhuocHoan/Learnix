import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class DashboardService {
  getUserStats(user: User) {
    // Mock data - will be replaced with real data in Week 2+
    const baseStats = {
      coursesEnrolled: 0,
      hoursLearned: 0,
      averageScore: 0,
    };

    if (user.role === UserRole.INSTRUCTOR) {
      return {
        ...baseStats,
        coursesCreated: 0,
        totalStudents: 0,
        averageRating: 0,
      };
    }

    if (user.role === UserRole.ADMIN) {
      return {
        totalUsers: 0,
        totalCourses: 0,
        activeStudents: 0,
        totalEnrollments: 0,
      };
    }

    return baseStats;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUserProgress(_user: User) {
    // Mock data - will be replaced with real data in Week 2+
    return {
      currentCourses: [
        {
          id: 1,
          title: 'Introduction to React',
          progress: 65,
          totalLessons: 10,
          completedLessons: 6,
        },
        {
          id: 2,
          title: 'Advanced TypeScript',
          progress: 40,
          totalLessons: 8,
          completedLessons: 3,
        },
      ],
    };
  }

  getUserActivity(user: User) {
    // Mock data - will be replaced with real data in Week 2+
    const studentActivity = [
      {
        id: 1,
        type: 'lesson_completed',
        title: 'Completed "React Hooks"',
        course: 'Introduction to React',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        type: 'quiz_completed',
        title: 'Quiz Score: 85%',
        course: 'Introduction to React',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        type: 'enrollment',
        title: 'Enrolled in "Advanced TypeScript"',
        course: 'Advanced TypeScript',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const instructorActivity = [
      {
        id: 1,
        type: 'course_created',
        title: 'Created "Web Development Masterclass"',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        type: 'student_enrolled',
        title: '5 new students enrolled',
        course: 'Introduction to React',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const adminActivity = [
      {
        id: 1,
        type: 'user_registered',
        title: '3 new users registered',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        type: 'course_approved',
        title: 'Approved "Machine Learning Basics"',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
    ];

    if (user.role === UserRole.INSTRUCTOR) {
      return { activities: instructorActivity };
    }

    if (user.role === UserRole.ADMIN) {
      return { activities: adminActivity };
    }

    return { activities: studentActivity };
  }
}
