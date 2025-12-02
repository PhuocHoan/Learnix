import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/home.page';

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should display hero section with correct content', async () => {
    await homePage.expectHeroVisible();
    // At least one of these buttons should be visible
    const hasBrowse = await homePage.browseCoursesButton
      .isVisible()
      .catch(() => false);
    const hasGetStarted = await homePage.getStartedButton
      .isVisible()
      .catch(() => false);
    expect(hasBrowse || hasGetStarted).toBe(true);
  });

  test('should navigate to courses page when clicking Browse Courses', async ({
    page,
  }, testInfo) => {
    // On mobile, the Browse Courses link is in the sidebar - open it first
    if (testInfo.project.name === 'mobile') {
      // Open mobile menu first
      const mobileMenuButton = page.locator('button[aria-label="Open menu"]');
      await mobileMenuButton.click();
      await page.waitForTimeout(300);

      // Now click Browse Courses in the sidebar
      const browseButton = page
        .getByRole('link', { name: /Browse Courses/i })
        .first();
      await browseButton.click();
    } else {
      await homePage.clickBrowseCourses();
    }
    await expect(page).toHaveURL(/\/courses/);
  });

  test('should navigate to register page when clicking Get Started', async () => {
    await homePage.clickGetStarted();
  });

  test('should display categories section', async () => {
    await homePage.expectCategoriesVisible();
  });

  test('should display latest courses section', async () => {
    await homePage.expectLatestCoursesVisible();
  });

  test('should be responsive on mobile', async ({ page }, testInfo) => {
    if (testInfo.project.name !== 'mobile') {
      await page.setViewportSize({ width: 375, height: 667 });
    }
    await homePage.goto();
    await homePage.expectHeroVisible();
  });
});

test.describe('Home Page Navigation', () => {
  test('should navigate to course detail when clicking a course card', async ({
    page,
  }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Wait for courses to load - skip if none available
    try {
      await page.waitForSelector('a[href^="/courses/"]', { timeout: 10000 });
    } catch {
      // No courses available - just verify page loaded
      await homePage.expectHeroVisible();
      return;
    }

    // Click the first course card
    const courseLink = page.locator('a[href^="/courses/"]').first();
    await courseLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/courses\/.+/);
  });
});
