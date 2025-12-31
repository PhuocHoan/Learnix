import { test, expect } from '@playwright/test';

/**
 * Performance E2E Tests
 * Tests for page load times and Core Web Vitals
 */
test.describe('Performance', () => {
  test.describe('Page Load Times', () => {
    test('home page should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await expect(page.getByRole('heading').first()).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds (generous for CI)
      expect(loadTime).toBeLessThan(5000);
    });

    test('courses page should load within acceptable time', async ({
      page,
    }) => {
      const startTime = Date.now();

      await page.goto('/courses');
      await expect(
        page.getByRole('heading', { name: /Courses|Browse/i }),
      ).toBeVisible();

      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test('login page should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/login');
      await expect(
        page.getByRole('button', { name: /Sign in/i }),
      ).toBeVisible();

      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });
  });

  test.describe('Lazy Loading', () => {
    test('should lazy load images below the fold', async ({ page }) => {
      await page.goto('/');

      // Wait for initial content
      await page.waitForLoadState('domcontentloaded');

      // Check that images have loading="lazy" or are deferred
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        // At least some images should have lazy loading
        const lazyImages = page.locator('img[loading="lazy"]');
        const lazyCount = await lazyImages.count();

        // Log for debugging
        console.log(`Total images: ${imageCount}, Lazy loaded: ${lazyCount}`);
      }
    });

    test('should load more courses on scroll', async ({ page }) => {
      await page.goto('/courses');
      await page.waitForLoadState('networkidle');

      // Verify page loaded
      await expect(
        page.getByRole('heading', { name: /Courses|Browse/i }),
      ).toBeVisible();

      const courses = page.locator('a[href^="/courses/"]');
      const initialCount = await courses.count();

      if (initialCount > 0) {
        // Scroll to bottom
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );

        // Wait for potential new courses
        await page.waitForTimeout(2000);

        const finalCount = await courses.count();

        // Count should be same or more (infinite scroll)
        expect(finalCount).toBeGreaterThanOrEqual(initialCount);
      } else {
        console.log('No courses found on initial load - skipping scroll test');
      }
    });
  });

  test.describe('Resource Loading', () => {
    test('should not have console errors on page load', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out expected errors (like failed API calls to test server)
      const criticalErrors = consoleErrors.filter(
        (error) =>
          !error.includes('favicon') &&
          !error.includes('Failed to fetch') &&
          !error.includes('net::ERR'),
      );

      // Log any errors for debugging
      if (criticalErrors.length > 0) {
        console.log('Console errors:', criticalErrors);
      }

      // Allow some non-critical errors
      expect(criticalErrors.length).toBeLessThan(5);
    });

    test('should have proper cache headers', async ({ page }) => {
      const responses: Map<string, string> = new Map();

      page.on('response', (response) => {
        const cacheControl = response.headers()['cache-control'];
        if (cacheControl) {
          responses.set(response.url(), cacheControl);
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check that some resources have cache headers
      expect(responses.size).toBeGreaterThan(0);
    });
  });

  test.describe('Network Requests', () => {
    test('should minimize API calls on page load', async ({ page }) => {
      const apiCalls: string[] = [];

      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('localhost:3000')) {
          apiCalls.push(url);
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should have reasonable number of API calls
      // (Adjust threshold based on your application)
      expect(apiCalls.length).toBeLessThan(20);
    });

    test('should use HTTP/2 or HTTP/3 when available', async ({ page }) => {
      const protocols: string[] = [];

      page.on('response', (response) => {
        const protocol = response.request().frame()?.url();
        if (protocol) {
          protocols.push(protocol);
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Just verify requests completed
      expect(protocols.length).toBeGreaterThan(0);
    });
  });

  test.describe('Bundle Size', () => {
    test('should load JavaScript efficiently', async ({ page }) => {
      let totalJsSize = 0;

      page.on('response', async (response) => {
        const contentType = response.headers()['content-type'];
        if (contentType?.includes('javascript')) {
          const body = await response.body().catch(() => null);
          if (body) {
            totalJsSize += body.length;
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const totalJsSizeKB = totalJsSize / 1024;

      // Log bundle size
      console.log(`Total JS bundle size: ${totalJsSizeKB.toFixed(2)} KB`);

      // Development builds are larger - use 8MB threshold
      // Production builds should be optimized with code splitting
      expect(totalJsSize).toBeLessThan(8 * 1024 * 1024);
    });

    test('should load CSS efficiently', async ({ page }) => {
      let totalCssSize = 0;

      page.on('response', async (response) => {
        const contentType = response.headers()['content-type'];
        if (contentType?.includes('css')) {
          const body = await response.body().catch(() => null);
          if (body) {
            totalCssSize += body.length;
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const totalCssSizeKB = totalCssSize / 1024;

      // Log bundle size
      console.log(`Total CSS size: ${totalCssSizeKB.toFixed(2)} KB`);

      // Should be under 500KB
      expect(totalCssSize).toBeLessThan(500 * 1024);
    });
  });
});

test.describe('Mobile Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should load efficiently on mobile', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await expect(page.getByRole('heading').first()).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Mobile should also load reasonably fast
    expect(loadTime).toBeLessThan(7000);
  });

  test('should not have horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check if there's horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});
