import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  validateImageFile,
  createPreviewUrl,
  revokePreviewUrl,
} from './upload-api';

// Mock URL methods
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

describe('Upload API Utilities', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('validateImageFile', () => {
    it('should validate JPEG image', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate PNG image', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it('should validate GIF image', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it('should validate WebP image', () => {
      const file = new File([''], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it('should reject PDF file', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject text file', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject file exceeding default max size (10MB)', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
      expect(result.error).toContain('10MB');
    });

    it('should accept file at exactly max size', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // Exactly 10MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it('should use custom max size', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB

      const result = validateImageFile(file, { maxSize: 5 * 1024 * 1024 }); // 5MB max

      expect(result.valid).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('should use custom allowed types', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = validateImageFile(file, {
        allowedTypes: ['image/png'], // Only PNG allowed
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should accept custom allowed types when file matches', () => {
      const file = new File([''], 'test.svg', { type: 'image/svg+xml' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = validateImageFile(file, {
        allowedTypes: ['image/svg+xml'],
      });

      expect(result.valid).toBe(true);
    });

    it('should reject empty file type', () => {
      const file = new File([''], 'test', { type: '' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
    });
  });

  describe('createPreviewUrl', () => {
    it('should call URL.createObjectURL with file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      mockCreateObjectURL.mockReturnValue('blob:http://localhost/123');

      const result = createPreviewUrl(file);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(result).toBe('blob:http://localhost/123');
    });
  });

  describe('revokePreviewUrl', () => {
    it('should call URL.revokeObjectURL with url', () => {
      const url = 'blob:http://localhost/123';

      revokePreviewUrl(url);

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(url);
    });
  });
});

describe('Upload API Functions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('uploadAvatar', () => {
    it('should create FormData with file', async () => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          filename: 'abc123.jpg',
          originalName: 'avatar.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          url: 'http://localhost:3000/uploads/images/abc123.jpg',
        }),
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const { uploadApi } = await import('./upload-api');
      const result = await uploadApi.uploadAvatar(file);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload/avatar'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
      expect(result.filename).toBe('abc123.jpg');
    });

    it('should throw error on failed upload', async () => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'File too large' }),
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const { uploadApi } = await import('./upload-api');

      await expect(uploadApi.uploadAvatar(file)).rejects.toThrow(
        'File too large',
      );
    });
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const file = new File(['content'], 'image.png', { type: 'image/png' });
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          filename: 'def456.png',
          url: 'http://localhost:3000/uploads/images/def456.png',
        }),
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const { uploadApi } = await import('./upload-api');
      const result = await uploadApi.uploadImage(file);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload/image'),
        expect.any(Object),
      );
      expect(result.filename).toBe('def456.png');
    });
  });

  describe('uploadImages', () => {
    it('should upload multiple images', async () => {
      const files = [
        new File(['content1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'image2.png', { type: 'image/png' }),
      ];
      const mockResponse = {
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { filename: 'file1.jpg' },
            { filename: 'file2.png' },
          ]),
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const { uploadApi } = await import('./upload-api');
      const result = await uploadApi.uploadImages(files);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload/images'),
        expect.any(Object),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('uploadFile', () => {
    it('should upload general file', async () => {
      const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      });
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          filename: 'doc123.pdf',
          mimetype: 'application/pdf',
        }),
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const { uploadApi } = await import('./upload-api');
      const result = await uploadApi.uploadFile(file);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload/file'),
        expect.any(Object),
      );
      expect(result.filename).toBe('doc123.pdf');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockResponse = { ok: true };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const { uploadApi } = await import('./upload-api');

      await expect(uploadApi.deleteFile('abc123.jpg')).resolves.not.toThrow();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload/abc123.jpg'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        }),
      );
    });

    it('should throw error on failed delete', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'File not found' }),
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const { uploadApi } = await import('./upload-api');

      await expect(uploadApi.deleteFile('nonexistent.jpg')).rejects.toThrow(
        'File not found',
      );
    });
  });
});
