import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { type Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';

async function seedUser(
  usersService: UsersService,
  usersRepository: Repository<User>,
  email: string,
  pass: string,
  fullName: string,
  role: UserRole,
) {
  let user = await usersService.findByEmail(email);
  if (!user) {
    console.warn(`Creating ${role}: ${email}...`);
    user = await usersService.create({
      email,
      password: pass,
      fullName,
    });
  } else {
    console.warn(`${role} exists: ${email}.`);
  }

  const hashedPassword = await bcrypt.hash(pass, 10);

  // Force update verify status, role, and password
  await usersRepository
    .createQueryBuilder()
    .update(User)
    .set({
      isEmailVerified: true,
      isActive: true,
      role: role,
      password: hashedPassword,
    })
    .where('id = :id', { id: user.id })
    .execute();

  console.warn(`${role} updated and verified.`);
}

async function bootstrap(): Promise<void> {
  let app;
  try {
    app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const usersRepository = app.get(getRepositoryToken(User));

    const defaultPass = 'Password123!';

    // 1. Instructor
    await seedUser(
      usersService,
      usersRepository,
      'instructor_mod_js@example.com',
      defaultPass,
      'Test Instructor JS',
      UserRole.INSTRUCTOR,
    );

    // 2. Admin
    await seedUser(
      usersService,
      usersRepository,
      'admin@example.com',
      defaultPass,
      'Test Admin',
      UserRole.ADMIN,
    );

    // 3. Student
    await seedUser(
      usersService,
      usersRepository,
      'student_test@example.com',
      defaultPass,
      'Test Student',
      UserRole.STUDENT,
    );

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    if (app) await app.close();
  }
}

void bootstrap();
