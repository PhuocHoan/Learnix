import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { diskStorage, memoryStorage } from 'multer';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Check if Cloudinary is configured
        const cloudinaryConfigured = !!(
          configService.get<string>('CLOUDINARY_CLOUD_NAME') &&
          configService.get<string>('CLOUDINARY_API_KEY') &&
          configService.get<string>('CLOUDINARY_API_SECRET')
        );

        // Use memory storage if Cloudinary is configured (for cloud upload)
        // or if running in serverless environment
        const isServerless = configService.get<string>('VERCEL') === '1';

        if (cloudinaryConfigured || isServerless) {
          return {
            storage: memoryStorage(),
            limits: {
              fileSize: 10 * 1024 * 1024, // 10MB default limit
            },
          };
        }

        // For local development without Cloudinary, use disk storage
        const uploadPath =
          configService.get<string>('UPLOAD_PATH') ?? './uploads';

        // Ensure upload directory exists (only for local development)
        // Path is from validated config, not user input
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (!existsSync(uploadPath)) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          mkdirSync(uploadPath, { recursive: true });
        }

        return {
          storage: diskStorage({
            destination: (req, file, cb) => {
              // Determine subdirectory based on file type
              let subDir = 'misc';
              if (file.mimetype.startsWith('image/')) {
                subDir = 'images';
              } else if (file.mimetype.startsWith('video/')) {
                subDir = 'videos';
              } else if (file.mimetype.startsWith('audio/')) {
                subDir = 'audio';
              } else if (
                file.mimetype === 'application/pdf' ||
                file.mimetype.includes('document')
              ) {
                subDir = 'documents';
              }

              const fullPath = join(uploadPath, subDir);
              // Path is from validated config + controlled subdir, not user input
              // eslint-disable-next-line security/detect-non-literal-fs-filename
              if (!existsSync(fullPath)) {
                // eslint-disable-next-line security/detect-non-literal-fs-filename
                mkdirSync(fullPath, { recursive: true });
              }

              cb(null, fullPath);
            },
            filename: (req, file, cb) => {
              // Generate unique filename with original extension
              const uniqueId = randomUUID();
              const ext = extname(file.originalname).toLowerCase();
              cb(null, `${uniqueId}${ext}`);
            },
          }),
          limits: {
            fileSize: 10 * 1024 * 1024, // 10MB default limit
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryService],
  exports: [UploadService, CloudinaryService],
})
export class UploadModule {}
