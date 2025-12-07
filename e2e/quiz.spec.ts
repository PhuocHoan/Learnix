import { test, expect } from '@playwright/test';

test.describe('Quiz Flow', () => {
  test('should display registration form validation', async ({ page }) => {
    // Visit registration page
    await page.goto('/register');

    // Try to submit empty form
    await page
      .getByRole('button', { name: /create account|sign up|register/i })
      .click();

    // Should show validation errors
    await expect(page.getByText(/required|enter/i).first()).toBeVisible();
  });

  test('should show password validation requirements', async ({ page }) => {
    // Visit registration page
    await page.goto('/register');

    const uniqueId = Date.now();
    await page.getByLabel(/name|full name/i).fill(`QuizUser ${uniqueId}`);
    await page.getByLabel(/email/i).fill(`quizuser${uniqueId}@example.com`);

    // Enter weak password
    await page
      .getByLabel(/^password/i)
      .first()
      .fill('123');
    await page.getByLabel(/confirm password/i).fill('123');
    await page
      .getByRole('button', { name: /create account|sign up|register/i })
      .click();

    // Should show password strength requirement (use first match to avoid strict mode violation)
    await expect(
      page.getByText(/password must be at least/i).first(),
    ).toBeVisible();
  });
});
