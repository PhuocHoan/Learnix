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
  test('should redirect to login when accessing settings without auth', async ({
    page,
  }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('should redirect to login when accessing settings profile tab', async ({
    page,
  }) => {
    await page.goto('/settings?tab=profile');
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('should redirect to login when accessing settings security tab', async ({
    page,
  }) => {
    await page.goto('/settings?tab=security');
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('should redirect to login when accessing settings danger zone tab', async ({
    page,
  }) => {
    await page.goto('/settings?tab=danger-zone');
    await expect(page).toHaveURL(/\/login|\/$/);
  });
});

test.describe('Settings Page - Login Redirect Flow', () => {
  test('should show login page with proper form after redirect from settings', async ({
    page,
  }) => {
    await page.goto('/settings');

    // After redirect, should be on login page
    await expect(page).toHaveURL(/\/login|\/$/);

    // Login form should be visible
    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/Password/i);
    const submitButton = page.getByRole('button', { name: /Sign in/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should provide OAuth options on login page after settings redirect', async ({
    page,
  }) => {
    await page.goto('/settings');

    // After redirect, should show OAuth buttons
    await expect(page).toHaveURL(/\/login|\/$/);

    const googleButton = page.getByRole('button', { name: /Google/i });
    const githubButton = page.getByRole('button', { name: /GitHub/i });

    await expect(googleButton).toBeVisible();
    await expect(githubButton).toBeVisible();
  });

  test('should provide link to register from login page', async ({ page }) => {
    await page.goto('/settings');

    // After redirect to login, should have register link
    await expect(page).toHaveURL(/\/login|\/$/);

    const registerLink = page.getByRole('link', {
      name: /Sign up|Create|Register/i,
    });
    await expect(registerLink.first()).toBeVisible();
  });
});

/**
 * Settings Page - Accessibility Tests
 */
test.describe('Settings Page - Accessibility', () => {
  test('login page should have proper page structure for screen readers', async ({
    page,
  }) => {
    // Settings redirects to login, so test login page accessibility
    await page.goto('/settings');

    // Wait for redirect and page to fully load
    await expect(page).toHaveURL(/\/login|\/$/i);
    await page.waitForLoadState('networkidle');

    // Verify login page has proper headings
    const headings = await page.getByRole('heading').count();
    expect(headings).toBeGreaterThan(0);

    // Should have form elements (email and password fields)
    const emailField = page.getByLabel(/Email/i);
    const passwordField = page.getByLabel(/Password/i);
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });

  test('login page should have accessible form labels', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login|\/$/);

    // Form fields should have proper labels
    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/Password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});
