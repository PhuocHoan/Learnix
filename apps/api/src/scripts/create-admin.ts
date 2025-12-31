import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { type Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const usersRepository = app.get<Repository<User>>(getRepositoryToken(User));

  const email = 'admin@example.com';
  const password = 'Password123!';
  const fullName = 'Admin User';

  console.warn(`Checking for user with email: ${email}`);

  let user = await usersService.findByEmail(email);

  if (!user) {
    console.warn('User not found. Creating new admin user...');

    try {
      const result = await usersService.createWithActivationToken({
        email,
        fullName,
        password,
      });

      ({ user } = result);
      console.warn(`User created with ID: ${user.id}`);
    } catch (error) {
      console.error('Error creating user:', error);
      process.exit(1);
    }
  } else {
    console.warn(`User found with ID: ${user.id}. Updating to admin...`);
  }

  await usersService.updateRole(user.id, UserRole.ADMIN);
  console.warn('Role updated to ADMIN');

  // Force update password to ensure consistency with tests
  const hashedPassword = await bcrypt.hash(password, 10);
  await usersRepository
    .createQueryBuilder()
    .update(User)
    .set({ password: hashedPassword })
    .where('id = :id', { id: user.id })
    .execute();
  console.warn('Password reset');

  await usersService.activateUser(user.id);
  console.warn('User activated');

  console.warn('Admin user setup complete.');
  console.warn(`Email: ${email}`);
  console.warn(`Password: ${password}`);

  await app.close();
}

void bootstrap();
