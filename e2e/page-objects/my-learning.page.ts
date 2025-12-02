import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for My Learning Page
 * Encapsulates all interactions with the user's enrolled courses page
 */
export class MyLearningPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly courseCards: Locator;
  readonly progressBars: Locator;
  readonly continueButtons: Locator;
  readonly emptyStateMessage: Locator;
  readonly browseCoursesButton: Locator;
  readonly filterTabs: Locator;
  readonly allTab: Locator;
  readonly inProgressTab: Locator;
  readonly completedTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { name: /My Learning/i });
    this.courseCards = page
      .locator('[class*="card"]')
      .filter({ has: page.locator('a[href^="/courses/"]') });
    this.progressBars = page.locator(
      '[role="progressbar"], [class*="progress"]',
    );
    this.continueButtons = page.getByRole('link', { name: /Continue|Resume/i });
    this.emptyStateMessage = page.getByText(/No courses|Start learning/i);
    this.browseCoursesButton = page.getByRole('link', {
      name: /Browse Courses/i,
    });
    this.filterTabs = page.locator('[role="tablist"]');
    this.allTab = page.getByRole('tab', { name: /All/i });
    this.inProgressTab = page.getByRole('tab', { name: /In Progress/i });
    this.completedTab = page.getByRole('tab', { name: /Completed/i });
  }

  async goto() {
    await this.page.goto('/my-learning');
  }

  async expectPageLoaded() {
    await expect(this.page).toHaveURL(/\/my-learning/);
    await expect(this.pageTitle).toBeVisible();
  }

  async getEnrolledCourseCount() {
    return this.courseCards.count();
  }

  async clickContinueLearning(index = 0) {
    await this.continueButtons.nth(index).click();
    await expect(this.page).toHaveURL(/\/courses\/.+\/learn/);
  }

  async expectEmptyState() {
    await expect(this.emptyStateMessage).toBeVisible();
  }

  async clickBrowseCourses() {
    await this.browseCoursesButton.click();
    await expect(this.page).toHaveURL(/\/courses/);
  }

  async filterByAll() {
    await this.allTab.click();
  }

  async filterByInProgress() {
    await this.inProgressTab.click();
  }

  async filterByCompleted() {
    await this.completedTab.click();
  }
}
