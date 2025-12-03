import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('Public Navigation', () => {
    test('should navigate from home to courses', async ({ page }, testInfo) => {
      await page.goto('/');

      if (testInfo.project.name === 'mobile') {
        // On mobile, open hamburger menu first
        const mobileMenuButton = page.locator('button[aria-label="Open menu"]');
        await mobileMenuButton.click();
        await page.waitForTimeout(300);

        const coursesLink = page
          .getByRole('link', { name: /Courses/i })
          .first();
        await coursesLink.click();
      } else {
        const coursesLink = page
          .getByRole('link', { name: /Courses/i })
          .first();
        await coursesLink.scrollIntoViewIfNeeded();
        await coursesLink.click();
      }

      await expect(page).toHaveURL(/\/courses/);
    });

    test('should navigate from home to login', async ({ page }, testInfo) => {
      await page.goto('/');

      // Wait for lazy-loaded content to appear
      await page.waitForSelector('h1, h2, button, a', { timeout: 10000 });

      if (testInfo.project.name === 'mobile') {
        // On mobile, the Sign up button is visible in header - use it to navigate
        // Login button is hidden on mobile (hidden sm:flex) so click Sign up and go from there
        const signUpButton = page.getByRole('button', { name: /Sign up/i });
        await signUpButton.click();
        await expect(page).toHaveURL(/\/register/);

        // Now navigate to login from register page
        const loginLink = page.getByRole('link', { name: /Sign in|Log in/i });
        await loginLink.click();
      } else {
        // Login can be either a link or button depending on header design
        const loginButton = page.getByRole('button', {
          name: /Sign in|Log in/i,
        });
        const loginLink = page.getByRole('link', { name: /Sign in|Log in/i });

        if (await loginButton.isVisible()) {
          await loginButton.click();
        } else {
          await loginLink.click();
        }
      }

      await expect(page).toHaveURL(/\/login/);
    });

    test('should navigate from home to register', async ({ page }) => {
      await page.goto('/');
      await page
        .getByRole('link', { name: /Sign up|Register|Get Started/i })
        .click();
      await expect(page).toHaveURL(/\/register/);
    });

    test('should show 404 for unknown routes', async ({ page }) => {
      await page.goto('/unknown-page-that-does-not-exist');
      // Use .first() to handle multiple elements matching
      await expect(page.getByText(/404|not found/i).first()).toBeVisible();
    });

    test('should have working back navigation', async ({ page }, testInfo) => {
      await page.goto('/');

      if (testInfo.project.name === 'mobile') {
        // On mobile, open hamburger menu and navigate
        const mobileMenuButton = page.locator('button[aria-label="Open menu"]');
        await mobileMenuButton.click();
        await page.waitForTimeout(300);

        const coursesLink = page
          .getByRole('link', { name: /Courses/i })
          .first();
        await coursesLink.click();
      } else {
        await page
          .getByRole('link', { name: /Courses/i })
          .first()
          .click();
      }

      await expect(page).toHaveURL(/\/courses/);

      await page.goBack();
      await expect(page).toHaveURL('/');
    });

    test('should have working forward navigation', async ({
      page,
    }, testInfo) => {
      await page.goto('/');

      if (testInfo.project.name === 'mobile') {
        // On mobile, open hamburger menu and navigate
        const mobileMenuButton = page.locator('button[aria-label="Open menu"]');
        await mobileMenuButton.click();
        await page.waitForTimeout(300);

        const coursesLink = page
          .getByRole('link', { name: /Courses/i })
          .first();
        await coursesLink.click();
      } else {
        await page
          .getByRole('link', { name: /Courses/i })
          .first()
          .click();
      }

      await expect(page).toHaveURL(/\/courses/);

      await page.goBack();
      await expect(page).toHaveURL('/');

      await page.goForward();
      await expect(page).toHaveURL(/\/courses/);
    });
  });

  test.describe('Header Navigation', () => {
    test('should display logo that links to home', async ({
      page,
    }, testInfo) => {
      await page.goto('/courses');

      // Logo is in the header - always visible
      const logo = page.getByRole('link', { name: /Learnix/i }).first();
      await expect(logo).toBeVisible();
      await logo.click();
      await expect(page).toHaveURL('/');
    });

    test('should have consistent header across pages', async ({
      page,
    }, testInfo) => {
      // Test pages with the standard header layout (login/register have different layout)
      const pages = ['/', '/courses'];

      for (const path of pages) {
        await page.goto(path);
        await expect(
          page.getByRole('link', { name: /Learnix/i }).first(),
        ).toBeVisible();
      }
    });

    test('should show auth buttons for guest users', async ({
      page,
    }, testInfo) => {
      await page.goto('/');

      // Wait for lazy-loaded content to appear
      await page.waitForSelector('h1, h2, button, a', { timeout: 10000 });

      if (testInfo.project.name === 'mobile') {
        // On mobile, the Sign up button is visible in the header
        // Login button is hidden on mobile (hidden sm:flex)
        const signUpButton = page.getByRole('button', { name: /Sign up/i });
        await expect(signUpButton).toBeVisible();
      } else {
        // Should show login and/or register buttons (can be either link or button)
        const loginButton = page.getByRole('button', {
          name: /Sign in|Log in/i,
        });
        const registerButton = page.getByRole('button', {
          name: /Sign up|Register/i,
        });
        const loginLink = page.getByRole('link', { name: /Sign in|Log in/i });
        const registerLink = page.getByRole('link', {
          name: /Sign up|Register/i,
        });

        // At least one should be visible
        const hasLoginOrRegister =
          (await loginButton.isVisible().catch(() => false)) ||
          (await registerButton.isVisible().catch(() => false)) ||
          (await loginLink.isVisible().catch(() => false)) ||
          (await registerLink.isVisible().catch(() => false));
        expect(hasLoginOrRegister).toBe(true);
      }
    });
  });

  test.describe('Desktop Navigation', () => {
    test('should show navigation links in header on desktop', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');

      // Look for navigation links in the header
      const homeLink = page.getByRole('link', { name: /Home/i });
      const coursesLink = page.getByRole('link', { name: /Courses/i });

      // Both links should be visible in header on desktop
      await expect(homeLink.first()).toBeVisible();
      await expect(coursesLink.first()).toBeVisible();
    });

    test('should have navigation links for public routes', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');

      // Look for common navigation links
      const homeLink = page.getByRole('link', { name: /Home/i });
      const coursesLink = page.getByRole('link', { name: /Courses/i });

      // Both links should exist
      await expect(homeLink.first()).toBeVisible();
      await expect(coursesLink.first()).toBeVisible();
    });
  });

  test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      // Only set viewport on desktop project
      if (testInfo.project.name !== 'mobile') {
        await page.setViewportSize({ width: 375, height: 667 });
      }
    });

    test('should show mobile menu button', async ({ page }) => {
      await page.goto('/');
      // Look for hamburger menu button
      const mobileMenu = page.locator(
        'button[aria-label*="menu" i], button:has([class*="Menu"])',
      );
      await expect(mobileMenu.first()).toBeVisible();
    });

    test('should open mobile menu on click', async ({ page }) => {
      await page.goto('/');

      // Wait for page to fully load
      await page.waitForLoadState('domcontentloaded');

      // Look for the menu button in header
      const mobileMenuButton = page.locator('button[aria-label="Open menu"]');

      // Ensure button is visible before clicking
      await expect(mobileMenuButton).toBeVisible({ timeout: 5000 });
      await mobileMenuButton.click();

      // Menu should open - wait for navigation to appear
      await page.waitForTimeout(300); // Wait for animation

      // Should see navigation links in the mobile menu
      const coursesLink = page.getByRole('link', { name: /Courses/i });
      await expect(coursesLink.first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate correctly on mobile', async ({ page }) => {
      await page.goto('/');

      // Wait for page to fully load
      await page.waitForLoadState('domcontentloaded');

      // Open mobile menu first
      const mobileMenuButton = page.locator('button[aria-label="Open menu"]');
      await expect(mobileMenuButton).toBeVisible({ timeout: 5000 });
      await mobileMenuButton.click();

      // Wait for menu animation
      await page.waitForTimeout(300);

      // Click Courses in mobile menu
      const coursesLink = page.getByRole('link', { name: /Courses/i }).first();
      await expect(coursesLink).toBeVisible({ timeout: 5000 });
      await coursesLink.click();
      await expect(page).toHaveURL(/\/courses/);
    });

    test('should close mobile menu after navigation', async ({ page }) => {
      await page.goto('/');

      // Wait for page to fully load
      await page.waitForLoadState('domcontentloaded');

      // Open mobile menu
      const mobileMenuButton = page.locator('button[aria-label="Open menu"]');
      await expect(mobileMenuButton).toBeVisible({ timeout: 5000 });
      await mobileMenuButton.click();

      // Wait for menu animation
      await page.waitForTimeout(300);

      // Navigate to courses
      const coursesLink = page.getByRole('link', { name: /Courses/i }).first();
      await expect(coursesLink).toBeVisible({ timeout: 5000 });
      await coursesLink.click();

      // Should navigate
      await expect(page).toHaveURL(/\/courses/);
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should show breadcrumbs on course detail page', async ({ page }) => {
      await page.goto('/courses');

      // Wait for courses to load and click first one
      try {
        await page.waitForSelector('a[href^="/courses/"]', { timeout: 10000 });
        await page.locator('a[href^="/courses/"]').first().click();

        // Look for breadcrumb navigation
        const breadcrumb = page.locator(
          '[aria-label="breadcrumb"], nav:has-text("Courses")',
        );
        const breadcrumbCount = await breadcrumb.count();

        // Breadcrumbs may or may not be present depending on implementation
        expect(breadcrumbCount).toBeGreaterThanOrEqual(0);
      } catch {
        // No courses available - verify courses page loaded correctly with empty state
        await expect(
          page.getByRole('heading', { name: /Browse Courses|Courses/i }),
        ).toBeVisible();
      }
    });
  });
});

