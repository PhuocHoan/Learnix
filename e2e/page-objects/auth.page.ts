import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for Authentication Pages (Login/Register)
 * Encapsulates all interactions with auth pages
 */
export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly nameInput: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly githubButton: Locator;
  readonly switchToRegister: Locator;
  readonly switchToLogin: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/Email/i);
    this.passwordInput = page.getByLabel(/^Password$/i);
    this.confirmPasswordInput = page.getByLabel(/Confirm Password/i);
    this.nameInput = page.getByLabel(/Full Name/i);
    this.submitButton = page.getByRole('button', {
      name: /Sign in|Sign up|Create account/i,
    });
    this.googleButton = page.getByRole('button', { name: /Google/i });
    this.githubButton = page.getByRole('button', { name: /GitHub/i });
    this.switchToRegister = page.getByRole('link', {
      name: /Sign up|Create account/i,
    });
    this.switchToLogin = page.getByRole('link', { name: /Sign in|Log in/i });
    this.errorMessage = page.locator('[role="alert"]');
  }

  async gotoLogin() {
    await this.page.goto('/login');
  }

  async gotoRegister() {
    await this.page.goto('/register');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async register(name: string, email: string, password: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginPageVisible() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.submitButton).toBeVisible();
  }

  async expectRegisterPageVisible() {
    await expect(this.page).toHaveURL(/\/register/);
    await expect(this.nameInput).toBeVisible();
  }

  async expectErrorVisible() {
    await expect(this.errorMessage).toBeVisible();
  }

  async switchToRegisterPage() {
    // The link text is "Create one now" on login page
    const registerLink = this.page.getByRole('link', {
      name: /Sign up|Create account|Create one now|Register/i,
    });
    await registerLink.scrollIntoViewIfNeeded();
    await registerLink.click();
    await expect(this.page).toHaveURL(/\/register/);
  }

  async switchToLoginPage() {
    await this.switchToLogin.click();
    await expect(this.page).toHaveURL(/\/login/);
  }

  async clickGoogleLogin() {
    await this.googleButton.click();
  }

  async clickGitHubLogin() {
    await this.githubButton.click();
  }

  async logout() {
    // Open user menu
    const userMenuBtn = this.page.getByLabel('User menu');
    await userMenuBtn.click();

    // Click Sign Out
    const signOutBtn = this.page.getByRole('button', { name: /Sign Out/i });
    await signOutBtn.click();

    // Validate we are logged out (e.g. redirected to home or login)
    await expect(this.page).toHaveURL('/');
  }
}
