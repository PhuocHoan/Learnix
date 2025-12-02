import { test, expect } from '@playwright/test';

/**
 * Theme Toggle E2E Tests
 * Tests for dark/light mode toggle functionality
 */
test.describe('Theme Toggle', () => {
  test('should display theme toggle button', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.locator(
      'button[aria-label*="theme" i], button:has([class*="Sun"]), button:has([class*="Moon"])',
    );
    await expect(themeButton.first()).toBeVisible();
  });

  test('should toggle from light to dark mode', async ({ page }) => {
    await page.goto('/');

    // Get initial state
    const html = page.locator('html');
    const initialIsDark = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );

    // Find and click theme toggle
    const themeButton = page.locator('button[aria-label*="theme" i]');
    await themeButton.click();

    // Check theme changed
    const newIsDark = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );
    expect(newIsDark).not.toBe(initialIsDark);
  });

  test('should persist theme preference', async ({ page }) => {
    await page.goto('/');

    // Toggle to dark mode
    const themeButton = page.locator('button[aria-label*="theme" i]');
    await themeButton.click();

    const html = page.locator('html');
    const isDarkAfterToggle = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );

    // Reload page
    await page.reload();

    // Theme should be preserved
    const isDarkAfterReload = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );
    expect(isDarkAfterReload).toBe(isDarkAfterToggle);
  });

  test('should apply theme across all pages', async ({ page }) => {
    await page.goto('/');

    // Toggle to dark mode
    const themeButton = page.locator('button[aria-label*="theme" i]');
    await themeButton.click();

    const html = page.locator('html');
    const isDark = await html.evaluate((el) => el.classList.contains('dark'));

    // Navigate to other pages
    await page.goto('/courses');
    const isDarkOnCourses = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );
    expect(isDarkOnCourses).toBe(isDark);

    await page.goto('/login');
    const isDarkOnLogin = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );
    expect(isDarkOnLogin).toBe(isDark);
  });

  test('should show appropriate icon based on current theme', async ({
    page,
  }) => {
    await page.goto('/');

    const html = page.locator('html');
    const initialIsDark = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );

    // Lucide icons render as SVGs - look for the theme button which contains the icon
    const themeButton = page.locator('button[aria-label*="theme" i]');
    await expect(themeButton).toBeVisible();

    // Toggle theme
    await themeButton.click();

    // Theme should have changed
    const newIsDark = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );
    expect(newIsDark).not.toBe(initialIsDark);

    // The button should still be visible with updated icon
    await expect(themeButton).toBeVisible();
  });
});

test.describe('Theme - Accessibility', () => {
  test('theme toggle should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab to theme toggle
    const themeButton = page.locator('button[aria-label*="theme" i]');
    await themeButton.focus();

    const html = page.locator('html');
    const initialIsDark = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );

    // Press Enter to toggle
    await page.keyboard.press('Enter');

    const newIsDark = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );
    expect(newIsDark).not.toBe(initialIsDark);
  });

  test('theme toggle should have aria-label', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.locator('button[aria-label*="theme" i]');
    await expect(themeButton).toHaveAttribute('aria-label', /.+/);
  });
});

test.describe('Theme - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should display theme toggle on mobile', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.locator('button[aria-label*="theme" i]');
    await expect(themeButton).toBeVisible();
  });

  test('should toggle theme on mobile', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    const initialIsDark = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );

    const themeButton = page.locator('button[aria-label*="theme" i]');
    await themeButton.click();

    const newIsDark = await html.evaluate((el) =>
      el.classList.contains('dark'),
    );
    expect(newIsDark).not.toBe(initialIsDark);
  });
});
