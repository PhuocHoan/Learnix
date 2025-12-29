import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join, resolve, normalize } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';

import { CloudinaryService } from './cloudinary.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

// Allowed subdirectories for file uploads (whitelist approach)
const _ALLOWED_SUBDIRS = [
  'images',
  'videos',
  'audio',
  'documents',
  'misc',
] as const;
type AllowedSubdir = (typeof _ALLOWED_SUBDIRS)[number];

/**
 * Safely ensure a directory exists within the upload path.
 * Validates that the path doesn't escape the base directory.
 */
function safeEnsureDir(basePath: string, subDir?: AllowedSubdir): string {
  const resolvedBase = resolve(basePath);
  const targetPath = subDir ? join(resolvedBase, subDir) : resolvedBase;
  const normalizedTarget = normalize(targetPath);

  // Ensure target is within base path
  if (!normalizedTarget.startsWith(resolvedBase)) {
    throw new Error('Invalid directory path');
  }

  if (!existsSync(normalizedTarget)) {
    mkdirSync(normalizedTarget, { recursive: true });
  }

  return normalizedTarget;
}

/**
 * Determine the subdirectory based on file MIME type.
 */
function getSubdirForMimetype(mimetype: string): AllowedSubdir {
  if (mimetype.startsWith('image/')) {
    return 'images';
  }
  if (mimetype.startsWith('video/')) {
    return 'videos';
  }
  if (mimetype.startsWith('audio/')) {
    return 'audio';
  }
  if (mimetype === 'application/pdf' || mimetype.includes('document')) {
    return 'documents';
  }
  return 'misc';
}

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Check if Cloudinary is configured
        const cloudinaryConfigured = Boolean(
          configService.get<string>('CLOUDINARY_CLOUD_NAME') &&
          configService.get<string>('CLOUDINARY_API_KEY') &&
          configService.get<string>('CLOUDINARY_API_SECRET'),
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

        // Ensure upload directory exists using safe helper
        safeEnsureDir(uploadPath);

        return {
          storage: diskStorage({
            destination: (req, file, cb) => {
              // Determine subdirectory based on file type
              const subDir = getSubdirForMimetype(file.mimetype);

              // Ensure subdirectory exists using safe helper
              const fullPath = safeEnsureDir(uploadPath, subDir);

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
