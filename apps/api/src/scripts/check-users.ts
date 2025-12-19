import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const emails = ['admin@example.com', 'instructor_mod_js@example.com'];

  for (const email of emails) {
    const user = await usersService.findByEmail(email);
    if (user) {
      console.log(`User ${email}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Verified: ${user.isEmailVerified}`);
      console.log(`  Password Hash: ${user.password ? 'Present' : 'Missing'}`);
    } else {
      console.log(`User ${email} NOT FOUND`);
    }
  }

  await app.close();
}

void bootstrap();
