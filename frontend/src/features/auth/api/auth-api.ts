import { z } from 'zod';

import { type User } from '@/contexts/auth-context-types';
import { api } from '@/lib/api';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    fullName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Terms of Service and Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
  avatarUrl: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        val === '' ||
        val.startsWith('http://') ||
        val.startsWith('https://'),
      { message: 'Please enter a valid URL' },
    ),
});

export const deleteAccountSchema = z.object({
  password: z.string().optional(),
  confirmation: z.literal('DELETE', {
    message: 'Please type "DELETE" to confirm',
  }),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type DeleteAccountData = z.infer<typeof deleteAccountSchema>;

// API Response types
interface AuthResponse {
  user: User;
  message: string;
}

interface MessageResponse {
  message: string;
}

interface HasPasswordResponse {
  hasPassword: boolean;
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
  register: async (
    data: Omit<RegisterData, 'confirmPassword' | 'termsAccepted'>,
  ): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>('/auth/register', data);
    return response.data;
  },
  activate: async (token: string): Promise<MessageResponse> => {
    const response = await api.get<MessageResponse>(
      `/auth/activate?token=${token}`,
    );
    return response.data;
  },
  resendActivation: async (email: string): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>(
      '/auth/resend-activation',
      {
        email,
      },
    );
    return response.data;
  },
  logout: async (): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>('/auth/logout');
    return response.data;
  },
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
  selectRole: async (data: {
    role: 'student' | 'instructor';
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/select-role', data);
    return response.data;
  },
  forgotPassword: async (
    data: ForgotPasswordData,
  ): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>(
      '/auth/forgot-password',
      data,
    );
    return response.data;
  },
  resetPassword: async (
    token: string,
    newPassword: string,
  ): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
  changePassword: async (
    data: Omit<ChangePasswordData, 'confirmPassword'>,
  ): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>(
      '/auth/change-password',
      data,
    );
    return response.data;
  },
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    // Build cleaned data, explicitly send null to clear avatar
    const cleanedData: Record<string, string | null | undefined> = {};

    // Handle fullName
    if (data.fullName !== undefined) {
      cleanedData.fullName = data.fullName.trim() || null;
    }

    // Handle avatarUrl - send null to clear, or the URL to set
    if (data.avatarUrl !== undefined) {
      cleanedData.avatarUrl = data.avatarUrl.trim() || null;
    }

    const response = await api.patch<User>('/auth/profile', cleanedData);
    return response.data;
  },
  deleteAccount: async (data: {
    password?: string;
    confirmation: string;
  }): Promise<MessageResponse> => {
    const response = await api.delete<MessageResponse>('/auth/account', {
      data,
    });
    return response.data;
  },
  hasPassword: async (): Promise<HasPasswordResponse> => {
    const response = await api.get<HasPasswordResponse>('/auth/has-password');
    return response.data;
  },
};
