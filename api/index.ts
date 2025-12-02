import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import from backend workspace
import { AppModule } from '../apps/api/src/app.module';

let app: INestApplication | null = null;

async function bootstrap(): Promise<INestApplication> {
  if (!app) {
    try {
      app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
      });

      app.use(cookieParser());

      // In monorepo deployment, frontend and API are on same domain
      // CORS is still needed for local development
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const allowedOrigins = [
        frontendUrl,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
      ];

      app.enableCors({
        origin: (origin, callback) => {
          // Allow requests with no origin (same-origin requests, mobile apps, curl)
          if (!origin) {
            callback(null, true);
            return;
          }
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
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

    // Strip /api prefix from the URL so NestJS routes work correctly
    // e.g., /api/auth/login -> /auth/login
    if (req.url?.startsWith('/api')) {
      req.url = req.url.replace('/api', '') || '/';
    }

    return instance(req, res);
  } catch (error) {
    console.error('Handler error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const isDbConnectionError =
      errorMessage.includes('connection') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('remaining connection slots');

    if (isDbConnectionError) {
      app = null;
      res.status(503).json({
        statusCode: 503,
        message: 'Database temporarily unavailable. Please retry.',
        error: 'Service Unavailable',
      });
    } else {
      res.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
        error: errorMessage,
      });
    }
  }
}
