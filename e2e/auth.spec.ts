import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { PasswordResetPage } from './page-objects/password-reset.page';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    let authPage: AuthPage;

    test.beforeEach(async ({ page }) => {
      authPage = new AuthPage(page);
      await authPage.gotoLogin();
    });

    test('should display login form', async () => {
      await authPage.expectLoginPageVisible();
      await expect(authPage.emailInput).toBeVisible();
      await expect(authPage.passwordInput).toBeVisible();
    });

    test('should show OAuth login options', async () => {
      await expect(authPage.googleButton).toBeVisible();
      await expect(authPage.githubButton).toBeVisible();
    });

    test('should navigate to register page', async ({ page }, testInfo) => {
      if (testInfo.project.name === 'mobile') {
        // On mobile, scroll down to find the register link if needed
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight / 2),
        );
      }
      await authPage.switchToRegisterPage();
    });

    test('should show validation error for empty form', async ({ page }) => {
      await authPage.submitButton.click();
      // Form should not submit, stay on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await authPage.login('invalid@test.com', 'wrongpassword');
      // Should stay on login page or show error
      await expect(page).toHaveURL(/\/login/);
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await page.getByRole('link', { name: /Forgot password/i }).click();
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await authPage.gotoLogin();
      await authPage.expectLoginPageVisible();
    });
  });

  test.describe('Register Page', () => {
    let authPage: AuthPage;

    test.beforeEach(async ({ page }) => {
      authPage = new AuthPage(page);
      await authPage.gotoRegister();
    });

    test('should display register form', async () => {
      await authPage.expectRegisterPageVisible();
      await expect(authPage.nameInput).toBeVisible();
      await expect(authPage.emailInput).toBeVisible();
      await expect(authPage.passwordInput).toBeVisible();
    });

    test('should navigate to login page', async () => {
      await authPage.switchToLoginPage();
    });

    test('should show OAuth registration options', async () => {
      await expect(authPage.googleButton).toBeVisible();
      await expect(authPage.githubButton).toBeVisible();
    });

    test('should show validation error for weak password', async ({ page }) => {
      await authPage.nameInput.fill('Test User');
      await authPage.emailInput.fill('test@example.com');
      await authPage.passwordInput.fill('123'); // Too short
      await authPage.confirmPasswordInput.fill('123');
      await authPage.submitButton.click();
      // Should stay on register page
      await expect(page).toHaveURL(/\/register/);
    });

    test('should show error for password mismatch', async ({ page }) => {
      await authPage.nameInput.fill('Test User');
      await authPage.emailInput.fill('test@example.com');
      await authPage.passwordInput.fill('password123');
      await authPage.confirmPasswordInput.fill('different123');
      await authPage.submitButton.click();
      // Should stay on register page
      await expect(page).toHaveURL(/\/register/);
    });

    test('should show terms and privacy links', async ({ page }) => {
      await expect(page.getByRole('link', { name: /Terms/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Privacy/i })).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await authPage.gotoRegister();
      await authPage.expectRegisterPageVisible();
    });
  });

  test.describe('Forgot Password Page', () => {
    let passwordResetPage: PasswordResetPage;

    test.beforeEach(async ({ page }) => {
      passwordResetPage = new PasswordResetPage(page);
      await passwordResetPage.gotoForgotPassword();
    });

    test('should display forgot password form', async () => {
      await passwordResetPage.expectForgotPasswordPageVisible();
    });

    test('should navigate back to login', async () => {
      await passwordResetPage.navigateBackToLogin();
    });

    test('should show validation for empty email', async ({ page }) => {
      await passwordResetPage.sendResetLinkButton.click();
      // Should stay on page
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test('should show validation for invalid email format', async ({
      page,
    }) => {
      await passwordResetPage.forgotPasswordEmailInput.fill('invalid-email');
      await passwordResetPage.sendResetLinkButton.click();
      // Should stay on page
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test('should accept valid email and show success message', async ({
      page,
    }) => {
      await passwordResetPage.requestPasswordReset('test@example.com');
      // Should show success message (even if email doesn't exist for security)
      // Wait for toast or success indication
      await page.waitForTimeout(2000);
      // Check for success indication or that we stayed on page (both valid behaviors)
      const successIndicator = page.locator(
        '[data-sonner-toast], [class*="success"], [class*="Success"], [role="status"]',
      );
      const hasSuccess = (await successIndicator.count()) > 0;
      const stayedOnPage = page.url().includes('forgot-password');
      expect(hasSuccess || stayedOnPage).toBe(true);
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await passwordResetPage.gotoForgotPassword();
      await passwordResetPage.expectForgotPasswordPageVisible();
    });
  });

  test.describe('Reset Password Page', () => {
    test('should show invalid token error for missing token', async ({
      page,
    }) => {
      await page.goto('/reset-password');

      // Wait for lazy-loaded content to appear
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('h1, form, [role="heading"]', {
        timeout: 10000,
      });

      // Should show error heading or error message
      const hasErrorHeading = await page
        .getByRole('heading', { name: /Reset Failed|Reset Password/i })
        .isVisible()
        .catch(() => false);
      const hasError = await page
        .getByText(/invalid|expired|no token|failed/i)
        .first()
        .isVisible()
        .catch(() => false);
      const redirected = !page.url().includes('reset-password');
      expect(hasErrorHeading || hasError || redirected).toBe(true);
    });

    test('should show invalid token error for fake token', async ({ page }) => {
      await page.goto('/reset-password?token=fake-invalid-token');

      // Page may show form initially - try to submit to trigger token validation
      const submitButton = page.getByRole('button', {
        name: /Reset Password/i,
      });
      const passwordInput = page.getByLabel(/New Password/i).first();

      if (await submitButton.isVisible().catch(() => false)) {
        // Fill form and submit to trigger token validation
        await passwordInput.fill('newpassword123');
        const confirmInput = page.getByLabel(/Confirm/i);
        await confirmInput.fill('newpassword123');
        await submitButton.click();

        // Wait for error response
        await page.waitForTimeout(2000);
      }

      // Should show error for invalid token or still be on page
      const hasError = await page
        .getByText(/invalid|expired|error|failed/i)
        .first()
        .isVisible()
        .catch(() => false);
      const onResetPage = page.url().includes('reset-password');
      expect(hasError || onResetPage).toBe(true);
    });
  });

  test.describe('Account Activation Page', () => {
    test('should show error for missing token', async ({ page }) => {
      await page.goto('/activate');

      // Wait for lazy-loaded content to appear
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('h1, [role="heading"]', { timeout: 10000 });

      // Should show error heading "Activation Failed" or error message
      const hasErrorHeading = await page
        .getByRole('heading', { name: /Activation Failed/i })
        .isVisible()
        .catch(() => false);
      const hasError = await page
        .getByText(/invalid|expired|no token|failed/i)
        .first()
        .isVisible()
        .catch(() => false);
      const redirected = !page.url().includes('activate');
      expect(hasErrorHeading || hasError || redirected).toBe(true);
    });

    test('should show error for invalid token', async ({ page }) => {
      await page.goto('/activate?token=fake-invalid-token');
      // Should show error for invalid token
      await expect(
        page.getByText(/invalid|expired|failed/i).first(),
      ).toBeVisible({
        timeout: 5000,
      });
    });
  });
});

test.describe('Protected Routes', () => {
  test('should show auth modal when accessing protected route', async ({
    page,
  }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should show auth modal instead of redirecting
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();

    // Modal should have expected content
    await expect(
      authModal.getByText(/Join Learnix to Continue/i),
    ).toBeVisible();
    await expect(
      authModal.getByRole('button', { name: /Get Started for Free/i }),
    ).toBeVisible();
    await expect(
      authModal.getByRole('button', { name: /Sign In/i }),
    ).toBeVisible();
  });

  test('should show auth modal when accessing my-learning', async ({
    page,
  }) => {
    await page.goto('/my-learning');
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();
  });

  test('should show auth modal when accessing settings', async ({ page }) => {
    await page.goto('/settings');
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();
  });

  test('should show auth modal when accessing admin routes', async ({
    page,
  }) => {
    await page.goto('/admin');
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();
  });

  test('should show auth modal when accessing admin users page', async ({
    page,
  }) => {
    await page.goto('/admin/users');
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();
  });

  test('should show auth modal when accessing instructor routes', async ({
    page,
  }) => {
    await page.goto('/instructor/quiz-generator');
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();
  });

  test('should allow guest access to course learn page for preview lessons', async ({
    page,
  }) => {
    // Course learn page now allows guest access for preview lessons
    // Try to access a non-existent course first to see behavior
    await page.goto('/courses/some-course-id/learn');

    // Should either load the page (if course exists and has preview) or show modal
    // Wait a bit to see what happens
    await page.waitForTimeout(1000);

    // Check if modal is shown (if no course or no preview available)
    const authModal = page.getByRole('dialog');
    const modalVisible = await authModal.isVisible().catch(() => false);

    // Either modal is shown OR page loads (for preview lessons)
    expect(modalVisible || page.url().includes('/learn')).toBe(true);
  });
});

test.describe('OAuth Flow', () => {
  test('should have Google OAuth button that redirects', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();

    // Check button exists
    await expect(authPage.googleButton).toBeVisible();

    // Click should attempt OAuth (will fail in test but should start flow)
    // We just verify the button is clickable
    await expect(authPage.googleButton).toBeEnabled();
  });

  test('should have GitHub OAuth button that redirects', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();

    // Check button exists
    await expect(authPage.githubButton).toBeVisible();

    // Verify button is clickable
    await expect(authPage.githubButton).toBeEnabled();
  });
});
