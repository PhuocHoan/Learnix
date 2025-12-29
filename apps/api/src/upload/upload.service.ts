import { existsSync, unlinkSync, statSync } from 'fs';
import { extname, resolve, normalize } from 'path';

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

// Allowed subdirectories for file operations (whitelist approach)
const ALLOWED_SUBDIRS = [
  'images',
  'videos',
  'audio',
  'documents',
  'misc',
] as const;
type AllowedSubdir = (typeof ALLOWED_SUBDIRS)[number];

@Injectable()
export class UploadService {
  private readonly uploadPath: string;
  private readonly resolvedUploadPath: string;
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

  // Allowed video MIME types
  private readonly allowedVideoTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ];

  // Allowed video extensions
  private readonly allowedVideoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];

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
    this.resolvedUploadPath = resolve(this.uploadPath);
    this.baseUrl =
      this.configService.get<string>('BACKEND_URL') ?? 'http://localhost:3000';
  }

  /**
   * Safely resolve a file path within the upload directory.
   * Prevents directory traversal attacks by ensuring the resolved path
   * is within the allowed upload directory.
   */
  private safeResolvePath(subdir: AllowedSubdir, filename: string): string {
    // Sanitize filename: remove any path separators and normalize
    const sanitizedFilename = normalize(filename).replace(
      /^(\.\.(\/|\\|$))+/,
      '',
    );
    const fullPath = resolve(
      this.resolvedUploadPath,
      subdir,
      sanitizedFilename,
    );

    // Ensure the resolved path is within the upload directory
    if (!fullPath.startsWith(this.resolvedUploadPath)) {
      throw new BadRequestException('Invalid file path');
    }

    return fullPath;
  }

  /**
   * Check if a path exists safely within upload directory
   */
  private safeExistsSync(path: string): boolean {
    // Verify path is within upload directory before checking
    if (!path.startsWith(this.resolvedUploadPath)) {
      return false;
    }
    return existsSync(path);
  }

  /**
   * Safely delete a file within upload directory
   */
  private safeUnlinkSync(path: string): void {
    // Verify path is within upload directory before deleting
    if (!path.startsWith(this.resolvedUploadPath)) {
      throw new BadRequestException('Invalid file path');
    }
    unlinkSync(path);
  }

  /**
   * Safely get file stats within upload directory
   * Returns stats with size as number (converted from bigint if needed)
   */
  private safeStatSync(path: string): { size: number } | undefined {
    // Verify path is within upload directory before reading stats
    if (!path.startsWith(this.resolvedUploadPath)) {
      return undefined;
    }
    const stats = statSync(path);
    return {
      size: typeof stats.size === 'bigint' ? Number(stats.size) : stats.size,
    };
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
   * Validate a video file for upload
   */
  validateVideoFile(file: Express.Multer.File): void {
    // Check MIME type
    if (!this.allowedVideoTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedVideoTypes.join(', ')}`,
      );
    }

    // Check extension
    const ext = extname(file.originalname).toLowerCase();
    if (!this.allowedVideoExtensions.includes(ext)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed extensions: ${this.allowedVideoExtensions.join(', ')}`,
      );
    }

    // Check file size
    const maxSize = this.maxFileSizes.get('video') ?? 100 * 1024 * 1024;
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
      // Extract path from URL and resolve safely
      const urlPath = new URL(filenameOrUrl).pathname;
      const pathWithoutUploads = urlPath.replace('/uploads/', '');
      const parts = pathWithoutUploads.split('/');
      const subDir = parts[0] as AllowedSubdir;
      const filename = parts.slice(1).join('/');

      if (ALLOWED_SUBDIRS.includes(subDir)) {
        filePath = this.safeResolvePath(subDir, filename);
      }
    } else {
      // It's just a filename, search in allowed subdirectories
      for (const subDir of ALLOWED_SUBDIRS) {
        const testPath = this.safeResolvePath(subDir, filenameOrUrl);
        if (this.safeExistsSync(testPath)) {
          filePath = testPath;
          break;
        }
      }
    }

    if (!filePath) {
      throw new NotFoundException('File not found');
    }

    if (!this.safeExistsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      this.safeUnlinkSync(filePath);
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
    for (const subDir of ALLOWED_SUBDIRS) {
      const testPath = this.safeResolvePath(subDir, filename);
      if (this.safeExistsSync(testPath)) {
        const stats = this.safeStatSync(testPath);
        if (stats) {
          return {
            exists: true,
            size: stats.size,
            path: testPath,
          };
        }
      }
    }

    return { exists: false };
  }

  /**
   * Get the full URL for a file
   */
  getFileUrl(filename: string, category = 'images'): string {
    return `${this.baseUrl}/uploads/${category}/${filename}`;
  }
}
