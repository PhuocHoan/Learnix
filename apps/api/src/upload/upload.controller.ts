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
import { ConfigService } from '@nestjs/config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { CloudinaryService } from './cloudinary.service';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import type { FileUploadResult } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  private readonly useCloudinary: boolean;

  constructor(
    private readonly uploadService: UploadService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {
    // Use Cloudinary if it's configured (works in both dev and production)
    this.useCloudinary = this.cloudinaryService.isAvailable();
  }

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
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.uploadService.validateImageFile(file, 'avatar');

    // Use Cloudinary for serverless environment
    if (this.useCloudinary) {
      const result = await this.cloudinaryService.uploadAvatar(file);
      return {
        filename: result.publicId,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: result.bytes,
        url: result.secureUrl,
      };
    }

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
  async uploadImage(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.uploadService.validateImageFile(file, 'image');

    // Use Cloudinary for serverless environment
    if (this.useCloudinary) {
      const result = await this.cloudinaryService.uploadGeneralImage(file);
      return {
        filename: result.publicId,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: result.bytes,
        url: result.secureUrl,
      };
    }

    return this.uploadService.processUploadedFile(file);
  }

  /**
   * Upload a video (max 100MB)
   */
  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/quicktime',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only MP4, WebM, OGG, and MOV videos are allowed',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.uploadService.validateVideoFile(file);

    // Use Cloudinary for serverless environment
    if (this.useCloudinary) {
      const result = await this.cloudinaryService.uploadVideo(file);
      return {
        filename: result.publicId,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: result.bytes,
        url: result.secureUrl,
      };
    }

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
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
  ): Promise<FileUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate each file
    files.forEach((file) => {
      this.uploadService.validateImageFile(file, 'image');
    });

    // Use Cloudinary for serverless environment
    if (this.useCloudinary) {
      const results = await Promise.all(
        files.map((file) => this.cloudinaryService.uploadGeneralImage(file)),
      );
      return results.map((result, idx) => {
        const file = files.at(idx);
        if (!file) {
          throw new BadRequestException('File index mismatch');
        }
        return {
          filename: result.publicId,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: result.bytes,
          url: result.secureUrl,
        };
      });
    }

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
  async uploadFile(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Use Cloudinary for serverless environment
    if (this.useCloudinary) {
      const result = await this.cloudinaryService.uploadFile(file, {
        folder: 'learnix/files',
      });
      return {
        filename: result.publicId,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: result.bytes,
        url: result.secureUrl,
      };
    }

    return this.uploadService.processUploadedFile(file);
  }

  /**
   * Delete a file by filename or Cloudinary public ID
   */
  @Delete(':filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Param('filename') filename: string): Promise<void> {
    // Try to delete from Cloudinary first if it looks like a Cloudinary public ID
    if (this.useCloudinary || filename.includes('/')) {
      const deleted = await this.cloudinaryService.deleteFile(filename);
      if (deleted) {
        return;
      }
    }

    // Fall back to local file deletion
    this.uploadService.deleteFile(filename);
  }
}
