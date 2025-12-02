import { existsSync, unlinkSync, statSync } from 'fs';
import { join, extname } from 'path';

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FileUploadResult {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

@Injectable()
export class UploadService {
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  // Allowed image MIME types
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  // Allowed image extensions
  private readonly allowedImageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
  ];

  // Max file sizes (in bytes)
  // Use Map instead of object to avoid object injection
  private readonly maxFileSizes = new Map([
    ['avatar', 5 * 1024 * 1024], // 5MB for avatars
    ['image', 10 * 1024 * 1024], // 10MB for general images
    ['document', 25 * 1024 * 1024], // 25MB for documents
    ['video', 100 * 1024 * 1024], // 100MB for videos
  ]);

  constructor(private readonly configService: ConfigService) {
    this.uploadPath =
      this.configService.get<string>('UPLOAD_PATH') ?? './uploads';
    this.baseUrl =
      this.configService.get<string>('BACKEND_URL') ?? 'http://localhost:3000';
  }

  /**
   * Validate an image file for upload
   */
  validateImageFile(
    file: Express.Multer.File,
    type: 'avatar' | 'image' = 'image',
  ): void {
    // Check MIME type
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedImageTypes.join(', ')}`,
      );
    }

    // Check extension
    const ext = extname(file.originalname).toLowerCase();
    if (!this.allowedImageExtensions.includes(ext)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed extensions: ${this.allowedImageExtensions.join(', ')}`,
      );
    }

    // Check file size
    const maxSize = this.maxFileSizes.get(type) ?? 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds limit. Maximum size: ${maxSize / (1024 * 1024)}MB`,
      );
    }
  }

  /**
   * Process an uploaded file and return the result
   */
  processUploadedFile(file: Express.Multer.File): FileUploadResult {
    // Determine the category from the path
    const pathParts = file.path.split('/');
    const category = pathParts.at(-2) ?? 'misc';

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `${this.baseUrl}/uploads/${category}/${file.filename}`,
    };
  }

  /**
   * Process multiple uploaded files
   */
  processUploadedFiles(files: Express.Multer.File[]): FileUploadResult[] {
    return files.map((file) => this.processUploadedFile(file));
  }

  /**
   * Delete a file by its filename or URL
   * Path is constructed from validated config + controlled subdirectories
   */
  deleteFile(filenameOrUrl: string): boolean {
    let filePath: string | undefined;

    if (filenameOrUrl.startsWith('http')) {
      // Extract path from URL
      const urlPath = new URL(filenameOrUrl).pathname;
      filePath = join(this.uploadPath, urlPath.replace('/uploads/', ''));
    } else {
      // It's just a filename, we need to search for it
      const possiblePaths = ['images', 'videos', 'audio', 'documents', 'misc'];
      for (const subDir of possiblePaths) {
        const testPath = join(this.uploadPath, subDir, filenameOrUrl);
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path from validated config + controlled subdir
        if (existsSync(testPath)) {
          filePath = testPath;
          break;
        }
      }

      if (!filePath) {
        throw new NotFoundException('File not found');
      }
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path from validated config + controlled subdir
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path from validated config + controlled subdir
      unlinkSync(filePath);
      return true;
    } catch {
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Get file info by filename
   * Path is constructed from validated config + controlled subdirectories
   */
  getFileInfo(filename: string): {
    exists: boolean;
    size?: number;
    path?: string;
  } {
    const possiblePaths = ['images', 'videos', 'audio', 'documents', 'misc'];

    for (const subDir of possiblePaths) {
      const testPath = join(this.uploadPath, subDir, filename);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path from validated config + controlled subdir
      if (existsSync(testPath)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path from validated config + controlled subdir
        const stats = statSync(testPath);
        return {
          exists: true,
          size: stats.size,
          path: testPath,
        };
      }
    }

    return { exists: false };
  }

  /**
   * Get the full URL for a file
   */
  getFileUrl(filename: string, category: string = 'images'): string {
    return `${this.baseUrl}/uploads/${category}/${filename}`;
  }
}
