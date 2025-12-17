import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';

import { type Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const usersRepository = app.get<Repository<User>>(getRepositoryToken(User));

  const instructorEmail = 'instructor_mod_js@example.com';
  const instructorPass = 'Password123!';

  /* eslint-disable no-console */
  let instructor = await usersService.findByEmail(instructorEmail);
  if (!instructor) {
    console.log('Creating instructor...');
    instructor = await usersService.create({
      email: instructorEmail,
      password: instructorPass,
      fullName: 'Test Instructor JS',
    });
  } else {
    console.log('Instructor exists.');
  }

  console.log('Updating instructor status...');
  // Force update verify status and role
  // Using query builder to bypass any service logic constraints
  await usersRepository
    .createQueryBuilder()
    .update(User)
    .set({
      isEmailVerified: true,
      isActive: true,
      role: UserRole.INSTRUCTOR,
    })
    .where('email = :email', { email: instructorEmail })
    .execute();

  console.log('Instructor updated: Verified and Active.');
  await app.close();
  /* eslint-enable no-console */
}

void bootstrap();