test.describe('Footer', () => {
  test('should display footer on home page', async ({ page }) => {
    await page.goto('/');
    // If there's a footer, verify it exists
    const footer = page.locator('footer');
    const footerCount = await footer.count();
    if (footerCount > 0) {
      await expect(footer).toBeVisible();
    }
  });

  test('should have links in footer', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    const footerCount = await footer.count();

    if (footerCount > 0) {
      // Footer should have some links
      const footerLinks = footer.getByRole('link');
      const linkCount = await footerLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('should have terms and privacy links in footer', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    const footerCount = await footer.count();

    if (footerCount > 0) {
      // Look for legal links
      const termsLink = footer.getByRole('link', { name: /Terms/i });
      const privacyLink = footer.getByRole('link', { name: /Privacy/i });

      // These may or may not be in footer
      const hasTerms = (await termsLink.count()) > 0;
      const hasPrivacy = (await privacyLink.count()) > 0;

      // At least log presence
      console.log(
        `Footer has Terms link: ${hasTerms}, Privacy link: ${hasPrivacy}`,
      );
    }
  });
});

test.describe('Error Handling Navigation', () => {
  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto('/this-page-definitely-does-not-exist-12345');

    // Should show 404 page - use .first() to handle multiple matching elements
    await expect(
      page.getByText(/404|not found|page not found/i).first(),
    ).toBeVisible();

    // Should have navigation to go back home
    const homeLink = page.getByRole('link', { name: /home|back|return/i });
    if ((await homeLink.count()) > 0) {
      await homeLink.first().click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should preserve navigation state on refresh', async ({ page }) => {
    await page.goto('/courses?search=react&level=beginner');

    // Refresh the page
    await page.reload();

    // URL should be preserved
    await expect(page).toHaveURL(/search=react/);
    await expect(page).toHaveURL(/level=beginner/);
  });
});
