import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ExternalAuth } from './auth/entities/external-auth.entity';
import { CoursesModule } from './courses/courses.module';
import { CourseSection } from './courses/entities/course-section.entity';
import { Course } from './courses/entities/course.entity';
import { Enrollment } from './courses/entities/enrollment.entity';
import { LessonResource } from './courses/entities/lesson-resource.entity';
import { Lesson } from './courses/entities/lesson.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExercisesModule } from './exercises/exercises.module';
import { HealthController } from './health.controller';
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        // Use DATABASE_URL if provided (production/Aiven), otherwise use individual vars (local dev)
        if (databaseUrl) {
          // Aiven SSL configuration with CA certificate
          // Replace literal \n with actual newlines (env files store as escaped string)
          const caCert = configService.get<string>('DATABASE_CA_CERT');

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
            ],
            synchronize: !isProduction,
            ssl: caCert
              ? { rejectUnauthorized: true, ca: caCert }
              : { rejectUnauthorized: false },
            // Reduce retry attempts for serverless - fail fast instead of queuing
            retryAttempts: isProduction ? 1 : 10,
            retryDelay: 500,
            // Connection pool settings for serverless (Vercel)
            // NOTE: Aiven free tier has NO PgBouncer. Consider Neon/Supabase for free pooling.
            extra: {
              // Single connection per serverless function instance
              max: isProduction ? 1 : 10,
              min: 0,
              // Fail fast if no connection available
              connectionTimeoutMillis: isProduction ? 5000 : 10000,
              // Release idle connections quickly in serverless
              idleTimeoutMillis: isProduction ? 1000 : 30000,
              allowExitOnIdle: true,
              // Disable keepalive for serverless - connections are short-lived
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
          ],
          synchronize: !isProduction,
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
  ],
})
export class AppModule {}
