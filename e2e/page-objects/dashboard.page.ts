import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for Dashboard Page
 * Encapsulates all interactions with the student/user dashboard
 */
export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly welcomeMessage: Locator;
  readonly enrolledCoursesSection: Locator;
  readonly courseProgressCards: Locator;
  readonly continueButtons: Locator;
  readonly emptyStateMessage: Locator;
  readonly browseCoursesLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { name: /Dashboard/i }).first();
    this.welcomeMessage = page.getByText(/Welcome back/i);
    this.enrolledCoursesSection = page.getByRole('heading', {
      name: /My Courses|Enrolled Courses/i,
    });
    this.courseProgressCards = page
      .locator('[class*="progress"]')
      .filter({ has: page.locator('a') });
    this.continueButtons = page.getByRole('link', { name: /Continue|Resume/i });
    this.emptyStateMessage = page.getByText(
      /No courses enrolled|Start learning/i,
    );
    this.browseCoursesLink = page.getByRole('link', {
      name: /Browse Courses/i,
    });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectPageLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async expectWelcomeMessage() {
    await expect(this.welcomeMessage).toBeVisible();
  }

  async getEnrolledCourseCount() {
    return this.courseProgressCards.count();
  }

  async clickContinueLearning(index = 0) {
    await this.continueButtons.nth(index).click();
    await expect(this.page).toHaveURL(/\/courses\/.+\/learn/);
  }

  async expectEmptyState() {
    await expect(this.emptyStateMessage).toBeVisible();
  }

  async clickBrowseCourses() {
    await this.browseCoursesLink.click();
    await expect(this.page).toHaveURL(/\/courses/);
  }
}
