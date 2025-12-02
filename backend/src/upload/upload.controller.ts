import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import type { FileUploadResult } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload a single avatar image (max 5MB)
   */
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only JPEG, PNG, GIF, and WebP images are allowed for avatars',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadAvatar(@UploadedFile() file: Express.Multer.File): FileUploadResult {
    // Runtime safety: file can be undefined if no file is uploaded
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.uploadService.validateImageFile(file, 'avatar');
    return this.uploadService.processUploadedFile(file);
  }

  /**
   * Upload a single image (max 10MB)
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only JPEG, PNG, GIF, WebP, and SVG images are allowed',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File): FileUploadResult {
    // Runtime safety: file can be undefined if no file is uploaded
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.uploadService.validateImageFile(file, 'image');
    return this.uploadService.processUploadedFile(file);
  }

  /**
   * Upload multiple images (max 10 files, 10MB each)
   */
  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only JPEG, PNG, GIF, WebP, and SVG images are allowed',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): FileUploadResult[] {
    // Runtime safety: files can be undefined/empty if no files uploaded
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate each file
    files.forEach((file) => {
      this.uploadService.validateImageFile(file, 'image');
    });

    return this.uploadService.processUploadedFiles(files);
  }

  /**
   * Upload any file (max 25MB, for documents, etc.)
   */
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File): FileUploadResult {
    // Runtime safety: file can be undefined if no file is uploaded
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.uploadService.processUploadedFile(file);
  }

  /**
   * Delete a file by filename
   */
  @Delete(':filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFile(@Param('filename') filename: string): void {
    this.uploadService.deleteFile(filename);
  }
}
