import { test, expect } from '@playwright/test';

test.describe('Instructor Flow', () => {
  test('should display registration form for instructor account creation', async ({
    page,
  }) => {
    // Visit registration page
    await page.goto('/register');

    // Verify registration form is displayed with all necessary fields
    await expect(page.getByLabel(/name|full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i).first()).toBeVisible(); // Password field
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /create account|sign up|register/i }),
    ).toBeVisible();

    // Verify OAuth options are available
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
  });

  test('should show protected instructor routes require authentication', async ({
    page,
  }) => {
    // Verify that instructor routes are properly protected
    await page.goto('/instructor/courses');

    // Should show authentication modal for protected route
    await expect(
      page.getByRole('heading', { name: /join learnix to continue/i }),
    ).toBeVisible();

    // Verify we can navigate back from the modal
    await expect(page.getByRole('button', { name: /close/i })).toBeVisible();
  });
});
