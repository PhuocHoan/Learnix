import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (!app) {
    app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    app.use(cookieParser());

    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await bootstrap();
  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
}
