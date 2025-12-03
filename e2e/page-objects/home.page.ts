import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for Home Page
 * Encapsulates all interactions with the home page
 */
export class HomePage {
  readonly page: Page;
  readonly heroTitle: Locator;
  readonly browseCoursesButton: Locator;
  readonly getStartedButton: Locator;
  readonly latestCoursesSection: Locator;
  readonly categoriesSection: Locator;
  readonly courseCards: Locator;
  readonly categoryTags: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.getByRole('heading', {
      name: /Master New Skills with AI-Powered Learning/i,
    });
    this.browseCoursesButton = page.getByRole('link', {
      name: /Browse Courses/i,
    });
    this.getStartedButton = page.getByRole('link', {
      name: /Get Started Free/i,
    });
    this.latestCoursesSection = page.getByRole('heading', {
      name: /Latest Courses/i,
    });
    this.categoriesSection = page.getByRole('heading', {
      name: /Explore Categories/i,
    });
    this.courseCards = page
      .locator('[class*="Card"]')
      .filter({ hasText: /.+/ });
    this.categoryTags = page.locator('button:has-text("")').filter({
      has: page.locator(':scope'),
    });
  }

  async goto() {
    await this.page.goto('/');
  }

  async expectHeroVisible() {
    await expect(this.heroTitle).toBeVisible();
  }

  async clickBrowseCourses() {
    // Use the button in main content (hero section), not the header navigation
    const mainButton = this.page
      .getByRole('main')
      .getByRole('link', { name: /Browse Courses/i });
    await mainButton.scrollIntoViewIfNeeded();
    await mainButton.click();
    await expect(this.page).toHaveURL(/\/courses/);
  }

  async clickGetStarted() {
    await this.getStartedButton.click();
    await expect(this.page).toHaveURL(/\/register/);
  }

  async expectLatestCoursesVisible() {
    await expect(this.latestCoursesSection).toBeVisible();
  }

  async expectCategoriesVisible() {
    await expect(this.categoriesSection).toBeVisible();
  }

  async clickCategoryTag(tagName: string) {
    await this.page.getByRole('button', { name: tagName }).click();
    await expect(this.page).toHaveURL(new RegExp(`tags=${tagName}`));
  }

  async clickCourseCard(index = 0) {
    const cards = this.page.locator("a[href^='/courses/']").filter({
      has: this.page.locator('[class*="Card"]'),
    });
    await cards.nth(index).click();
    await expect(this.page).toHaveURL(/\/courses\/.+/);
  }
}
