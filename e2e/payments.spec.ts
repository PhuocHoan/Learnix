import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

test.describe('Payments System', () => {
  let authPage: AuthPage;

  test('should allow user to purchase a paid course (Full Flow)', async ({
    page,
    isMobile,
  }) => {
    test.setTimeout(240000); // 4 minutes for full flow
    const uniqueId = Date.now().toString();
    const courseTitle = `Paid Course ${uniqueId}`;

    // 1. Instructor: Create & Submit Course
    authPage = new AuthPage(page);
    await page.waitForTimeout(5000); // Wait for frontend to be fully ready
    await authPage.gotoLogin();

    await authPage.login('instructor_mod_js@example.com', 'Password123!');

    try {
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 60000 });
    } catch (e) {
      throw e;
    }

    await page.goto('/instructor/courses/new');
    await page.getByLabel('Course Title').fill(courseTitle);
    await page
      .getByLabel('Description')
      .fill('Test description for paid course');
    const createBtn = page.getByRole('button', { name: /Create Course/i });
    await expect(createBtn).toBeEnabled({ timeout: 10000 });
    await createBtn.click();
    await expect(page).toHaveURL(/.*\/edit/, { timeout: 40000 });

    // Set Price (Tab switch needed)
    // Create Course redirects to Curriculum tab, so we must go back to Details to set Price
    await page.getByRole('tab', { name: /Course Details/i }).click();
    const priceInput = page.getByLabel('Price ($)');
    await priceInput.waitFor({ state: 'visible', timeout: 30000 });
    await priceInput.fill('10');

    // Level (Select first available)
    await page.getByRole('combobox', { name: 'Level' }).click();
    await page.getByRole('option').first().click();

    // Save
    await page.getByRole('button', { name: /Save/i }).first().click();
    await expect(page.getByText('Course updated')).toBeVisible({
      timeout: 10000,
    });

    // Submit for Approval
    const submitBtn = page.getByRole('button', {
      name: /Submit for Approval/i,
    });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Confirm dialog
      await page.getByRole('button', { name: 'Submit', exact: true }).click();
      await expect(page.getByText('Course submitted')).toBeVisible({
        timeout: 10000,
      });
    }

    await authPage.logout();

    // 2. Admin: Approve Course
    await authPage.gotoLogin();
    await authPage.login('admin@example.com', 'Password123!'); // Assuming admin credentials
    await expect(page).toHaveURL(/.*(dashboard|admin)/, { timeout: 30000 }); // Admin dashboard might differ slightly but base is same

    // Go to Moderation
    await page.goto('/admin/courses');

    // Find the course (Pending)
    // The admin-courses-page uses Cards, not a table.
    // Find the course (Pending)
    // The admin-courses-page uses Cards.
    // We locate the card that contains the specific heading.
    const adminCourseCard = page
      .locator('div.rounded-xl, div.border') // Try to hit the card container classes
      .filter({ has: page.getByRole('heading', { name: courseTitle }) })
      .first();

    const approveBtn = adminCourseCard.getByRole('button', {
      name: /Approve/i,
    });

    // Ensure we are on the right tab if needed (though default is usually pending)
    if (!(await approveBtn.isVisible())) {
      const pendingTab = page.getByRole('tab', { name: /Pending/i });
      if (await pendingTab.isVisible()) await pendingTab.click();
    }

    await approveBtn.waitFor({ state: 'visible', timeout: 30000 });
    // Force click can help on mobile if there are overlay issues
    await approveBtn.click({ force: true });

    // Confirm approval in Dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    await dialog.getByRole('button', { name: 'Approve', exact: true }).click();

    await expect(page.getByText('Course approved')).toBeVisible({
      timeout: 30000,
    });

    await authPage.logout();

    // 3. Student: Buy Course
    await authPage.gotoLogin();
    await authPage.login('student_test@example.com', 'Password123!');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });

    await page.goto('/courses');
    await page.waitForTimeout(10000); // Wait for course propagation/indexing
    await page
      .getByPlaceholder('Search by title...')
      .waitFor({ state: 'visible', timeout: 30000 });
    await page.getByPlaceholder('Search by title...').fill(courseTitle);
    await page.keyboard.press('Enter');

    const courseCard = page.getByText(courseTitle).first();
    await courseCard.waitFor({ state: 'visible', timeout: 30000 });
    await courseCard.click();

    // Enroll
    const enrollBtn = page.getByRole('button', { name: /Enroll/i });
    await expect(enrollBtn).toBeVisible({ timeout: 20000 });
    await enrollBtn.click();

    // Checkout
    await expect(page).toHaveURL(/.*\/checkout\/.*/, { timeout: 30000 });
    await page.getByLabel(/Cardholder Name/i).fill('Test Student');
    await page.getByLabel(/Card Number/i).fill('4242424242424242');
    await page.getByLabel(/Expiry Date/i).fill('12/30');
    await page.getByLabel(/^CVC$/i).fill('123');
    await page.getByRole('button', { name: /Pay/i }).click();

    await expect(
      page
        .getByText(/Payment Successful/i)
        .or(page.getByText(/Successfully enrolled/i)),
    ).toBeVisible({ timeout: 40000 });
  });
});
