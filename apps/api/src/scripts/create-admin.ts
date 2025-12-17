import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = 'admin@example.com';
  const password = 'Password123!';
  const fullName = 'Admin User';

  /* eslint-disable no-console */
  console.log(`Checking for user with email: ${email}`);

  let user = await usersService.findByEmail(email);

  if (!user) {
    console.log('User not found. Creating new admin user...');

    try {
      const result = await usersService.createWithActivationToken({
        email,
        fullName,
        password,
      });

      // eslint-disable-next-line prefer-destructuring
      user = result.user;
      console.log(`User created with ID: ${user.id}`);
    } catch (error) {
      console.error('Error creating user:', error);
      process.exit(1);
    }
  } else {
    console.log(`User found with ID: ${user.id}. Updating to admin...`);
  }

  await usersService.updateRole(user.id, UserRole.ADMIN);
  console.log('Role updated to ADMIN');

  await usersService.activateUser(user.id);
  console.log('User activated');

  console.log('Admin user setup complete.');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);

  await app.close();
  /* eslint-enable no-console */
}

void bootstrap();
