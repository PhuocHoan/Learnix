import { test, expect } from '@playwright/test';

/**
 * Settings Page E2E Tests
 *
 * Since settings requires authentication, these tests verify:
 * 1. Unauthenticated users are redirected to login
 * 2. The login page provides proper access to authentication
 *
 * For authenticated settings tests, a proper auth fixture would be needed
 * with test user credentials and authentication state setup.
 */
test.describe('Settings Page - Unauthenticated', () => {
  test('should show auth modal when accessing settings without auth', async ({
    page,
  }) => {
    await page.goto('/settings');
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();
    await expect(
      authModal.getByText(/Join Learnix to Continue/i),
    ).toBeVisible();
  });

  test('should show auth modal when accessing settings profile tab', async ({
    page,
  }) => {
    await page.goto('/settings?tab=profile');
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();
  });

  test('should show auth modal when accessing settings security tab', async ({
    page,
  }) => {
    await page.goto('/settings?tab=security');
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();
  });

  test('should show auth modal when accessing settings danger zone tab', async ({
    page,
  }) => {
    await page.goto('/settings?tab=danger-zone');
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();
  });
});

test.describe('Settings Page - Auth Modal Flow', () => {
  test('should show auth modal with login option when accessing settings', async ({
    page,
  }) => {
    await page.goto('/settings');

    // Should show auth modal
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();

    // Modal should have Sign In button that navigates to login
    const signInButton = authModal.getByRole('button', { name: /Sign In/i });
    await expect(signInButton).toBeVisible();

    // Click Sign In button to navigate to login page
    await signInButton.click();
    await expect(page).toHaveURL(/\/login/);

    // Login form should be visible
    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/Password/i);
    const submitButton = page.getByRole('button', { name: /Sign in/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should provide OAuth options via modal to login page', async ({
    page,
  }) => {
    await page.goto('/settings');

    // Show auth modal
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();

    // Click Sign In to go to login page
    const signInButton = authModal.getByRole('button', { name: /Sign In/i });
    await signInButton.click();
    await expect(page).toHaveURL(/\/login/);

    // Should show OAuth buttons on login page
    const googleButton = page.getByRole('button', { name: /Google/i });
    const githubButton = page.getByRole('button', { name: /GitHub/i });

    await expect(googleButton).toBeVisible();
    await expect(githubButton).toBeVisible();
  });

  test('should provide link to register via modal', async ({ page }) => {
    await page.goto('/settings');

    // Show auth modal
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();

    // Click "Get Started for Free" button to go to register page
    const getStartedButton = authModal.getByRole('button', {
      name: /Get Started for Free/i,
    });
    await expect(getStartedButton).toBeVisible();

    await getStartedButton.click();
    await expect(page).toHaveURL(/\/register/);

    // Should have register form
    const registerLink = page.getByRole('link', {
      name: /Sign up|Create|Register|Sign in|Login/i,
    });
    await expect(registerLink.first()).toBeVisible();
  });
});

/**
 * Settings Page - Accessibility Tests
 */
test.describe('Settings Page - Accessibility', () => {
  test('auth modal should have proper structure for screen readers', async ({
    page,
  }) => {
    // Settings shows auth modal, so test modal accessibility
    await page.goto('/settings');

    // Wait for modal to appear
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();
    await page.waitForLoadState('networkidle');

    // Modal should have proper heading
    const modalHeading = authModal.getByText(/Join Learnix to Continue/i);
    await expect(modalHeading).toBeVisible();

    // Modal should have accessible buttons
    const getStartedButton = authModal.getByRole('button', {
      name: /Get Started for Free/i,
    });
    const signInButton = authModal.getByRole('button', { name: /Sign In/i });
    await expect(getStartedButton).toBeVisible();
    await expect(signInButton).toBeVisible();
  });

  test('auth modal should navigate to accessible login page', async ({
    page,
  }) => {
    await page.goto('/settings');

    // Show auth modal
    const authModal = page.getByRole('dialog');
    await expect(authModal).toBeVisible();

    // Click Sign In to go to login page
    const signInButton = authModal.getByRole('button', { name: /Sign In/i });
    await signInButton.click();
    await expect(page).toHaveURL(/\/login/);

    // Form fields should have proper labels
    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/Password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});
