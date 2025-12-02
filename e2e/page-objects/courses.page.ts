import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for Courses Listing Page
 * Encapsulates all interactions with the courses browsing page
 */
export class CoursesPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly levelFilter: Locator;
  readonly sortFilter: Locator;
  readonly tagInput: Locator;
  readonly courseGrid: Locator;
  readonly courseCards: Locator;
  readonly loadingIndicator: Locator;
  readonly noResultsMessage: Locator;
  readonly clearTagsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { name: /Browse Courses/i });
    this.searchInput = page.getByPlaceholder(/Search by title/i);
    this.levelFilter = page
      .locator('select')
      .filter({ hasText: /All Levels/i });
    this.sortFilter = page
      .locator('select')
      .filter({ hasText: /Newest First/i });
    this.tagInput = page.getByPlaceholder(/Type tag & press Enter/i);
    this.courseGrid = page.locator('.grid');
    this.courseCards = page.locator('a[href^="/courses/"]');
    this.loadingIndicator = page.getByText(/Loading more courses/i);
    this.noResultsMessage = page.getByText(/No courses found/i);
    this.clearTagsButton = page.getByRole('button', { name: /Clear all/i });
  }

  async goto() {
    await this.page.goto('/courses');
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
  }

  async searchCourses(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounce
    await this.page.waitForTimeout(600);
  }

  async selectLevel(level: 'beginner' | 'intermediate' | 'advanced') {
    await this.levelFilter.selectOption(level);
  }

  async selectSort(
    option: 'date-DESC' | 'date-ASC' | 'price-ASC' | 'price-DESC',
  ) {
    await this.sortFilter.selectOption(option);
  }

  async addTag(tag: string) {
    await this.tagInput.fill(tag);
    await this.tagInput.press('Enter');
  }

  async clearAllTags() {
    await this.clearTagsButton.click();
  }

  async getCourseCount() {
    return this.courseCards.count();
  }

  async clickCourse(index = 0) {
    await this.courseCards.nth(index).click();
  }

  async expectCoursesVisible() {
    await expect(this.courseCards.first()).toBeVisible({ timeout: 10000 });
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible();
  }

  async scrollToLoadMore() {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight),
    );
    await this.page.waitForTimeout(500);
  }

  async getCourseCardInfo(index = 0) {
    const card = this.courseCards.nth(index);
    const title = await card.locator('h3').textContent();
    const price = await card
      .locator('[class*="font-bold"][class*="text-primary"]')
      .textContent();
    return { title, price };
  }
}
