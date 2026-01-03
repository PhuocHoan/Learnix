import { config } from '@/lib/config';

export interface UploadResult {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

interface ErrorResponse {
  message?: string;
}

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  resource_type: string;
}

/**
 * Upload API functions for file handling
 */
export const uploadApi = {
  /**
   * Get Cloudinary configuration for direct uploads
   */
  getCloudinaryConfig: async (): Promise<CloudinaryConfig> => {
    const response = await fetch(`${config.apiUrl}/upload/cloudinary-config`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response
        .json()
        .then((data: unknown) => data as ErrorResponse)
        .catch((): ErrorResponse => ({}));
      throw new Error(error.message ?? 'Failed to get Cloudinary config');
    }

    return response.json() as Promise<CloudinaryConfig>;
  },

  /**
   * Upload an avatar image (max 5MB)
   */
  uploadAvatar: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.apiUrl}/upload/avatar`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const error = await response
        .json()
        .then((data: unknown) => data as ErrorResponse)
        .catch((): ErrorResponse => ({}));
      throw new Error(error.message ?? 'Failed to upload avatar');
    }

    return response.json() as Promise<UploadResult>;
  },

  /**
   * Upload a single image (max 10MB)
   */
  uploadImage: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.apiUrl}/upload/image`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response
        .json()
        .then((data: unknown) => data as ErrorResponse)
        .catch((): ErrorResponse => ({}));
      throw new Error(error.message ?? 'Failed to upload image');
    }

    return response.json() as Promise<UploadResult>;
  },

  /**
   * Upload multiple images (max 10 files, 10MB each)
   */
  uploadImages: async (files: File[]): Promise<UploadResult[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${config.apiUrl}/upload/images`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response
        .json()
        .then((data: unknown) => data as ErrorResponse)
        .catch((): ErrorResponse => ({}));
      throw new Error(error.message ?? 'Failed to upload images');
    }

    return response.json() as Promise<UploadResult[]>;
  },

  /**
   * Upload a general file (max 25MB)
   */
  uploadFile: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.apiUrl}/upload/file`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response
        .json()
        .then((data: unknown) => data as ErrorResponse)
        .catch((): ErrorResponse => ({}));
      throw new Error(error.message ?? 'Failed to upload file');
    }

    return response.json() as Promise<UploadResult>;
  },

  /**
   * Upload a video (max 100MB)
   * Attempts direct Cloudinary upload first to bypass serverless body limits,
   * falls back to API upload if Cloudinary config is unavailable.
   */
  uploadVideo: async (file: File): Promise<UploadResult> => {
    // Try direct Cloudinary upload first (for serverless environments with body size limits)
    try {
      const cloudinaryConfig = await uploadApi.getCloudinaryConfig();
      return await uploadVideoDirectToCloudinary(file, cloudinaryConfig);
    } catch {
      // Fallback to API upload if Cloudinary config is not available
      // This works for local development without Cloudinary
    }

    // Fallback: upload through API
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.apiUrl}/upload/video`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response
        .json()
        .then((data: unknown) => data as ErrorResponse)
        .catch((): ErrorResponse => ({}));
      throw new Error(error.message ?? 'Failed to upload video');
    }

    return response.json() as Promise<UploadResult>;
  },

  /**
   * Delete a file by filename
   */
  deleteFile: async (filename: string): Promise<void> => {
    const response = await fetch(`${config.apiUrl}/upload/${filename}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response
        .json()
        .then((data: unknown) => data as ErrorResponse)
        .catch((): ErrorResponse => ({}));
      throw new Error(error.message ?? 'Failed to delete file');
    }
  },
};

/**
 * Upload video directly to Cloudinary (bypasses API body size limits)
 */
async function uploadVideoDirectToCloudinary(
  file: File,
  config: CloudinaryConfig,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  formData.append('folder', config.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const result = (await response.json()) as CloudinaryUploadResponse;

  return {
    filename: result.public_id,
    originalName: file.name,
    mimetype: file.type,
    size: result.bytes,
    url: result.secure_url,
  };
}

/**
 * Helper function to validate file before upload
 */
export function validateImageFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {},
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  } = options;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.map((t) => t.split('/')[1]).join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`,
    };
  }

  return { valid: true };
}

/**
 * Helper function to validate video file before upload
 */
export function validateVideoFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {},
): { valid: boolean; error?: string } {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB default
    allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  } = options;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.map((t) => t.split('/')[1]).join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`,
    };
  }

  return { valid: true };
}

/**
 * Helper to create object URL for preview (remember to revoke!)
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Helper to revoke object URL after use
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
