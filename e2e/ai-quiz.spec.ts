import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

test.describe('AI Quiz Generation', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);

    // Login as instructor
    await authPage.gotoLogin();
    await authPage.login('instructor_mod_js@example.com', 'Password123!');

    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should open AI quiz generator for a course', async ({ page }) => {
    // Navigate to instructor courses
    await page.goto('/instructor/courses');
    await page.waitForLoadState('networkidle');

    // Check if there's at least one course, if not create one or skip
    const courseCards = page.locator('.instructor-course-card');
    if ((await courseCards.count()) === 0) {
      // Create a dummy course for testing
      await page
        .getByRole('button', { name: /create course|new course/i })
        .click();
      await page.waitForURL(/\/instructor\/courses\/new/);
      await page.getByLabel(/title/i).fill('E2E Test Course ' + Date.now());
      await page
        .getByLabel(/description/i)
        .fill('This is a test course for AI quiz generation.');
      await page.getByRole('button', { name: /create|save/i }).click();
      await page.waitForURL(/\/instructor\/courses\/.*\/edit/);
    } else {
      await courseCards.first().getByRole('link', { name: /edit/i }).click();
    }

    await page.waitForLoadState('networkidle');

    // Go to curriculum tab
    await page.getByRole('tab', { name: /curriculum/i }).click();

    // Ensure a section exists
    if (
      (await page
        .getByRole('heading', { name: /No sections yet/i })
        .isVisible()) ||
      (await page.locator('div:has-text("No sections yet")').count()) > 0
    ) {
      await page.getByRole('button', { name: /add section/i }).click();
      await page.getByPlaceholder(/section title/i).fill('Test Section');
      await page.getByRole('button', { name: /save/i }).click();
    }

    // Ensure a lesson exists (AI needs lessons to generate from)
    const lessonsCount = await page.locator('.lesson-item').count();
    if (lessonsCount === 0) {
      await page
        .getByRole('button', { name: /add lesson/i })
        .first()
        .click();
      await page.getByLabel(/lesson title/i).fill('Test Lesson');
      await page.getByRole('button', { name: /save lesson/i }).click();
    }

    // Open Quiz dialog
    await page.getByRole('button', { name: /Quiz/i }).first().click();

    // Select AI Powered
    await page.getByRole('heading', { name: /AI Powered/i }).click();

    // Should see AI Quiz Engineer modal
    await expect(page.getByText(/AI Quiz Engineer/i)).toBeVisible();
    await expect(page.getByText(/Question Formats/i)).toBeVisible();
  });
});
