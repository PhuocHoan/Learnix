import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

test.describe('AI Quiz Generation', () => {
  test.setTimeout(120000);
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

    // Wait for either the list to load OR the empty state to appear
    await Promise.race([
      courseCards
        .first()
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {}),
      page
        .getByText(/no courses yet/i)
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(() => {}),
    ]);

    if ((await courseCards.count()) === 0) {
      console.log('Creating a new course for E2E test...');
      const createBtn = page
        .getByRole('button', { name: /create course|new course/i })
        .first();
      await createBtn.waitFor({ state: 'visible' });
      await createBtn.click();

      await expect(page).toHaveURL(/\/instructor\/courses\/new/);

      const titleInput = page.getByLabel(/title/i);
      await titleInput.waitFor({ state: 'visible' });
      await titleInput.fill('E2E Test Course ' + Date.now());

      await page
        .getByLabel(/description/i)
        .fill('This is a test course for AI quiz generation.');

      const saveBtn = page.getByRole('button', { name: 'Create Course' });
      await expect(saveBtn).toBeEnabled();
      await saveBtn.click();

      console.log('Waiting for redirect to course editor...');
      await page.waitForURL('**/instructor/courses/*/edit*', {
        timeout: 90000,
      });
    } else {
      console.log('Using existing course for E2E test...');
      const editBtn = courseCards.first().getByRole('link', { name: /edit/i });
      await editBtn.waitFor({ state: 'visible' });
      await editBtn.click();
    }

    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /edit:/i })).toBeVisible();

    // Go to curriculum tab
    await page.getByRole('tab', { name: /curriculum/i }).click();

    // Ensure a section exists
    const hasNoSections = await page
      .getByText(/No sections yet/i)
      .isVisible()
      .catch(() => false);
    if (
      hasNoSections ||
      (await page.getByRole('button', { name: /add lesson/i }).count()) === 0
    ) {
      await page.getByRole('button', { name: /add section/i }).click();
      await page.getByPlaceholder(/section title/i).fill('Test Section');
      await page.getByRole('button', { name: /^save$/i }).click();
      await expect(page.getByText('Test Section').first()).toBeVisible();
    }

    // Ensure a lesson exists (AI needs lessons to generate from)
    if ((await page.locator('.lesson-item').count()) === 0) {
      const addLessonBtn = page
        .getByRole('button', { name: /add lesson/i })
        .first();
      await addLessonBtn.click();
      await page.getByLabel(/lesson title/i).fill('Test Lesson');
      await page.getByRole('button', { name: /save lesson/i }).click();
      await expect(page.getByText('Test Lesson').first()).toBeVisible();
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
