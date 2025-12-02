import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for Password Reset Flow Pages
 * Encapsulates interactions with forgot-password and reset-password pages
 */
export class PasswordResetPage {
  readonly page: Page;

  // Forgot Password Page
  readonly forgotPasswordTitle: Locator;
  readonly forgotPasswordEmailInput: Locator;
  readonly sendResetLinkButton: Locator;
  readonly backToLoginLink: Locator;

  // Reset Password Page
  readonly resetPasswordTitle: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly resetPasswordButton: Locator;

  // Common
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Forgot Password Page
    this.forgotPasswordTitle = page.getByRole('heading', {
      name: /Forgot Password/i,
    });
    this.forgotPasswordEmailInput = page.getByLabel(/Email/i);
    this.sendResetLinkButton = page.getByRole('button', {
      name: /Send Reset Link/i,
    });
    this.backToLoginLink = page.getByRole('link', { name: /Back to login/i });

    // Reset Password Page
    this.resetPasswordTitle = page.getByRole('heading', {
      name: /Reset Password/i,
    });
    this.newPasswordInput = page.getByLabel(/New Password/i);
    this.confirmPasswordInput = page.getByLabel(/Confirm Password/i);
    this.resetPasswordButton = page.getByRole('button', {
      name: /Reset Password/i,
    });

    // Common
    this.successMessage = page.locator(
      '[data-sonner-toast][data-type="success"]',
    );
    this.errorMessage = page.locator('[data-sonner-toast][data-type="error"]');
  }

  async gotoForgotPassword() {
    await this.page.goto('/forgot-password');
  }

  async gotoResetPassword(token: string) {
    await this.page.goto(`/reset-password?token=${token}`);
  }

  async expectForgotPasswordPageVisible() {
    await expect(this.forgotPasswordTitle).toBeVisible();
    await expect(this.forgotPasswordEmailInput).toBeVisible();
  }

  async expectResetPasswordPageVisible() {
    await expect(this.resetPasswordTitle).toBeVisible();
  }

  async requestPasswordReset(email: string) {
    await this.forgotPasswordEmailInput.fill(email);
    await this.sendResetLinkButton.click();
  }

  async resetPassword(newPassword: string) {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.resetPasswordButton.click();
  }

  async navigateBackToLogin() {
    await this.backToLoginLink.click();
    await expect(this.page).toHaveURL(/\/login/);
  }

  async expectSuccessMessage() {
    await expect(this.successMessage).toBeVisible({ timeout: 5000 });
  }

  async expectErrorMessage() {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }
}
