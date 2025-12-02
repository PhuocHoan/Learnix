import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: INestApplication | null = null;

async function bootstrap(): Promise<INestApplication> {
  if (!app) {
    try {
      app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
      });

      app.use(cookieParser());

      // Configure CORS for both direct requests and Vercel proxy rewrites
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const allowedOrigins = [
        frontendUrl,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
      ];

      app.enableCors({
        origin: (origin, callback) => {
          // Allow requests with no origin (Vercel rewrites, mobile apps, curl)
          if (!origin) {
            callback(null, true);
            return;
          }
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            // In production, log unallowed origins for debugging
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
      });

      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
        }),
      );

      await app.init();
    } catch (error) {
      console.error('Failed to initialize NestJS application:', error);
      app = null;
      throw error;
    }
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const application = await bootstrap();
    const instance = application.getHttpAdapter().getInstance();
    return instance(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
