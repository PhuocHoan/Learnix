import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { AdminPage } from './page-objects/admin.page';

test.describe('Admin Features', () => {
  let authPage: AuthPage;
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    adminPage = new AdminPage(page);

    // Login as admin
    await authPage.gotoLogin();
    await authPage.login('admin@example.com', 'Password123!');

    // Some apps might have a redirect or just wait for dashboard
    await expect(page).toHaveURL(/.*dashboard|.*admin/);
  });

  test('should navigate through admin dashboard', async ({ page }) => {
    await adminPage.gotoDashboard();
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('heading', { name: /Admin Dashboard/i }),
    ).toBeVisible();

    await adminPage.usersLink.click();
    await page.waitForURL(/\/admin\/users/);
    await expect(page).toHaveURL(/\/admin\/users/);

    await adminPage.gotoDashboard();
    await adminPage.coursesLink.click();
    await page.waitForURL(/\/admin\/courses/);
    await expect(page).toHaveURL(/\/admin\/courses/);

    await adminPage.gotoDashboard();
    await adminPage.statsLink.click();
    await page.waitForURL(/\/admin\/stats/);
    await expect(page).toHaveURL(/\/admin\/stats/);
  });

  test('should display user management table', async ({ page }) => {
    await adminPage.gotoUsers();
    await expect(adminPage.userTable).toBeVisible();

    // Check for some header or expected user
    await expect(page.getByText(/Email|User|Role/i).first()).toBeVisible();
  });

  test('should display course moderation table', async ({ page }) => {
    await adminPage.gotoCourses();
    await expect(adminPage.courseTable).toBeVisible();

    // Check for moderation specific columns
    await expect(page.getByText(/Status|Instructor|Title/i).first()).toBeVisible();
  });
});
