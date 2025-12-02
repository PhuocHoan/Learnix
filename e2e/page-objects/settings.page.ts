import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for Settings Page
 * Encapsulates all interactions with the user settings page
 */
export class SettingsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly profileTab: Locator;
  readonly securityTab: Locator;
  readonly dangerZoneTab: Locator;

  // Profile Section
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly avatarUpload: Locator;
  readonly saveProfileButton: Locator;

  // Security Section
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly updatePasswordButton: Locator;

  // Danger Zone Section
  readonly deleteAccountButton: Locator;
  readonly deleteConfirmationInput: Locator;
  readonly deletePasswordInput: Locator;

  // Common
  readonly successToast: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { name: /Settings/i });
    this.profileTab = page.getByRole('button', { name: /Profile/i });
    this.securityTab = page.getByRole('button', { name: /Security/i });
    this.dangerZoneTab = page.getByRole('button', { name: /Danger Zone/i });

    // Profile Section
    this.fullNameInput = page.getByLabel(/Full Name/i);
    this.emailInput = page.getByLabel(/Email/i);
    this.avatarUpload = page.locator('[aria-label="Upload avatar"]');
    this.saveProfileButton = page.getByRole('button', {
      name: /Save Changes/i,
    });

    // Security Section
    this.currentPasswordInput = page.getByLabel(/Current Password/i);
    this.newPasswordInput = page.getByLabel(/New Password/i);
    this.confirmPasswordInput = page.getByLabel(/Confirm New Password/i);
    this.updatePasswordButton = page.getByRole('button', {
      name: /Update Password/i,
    });

    // Danger Zone Section
    this.deleteAccountButton = page.getByRole('button', {
      name: /Delete My Account/i,
    });
    this.deleteConfirmationInput = page.getByPlaceholder('DELETE');
    this.deletePasswordInput = page.locator('input[type="password"]').first();

    // Common
    this.successToast = page.locator(
      '[data-sonner-toast][data-type="success"]',
    );
    this.errorMessage = page.locator('[data-sonner-toast][data-type="error"]');
  }

  async goto() {
    await this.page.goto('/settings');
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
  }

  async switchToProfile() {
    await this.profileTab.click();
    await expect(this.fullNameInput).toBeVisible();
  }

  async switchToSecurity() {
    await this.securityTab.click();
    await expect(this.currentPasswordInput).toBeVisible();
  }

  async switchToDangerZone() {
    await this.dangerZoneTab.click();
    await expect(this.deleteAccountButton).toBeVisible();
  }

  async updateFullName(name: string) {
    await this.fullNameInput.clear();
    await this.fullNameInput.fill(name);
    await this.saveProfileButton.click();
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.switchToSecurity();
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.updatePasswordButton.click();
  }

  async initiateDeleteAccount(password: string) {
    await this.switchToDangerZone();
    if (password) {
      await this.deletePasswordInput.fill(password);
    }
    await this.deleteConfirmationInput.fill('DELETE');
    await this.deleteAccountButton.click();
  }

  async expectSuccessToast() {
    await expect(this.successToast).toBeVisible({ timeout: 5000 });
  }

  async expectErrorMessage() {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }
}
