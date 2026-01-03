import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ExternalAuth } from './auth/entities/external-auth.entity';
import { CodeExecutionModule } from './code-execution/code-execution.module';
import { CoursesModule } from './courses/courses.module';
import { CourseSection } from './courses/entities/course-section.entity';
import { Course } from './courses/entities/course.entity';
import { Enrollment } from './courses/entities/enrollment.entity';
import { LessonResource } from './courses/entities/lesson-resource.entity';
import { Lesson } from './courses/entities/lesson.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExercisesModule } from './exercises/exercises.module';
import { HealthController } from './health.controller';
import { Notification } from './notifications/entities/notification.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { Payment } from './payments/entities/payment.entity';
import { PaymentsModule } from './payments/payments.module';
import { Question } from './quizzes/entities/question.entity';
import { QuizSubmission } from './quizzes/entities/quiz-submission.entity';
import { Quiz } from './quizzes/entities/quiz.entity';
import { QuizzesModule } from './quizzes/quizzes.module';
import { UploadModule } from './upload/upload.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10000,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        // Use DATABASE_URL if provided (Supabase/production), otherwise use individual vars (local dev)
        if (databaseUrl) {
          // Supabase uses standard SSL - no CA cert needed
          // The pooler (port 6543) handles connection management

          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [
              User,
              ExternalAuth,
              Quiz,
              Question,
              Enrollment,
              Course,
              CourseSection,
              Lesson,
              LessonResource,
              QuizSubmission,
              Payment,
              Notification,
            ],
            // Never synchronize in production - use migrations
            synchronize: !isProduction,
            timezone: 'Z',
            // Supabase uses standard SSL
            ssl: { rejectUnauthorized: false },
            // Reduce retry attempts for serverless - fail fast instead of queuing
            retryAttempts: isProduction ? 1 : 10,
            retryDelay: 500,
            // Connection pool settings for serverless (Vercel) with Supavisor pooler
            // Supavisor handles pooling, so we keep minimal local pooling
            extra: {
              // Single connection per serverless instance (Supavisor handles pooling)
              max: isProduction ? 1 : 10,
              min: 0,
              // Quick timeout for serverless cold starts
              connectionTimeoutMillis: isProduction ? 5000 : 10000,
              // Release connections quickly (Supavisor manages the real pool)
              idleTimeoutMillis: isProduction ? 1000 : 30000,
              allowExitOnIdle: true,
              // Disable keepalive for serverless
              keepAlive: !isProduction,
            },
          };
        }

        // Fallback to individual environment variables (local development)
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [
            User,
            ExternalAuth,
            Quiz,
            Question,
            Enrollment,
            Course,
            CourseSection,
            Lesson,
            LessonResource,
            QuizSubmission,
            Payment,
            Notification,
          ],
          synchronize: !isProduction,
          timezone: 'Z',
          ssl:
            configService.get<string>('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
          // Connection pool settings
          extra: {
            max: 10,
            min: 0,
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    AdminModule,
    QuizzesModule,
    DashboardModule,
    CoursesModule,
    ExercisesModule,
    UploadModule,
    PaymentsModule,
    NotificationsModule,
    CodeExecutionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
