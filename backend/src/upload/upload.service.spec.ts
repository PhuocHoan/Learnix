import * as fs from 'fs';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { UploadService } from './upload.service';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'UPLOAD_PATH') {
          return './uploads';
        }
        if (key === 'BACKEND_URL') {
          return 'http://localhost:3000';
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateImageFile', () => {
    it('should validate JPEG image', () => {
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        size: 1024 * 1024, // 1MB
      } as Express.Multer.File;

      expect(() => service.validateImageFile(file, 'image')).not.toThrow();
    });

    it('should validate PNG image', () => {
      const file = {
        mimetype: 'image/png',
        originalname: 'test.png',
        size: 1024 * 1024,
      } as Express.Multer.File;

      expect(() => service.validateImageFile(file, 'image')).not.toThrow();
    });

    it('should validate GIF image', () => {
      const file = {
        mimetype: 'image/gif',
        originalname: 'test.gif',
        size: 1024 * 1024,
      } as Express.Multer.File;

      expect(() => service.validateImageFile(file, 'image')).not.toThrow();
    });

    it('should validate WebP image', () => {
      const file = {
        mimetype: 'image/webp',
        originalname: 'test.webp',
        size: 1024 * 1024,
      } as Express.Multer.File;

      expect(() => service.validateImageFile(file, 'image')).not.toThrow();
    });

    it('should validate SVG image', () => {
      const file = {
        mimetype: 'image/svg+xml',
        originalname: 'test.svg',
        size: 1024 * 1024,
      } as Express.Multer.File;

      expect(() => service.validateImageFile(file, 'image')).not.toThrow();
    });

    it('should throw BadRequestException for invalid MIME type', () => {
      const file = {
        mimetype: 'application/pdf',
        originalname: 'test.pdf',
        size: 1024 * 1024,
      } as Express.Multer.File;

      expect(() => service.validateImageFile(file, 'image')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid extension', () => {
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.exe',
        size: 1024 * 1024,
      } as Express.Multer.File;

      expect(() => service.validateImageFile(file, 'image')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when avatar exceeds 5MB', () => {
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        size: 6 * 1024 * 1024, // 6MB
      } as Express.Multer.File;

      expect(() => service.validateImageFile(file, 'avatar')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when image exceeds 10MB', () => {
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        size: 11 * 1024 * 1024, // 11MB
      } as Express.Multer.File;

      expect(() => service.validateImageFile(file, 'image')).toThrow(
        BadRequestException,
      );
    });

    it('should accept avatar under 5MB', () => {
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        size: 4 * 1024 * 1024, // 4MB
      } as Express.Multer.File;

      expect(() => service.validateImageFile(file, 'avatar')).not.toThrow();
    });
  });

  describe('processUploadedFile', () => {
    it('should return file upload result with correct URL', () => {
      const file = {
        filename: 'abc123.jpg',
        originalname: 'my-photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/uploads/images/abc123.jpg',
      } as Express.Multer.File;

      const result = service.processUploadedFile(file);

      expect(result).toEqual({
        filename: 'abc123.jpg',
        originalName: 'my-photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        url: 'http://localhost:3000/uploads/images/abc123.jpg',
      });
    });

    it('should extract category from file path', () => {
      const file = {
        filename: 'abc123.png',
        originalname: 'avatar.png',
        mimetype: 'image/png',
        size: 2048,
        path: '/uploads/avatars/abc123.png',
      } as Express.Multer.File;

      const result = service.processUploadedFile(file);

      expect(result.url).toBe(
        'http://localhost:3000/uploads/avatars/abc123.png',
      );
    });
  });

  describe('processUploadedFiles', () => {
    it('should process multiple files', () => {
      const files = [
        {
          filename: 'file1.jpg',
          originalname: 'photo1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          path: '/uploads/images/file1.jpg',
        },
        {
          filename: 'file2.png',
          originalname: 'photo2.png',
          mimetype: 'image/png',
          size: 2048,
          path: '/uploads/images/file2.png',
        },
      ] as Express.Multer.File[];

      const results = service.processUploadedFiles(files);

      expect(results).toHaveLength(2);
      expect(results[0].filename).toBe('file1.jpg');
      expect(results[1].filename).toBe('file2.png');
    });
  });

  describe('deleteFile', () => {
    it('should delete file by filename', () => {
      // For filename, the service loops through possible paths until it finds one
      // We mock: first 5 calls for the loop check (1st true), then 1 for the final exists check
      mockedFs.existsSync.mockReturnValueOnce(true); // Found in first subdir (images)
      mockedFs.existsSync.mockReturnValueOnce(true); // Final check before delete
      mockedFs.unlinkSync.mockReturnValue(undefined);

      const result = service.deleteFile('test.jpg');

      expect(result).toBe(true);
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });

    it('should delete file by URL', () => {
      // For URL, it extracts path directly - only needs final existsSync check
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.unlinkSync.mockReturnValue(undefined);

      const result = service.deleteFile(
        'http://localhost:3000/uploads/images/test.jpg',
      );

      expect(result).toBe(true);
    });

    it('should throw NotFoundException when file not found by filename', () => {
      // All 5 subdirs return false, so file not found
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => service.deleteFile('nonexistent.jpg')).toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when file not found by URL', () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() =>
        service.deleteFile(
          'http://localhost:3000/uploads/images/nonexistent.jpg',
        ),
      ).toThrow(NotFoundException);
    });

    it('should throw BadRequestException when delete fails', () => {
      // For URL-based deletion, we only need the final existsSync check
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() =>
        service.deleteFile('http://localhost:3000/uploads/images/test.jpg'),
      ).toThrow(BadRequestException);
    });
  });

  describe('getFileInfo', () => {
    it('should return file info when file exists', () => {
      mockedFs.existsSync.mockReturnValueOnce(true);
      mockedFs.statSync.mockReturnValue({ size: 1024 } as fs.Stats);

      const result = service.getFileInfo('test.jpg');

      expect(result).toEqual({
        exists: true,
        size: 1024,
        path: expect.stringContaining('test.jpg'),
      });
    });

    it('should return exists false when file not found', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = service.getFileInfo('nonexistent.jpg');

      expect(result).toEqual({ exists: false });
    });
  });

  describe('getFileUrl', () => {
    it('should return correct URL for default category', () => {
      const result = service.getFileUrl('test.jpg');

      expect(result).toBe('http://localhost:3000/uploads/images/test.jpg');
    });

    it('should return correct URL for custom category', () => {
      const result = service.getFileUrl('test.mp4', 'videos');

      expect(result).toBe('http://localhost:3000/uploads/videos/test.mp4');
    });
  });
});
