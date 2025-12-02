import { Readable } from 'stream';

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resourceType: string;
}

@Injectable()
export class CloudinaryService {
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    this.isConfigured = !!(cloudName && apiKey && apiSecret);

    if (this.isConfigured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  /**
   * Check if Cloudinary is configured
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload a file buffer to Cloudinary
   */
  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      publicId?: string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
      transformation?: Record<string, unknown>;
    } = {},
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      throw new BadRequestException(
        'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder ?? 'learnix',
          public_id: options.publicId,
          resource_type: options.resourceType ?? 'auto',
          transformation: options.transformation,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            reject(
              new BadRequestException(
                `Cloudinary upload failed: ${error.message}`,
              ),
            );
          } else if (result) {
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
              resourceType: result.resource_type,
            });
          } else {
            reject(new BadRequestException('Cloudinary upload failed'));
          }
        },
      );

      // Convert buffer to readable stream and pipe to upload
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Upload a Multer file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    options: {
      folder?: string;
      transformation?: Record<string, unknown>;
    } = {},
  ): Promise<CloudinaryUploadResult> {
    // For memory storage, file.buffer is available
    // For disk storage, we'd need to read the file
    const buffer = file.buffer;

    if (!buffer) {
      throw new BadRequestException(
        'File buffer not available. Ensure memory storage is used.',
      );
    }

    // Determine resource type from mimetype
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    }

    return this.uploadBuffer(buffer, {
      ...options,
      resourceType,
    });
  }

  /**
   * Upload an avatar image with automatic optimization
   */
  async uploadAvatar(file: Express.Multer.File): Promise<CloudinaryUploadResult> {
    return this.uploadFile(file, {
      folder: 'learnix/avatars',
      transformation: {
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
        fetch_format: 'auto',
      },
    });
  }

  /**
   * Upload a course image with optimization
   */
  async uploadCourseImage(
    file: Express.Multer.File,
  ): Promise<CloudinaryUploadResult> {
    return this.uploadFile(file, {
      folder: 'learnix/courses',
      transformation: {
        width: 1200,
        height: 675,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      },
    });
  }

  /**
   * Delete a file from Cloudinary by public ID
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<boolean> {
    if (!this.isConfigured) {
      throw new BadRequestException('Cloudinary is not configured');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result.result === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(url: string): string | null {
    try {
      // Cloudinary URLs look like:
      // https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      // Find the index of 'upload' and get everything after version
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex === -1) return null;

      // Skip 'upload' and version (vXXXXXXX)
      const publicIdParts = pathParts.slice(uploadIndex + 2);
      const publicIdWithExt = publicIdParts.join('/');

      // Remove file extension
      return publicIdWithExt.replace(/\.[^.]+$/, '');
    } catch {
      return null;
    }
  }
}
