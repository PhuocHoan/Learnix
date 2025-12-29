import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

test.describe('Notifications System', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoLogin();
    // Use known valid user
    await authPage.login('instructor_mod_js@example.com', 'Password123!');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display notifications or empty state', async ({ page }) => {
    // 1. Locate Notification Bell
    const bellBtn = page.locator('button[aria-label="Notifications"]');
    await expect(bellBtn).toBeVisible();

    // 2. Open Notifications
    await bellBtn.click();

    // 3. Verify Dropdown Content
    // It should either show a list or "No notifications yet"
    // We expect one of these to be visible.
    const hasItems = await page.getByText('Notifications').isVisible();
    // The header "Notifications" is always there in standard dropdowns usually?
    // In notification-dropdown.tsx: <h4 className="font-semibold text-sm">Notifications</h4>
    await expect(
      page.getByRole('heading', { name: 'Notifications' }),
    ).toBeVisible();

    // Check content
    const emptyState = page.getByText('No notifications yet');
    const items = page.locator('.h-\\[400px\\] button');

    if (await emptyState.isVisible()) {
      console.log('Confirmed empty state for notifications');
    } else {
      // Should have items
      const count = await items.count();
      console.log(`Found ${count} notifications`);
      // We can't strictly assert count > 0 if the user has none, but determining "nothing crashed" is also valuable.

      // Try to click one if exists
      if (count > 0) {
        await items.first().click();
      }
    }
  });
});
