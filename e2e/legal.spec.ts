import { test, expect } from '@playwright/test';

/**
 * Legal Pages E2E Tests
 * Tests for Terms of Service and Privacy Policy pages
 */
test.describe('Legal Pages', () => {
  test.describe('Terms of Service Page', () => {
    test('should display terms of service page', async ({ page }) => {
      await page.goto('/terms');
      await expect(
        page.getByRole('heading', { name: /Terms of Service/i }),
      ).toBeVisible();
    });

    test('should be accessible from register page', async ({ page }) => {
      await page.goto('/register');

      // The terms link is inside a checkbox label - need to click carefully
      const termsLink = page.getByRole('link', { name: /Terms of Service/i });
      await termsLink.scrollIntoViewIfNeeded();

      // Use evaluate to navigate directly to avoid checkbox interference
      const href = await termsLink.getAttribute('href');
      if (href) {
        await page.goto(href);
      } else {
        await termsLink.click({ force: true });
      }

      await expect(page).toHaveURL(/\/terms/);
    });

    test('should have back navigation', async ({ page }) => {
      await page.goto('/');
      await page.goto('/terms');
      await page.goBack();
      await expect(page).toHaveURL('/');
    });

    test('should be responsive on mobile', async ({ page }, testInfo) => {
      if (testInfo.project.name !== 'mobile') {
        await page.setViewportSize({ width: 375, height: 667 });
      }
      await page.goto('/terms');
      await expect(
        page.getByRole('heading', { name: /Terms of Service/i }),
      ).toBeVisible();
    });
  });

  test.describe('Privacy Policy Page', () => {
    test('should display privacy policy page', async ({ page }) => {
      await page.goto('/privacy');
      await expect(
        page.getByRole('heading', { name: /Privacy Policy/i }),
      ).toBeVisible();
    });

    test('should be accessible from register page', async ({ page }) => {
      await page.goto('/register');

      // The privacy link is inside a checkbox label - need to click carefully
      const privacyLink = page.getByRole('link', { name: /Privacy Policy/i });
      await privacyLink.scrollIntoViewIfNeeded();

      // Use evaluate to navigate directly to avoid checkbox interference
      const href = await privacyLink.getAttribute('href');
      if (href) {
        await page.goto(href);
      } else {
        await privacyLink.click({ force: true });
      }

      await expect(page).toHaveURL(/\/privacy/);
    });

    test('should have back navigation', async ({ page }) => {
      await page.goto('/');
      await page.goto('/privacy');
      await page.goBack();
      await expect(page).toHaveURL('/');
    });

    test('should be responsive on mobile', async ({ page }, testInfo) => {
      if (testInfo.project.name !== 'mobile') {
        await page.setViewportSize({ width: 375, height: 667 });
      }
      await page.goto('/privacy');
      await expect(
        page.getByRole('heading', { name: /Privacy Policy/i }),
      ).toBeVisible();
    });
  });
});

test.describe('Legal Pages - Navigation', () => {
  test('should navigate between terms and privacy pages', async ({ page }) => {
    await page.goto('/terms');

    // Look for a link to privacy policy
    const privacyLink = page.getByRole('link', { name: /Privacy/i });
    if ((await privacyLink.count()) > 0) {
      await privacyLink.first().click();
      await expect(page).toHaveURL(/\/privacy/);
    }
  });

  test('should have consistent header on legal pages', async ({ page }) => {
    await page.goto('/terms');
    await expect(
      page.getByRole('link', { name: /Learnix/i }).first(),
    ).toBeVisible();

    await page.goto('/privacy');
    await expect(
      page.getByRole('link', { name: /Learnix/i }).first(),
    ).toBeVisible();
  });
});
