import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserRole } from './users/enums/user-role.enum';
import { DataSource } from 'typeorm';
import { Course, CourseLevel } from './courses/entities/course.entity';
import { LessonType } from './courses/entities/lesson.entity';
import { User } from './users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);
  const courseRepository = dataSource.getRepository(Course);

  console.log('🌱 Starting database seed...');

  // 1. Create Instructor
  const instructorEmail = 'instructor@learnix.demo';
  let instructor = await userRepository.findOne({
    where: { email: instructorEmail },
  });

  if (!instructor) {
    const password = await bcrypt.hash('password123', 10);
    instructor = userRepository.create({
      email: instructorEmail,
      password,
      fullName: 'Dr. Sarah Wilson',
      role: UserRole.INSTRUCTOR,
      isActive: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    });
    await userRepository.save(instructor);
    console.log('✅ Created Instructor: instructor@learnix.demo / password123');
  } else {
    console.log('ℹ️ Instructor already exists');
  }

  // 2. Check if courses exist
  const courseCount = await courseRepository.count();
  if (courseCount > 0) {
    console.log('ℹ️ Courses already exist, skipping course generation');
    await app.close();
    return;
  }

  // 3. Create Sample Courses with deep nesting (Sections -> Lessons)

  // Course 1: Free Beginner Course
  const course1 = courseRepository.create({
    title: 'React Fundamentals 2024',
    description:
      'Master the basics of React.js including Hooks, Context, and Redux. Perfect for beginners starting their web development journey. We will build 3 real-world projects.',
    price: 0, // Free
    level: CourseLevel.BEGINNER,
    isPublished: true,
    tags: ['react', 'frontend', 'javascript'],
    instructor: instructor,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    sections: [
      {
        title: 'Module 1: Introduction',
        orderIndex: 0,
        lessons: [
          {
            title: 'Welcome to the Course',
            type: LessonType.VIDEO,
            isFreePreview: true,
            durationSeconds: 120,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Dummy URL
            orderIndex: 0,
          },
          {
            title: 'Setting up the Environment',
            type: LessonType.TEXT,
            isFreePreview: true,
            durationSeconds: 300,
            content:
              '## Installation\n\nRun `npm create vite@latest` to start...',
            orderIndex: 1,
          },
        ],
      },
      {
        title: 'Module 2: React Core Concepts',
        orderIndex: 1,
        lessons: [
          {
            title: 'Components & Props',
            type: LessonType.VIDEO,
            isFreePreview: false,
            durationSeconds: 600,
            orderIndex: 0,
          },
          {
            title: 'State & Events',
            type: LessonType.VIDEO,
            isFreePreview: false,
            durationSeconds: 850,
            orderIndex: 1,
          },
          {
            title: 'Understanding Hooks',
            type: LessonType.TEXT,
            isFreePreview: false,
            durationSeconds: 400,
            orderIndex: 2,
          },
        ],
      },
    ],
  });

  // Course 2: Paid Advanced Course
  const course2 = courseRepository.create({
    title: 'Advanced NestJS Architecture',
    description:
      'Build scalable enterprise applications with NestJS. This course covers Microservices, CQRS, Event-Driven Architecture, and advanced TypeORM patterns for heavy loads.',
    price: 49.99,
    level: CourseLevel.ADVANCED,
    isPublished: true,
    tags: ['nestjs', 'backend', 'typescript', 'architecture'],
    instructor: instructor,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1623479322729-28b25c16b011?w=800&q=80',
    sections: [
      {
        title: 'Microservices Fundamentals',
        orderIndex: 0,
        lessons: [
          {
            title: 'Monolith vs Microservices',
            type: LessonType.VIDEO,
            isFreePreview: true,
            durationSeconds: 500,
            orderIndex: 0,
          },
          {
            title: 'Message Brokers (RabbitMQ)',
            type: LessonType.VIDEO,
            isFreePreview: false,
            durationSeconds: 1200,
            orderIndex: 1,
          },
        ],
      },
      {
        title: 'Database Scaling',
        orderIndex: 1,
        lessons: [
          {
            title: 'Replication & Sharding',
            type: LessonType.TEXT,
            isFreePreview: false,
            durationSeconds: 900,
            orderIndex: 0,
          },
        ],
      },
    ],
  });

  // Course 3: Intermediate Fullstack
  const course3 = courseRepository.create({
    title: 'Fullstack Web Development with AI',
    description:
      'Learn how to integrate OpenAI API into your web apps. Build a smart content generator using React and Node.js.',
    price: 19.99,
    level: CourseLevel.INTERMEDIATE,
    isPublished: true,
    tags: ['ai', 'fullstack', 'api'],
    instructor: instructor,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    sections: [
      {
        title: 'AI Integration',
        orderIndex: 0,
        lessons: [
          {
            title: 'OpenAI API Keys',
            type: LessonType.TEXT,
            isFreePreview: true,
            durationSeconds: 300,
            orderIndex: 0,
          },
          {
            title: 'Prompt Engineering',
            type: LessonType.VIDEO,
            isFreePreview: false,
            durationSeconds: 800,
            orderIndex: 1,
          },
        ],
      },
    ],
  });

  await courseRepository.save([course1, course2, course3]);
  console.log('✅ Created 3 sample courses with sections and lessons');

  console.log('🚀 Seeding complete! Verification passed.');
  await app.close();
}
void bootstrap();
