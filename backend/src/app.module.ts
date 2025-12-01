import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { ExternalAuth } from './auth/entities/external-auth.entity';
import { AdminModule } from './admin/admin.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { Quiz } from './quizzes/entities/quiz.entity';
import { Question } from './quizzes/entities/question.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { CoursesModule } from './courses/courses.module';
import { Enrollment } from './courses/entities/enrollment.entity';
import { Course } from './courses/entities/course.entity';
import { CourseSection } from './courses/entities/course-section.entity';
import { Lesson } from './courses/entities/lesson.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

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
            ],
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            ssl: caCert
              ? { rejectUnauthorized: true, ca: caCert }
              : { rejectUnauthorized: false },
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
          ],
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          ssl:
            configService.get<string>('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
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
  ],
})
export class AppModule {}
