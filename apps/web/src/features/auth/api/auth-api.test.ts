import { describe, it, expect } from 'vitest';

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  deleteAccountSchema,
} from './auth-api';

describe('Auth API Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('email');
      }
    });

    it('rejects short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345', // less than 6 chars
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('6');
      }
    });

    it('rejects empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing fields', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects email with spaces', () => {
      const invalidData = {
        email: 'test @example.com',
        password: 'password123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('accepts email with subdomain', () => {
      const validData = {
        email: 'test@mail.example.com',
        password: 'password123',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('registerSchema', () => {
    it('validates correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        termsAccepted: true,
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('allows registration without fullName (optional)', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        termsAccepted: true,
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects short fullName', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'J', // less than 2 chars
        termsAccepted: true,
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2');
      }
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        termsAccepted: true,
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123', // less than 6 chars
        confirmPassword: '123',
        fullName: 'John Doe',
        termsAccepted: true,
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
        fullName: 'John Doe',
        termsAccepted: true,
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('match');
      }
    });

    it('rejects when terms are not accepted', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        termsAccepted: false,
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Terms');
      }
    });

    it('rejects when termsAccepted is missing', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('accepts fullName with special characters', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: "José María O'Connor-Smith",
        termsAccepted: true,
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('validates correct email', () => {
      const validData = { email: 'test@example.com' };
      const result = forgotPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidData = { email: 'not-an-email' };
      const result = forgotPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects empty email', () => {
      const invalidData = { email: '' };
      const result = forgotPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing email', () => {
      const result = forgotPasswordSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('validates correct reset password data', () => {
      const validData = {
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      const result = resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects short new password', () => {
      const invalidData = {
        newPassword: '12345',
        confirmPassword: '12345',
      };
      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects mismatched passwords', () => {
      const invalidData = {
        newPassword: 'newPassword123',
        confirmPassword: 'differentPassword',
      };
      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('match');
      }
    });

    it('rejects empty confirm password', () => {
      const invalidData = {
        newPassword: 'newPassword123',
        confirmPassword: '',
      };
      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('validates correct change password data', () => {
      const validData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects short new password', () => {
      const invalidData = {
        currentPassword: 'oldPassword123',
        newPassword: '12345',
        confirmPassword: '12345',
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects mismatched passwords', () => {
      const invalidData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'differentPassword',
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing fields', () => {
      const invalidData = {
        currentPassword: 'oldPassword123',
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('validates empty update (all optional)', () => {
      const validData = {};
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates fullName update', () => {
      const validData = { fullName: 'New Name' };
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates avatarUrl update with https', () => {
      const validData = { avatarUrl: 'https://example.com/avatar.jpg' };
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates avatarUrl update with http', () => {
      const validData = { avatarUrl: 'http://example.com/avatar.jpg' };
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates empty avatarUrl (to clear)', () => {
      const validData = { avatarUrl: '' };
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid avatarUrl', () => {
      const invalidData = { avatarUrl: 'not-a-url' };
      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects fullName over 100 characters', () => {
      const invalidData = { fullName: 'A'.repeat(101) };
      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('accepts fullName at exactly 100 characters', () => {
      const validData = { fullName: 'A'.repeat(100) };
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('deleteAccountSchema', () => {
    it('validates correct delete account data with password', () => {
      const validData = {
        password: 'myPassword123',
        confirmation: 'DELETE',
      };
      const result = deleteAccountSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates delete account without password (OAuth users)', () => {
      const validData = {
        confirmation: 'DELETE',
      };
      const result = deleteAccountSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects wrong confirmation text', () => {
      const invalidData = {
        password: 'myPassword123',
        confirmation: 'delete', // lowercase
      };
      const result = deleteAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing confirmation', () => {
      const invalidData = {
        password: 'myPassword123',
      };
      const result = deleteAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects confirmation with extra text', () => {
      const invalidData = {
        confirmation: 'DELETE ACCOUNT',
      };
      const result = deleteAccountSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
