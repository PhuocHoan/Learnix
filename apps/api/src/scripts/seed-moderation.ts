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

  const instructor = await usersService.findByEmail(instructorEmail);
  if (!instructor) {
    console.warn('Creating instructor...');
    await usersService.create({
      email: instructorEmail,
      password: instructorPass,
      fullName: 'Test Instructor JS',
    });
  } else {
    console.warn('Instructor exists.');
  }

  console.warn('Updating instructor status and password...');
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(instructorPass, 10);

  // Force update verify status, role, and password
  await usersRepository
    .createQueryBuilder()
    .update(User)
    .set({
      isEmailVerified: true,
      isActive: true,
      role: UserRole.INSTRUCTOR,
      password: hashedPassword,
    })
    .where('email = :email', { email: instructorEmail })
    .execute();

  console.warn('Instructor updated: Verified, Active, and Password reset.');

  // Seed Student
  const studentEmail = 'student_test@example.com';
  const studentPass = 'Password123!';
  const student = await usersService.findByEmail(studentEmail);
  if (!student) {
    console.warn('Creating student...');
    await usersService.create({
      email: studentEmail,
      password: studentPass,
      fullName: 'Test Student',
    });
  }

  await usersRepository
    .createQueryBuilder()
    .update(User)
    .set({
      isEmailVerified: true,
      isActive: true,
      role: UserRole.STUDENT,
      password: hashedPassword,
    })
    .where('email = :email', { email: studentEmail })
    .execute();

  console.warn('Student updated: Verified, Active, and Password reset.');
  await app.close();
}

void bootstrap();
