import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for Course Detail Page
 * Encapsulates all interactions with the course detail page
 */
export class CourseDetailPage {
  readonly page: Page;
  readonly courseTitle: Locator;
  readonly courseDescription: Locator;
  readonly levelBadge: Locator;
  readonly enrollButton: Locator;
  readonly continueButton: Locator;
  readonly enrolledBadge: Locator;
  readonly priceDisplay: Locator;
  readonly instructorName: Locator;
  readonly courseContent: Locator;
  readonly sections: Locator;
  readonly lessons: Locator;
  readonly lockedLessons: Locator;
  readonly previewableLessons: Locator;
  readonly authModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.courseTitle = page.locator('h1').first();
    this.courseDescription = page
      .locator('p[class*="text-muted-foreground"]')
      .first();
    this.levelBadge = page
      .locator('[class*="capitalize"]')
      .filter({ hasText: /beginner|intermediate|advanced/i });
    this.enrollButton = page.getByRole('button', { name: /Enroll Now/i });
    this.continueButton = page.getByRole('button', {
      name: /Continue Learning/i,
    });
    this.enrolledBadge = page.getByText(/You are enrolled/i);
    this.priceDisplay = page.locator('[class*="text-3xl"][class*="font-bold"]');
    this.instructorName = page.getByText(/Course Instructor/i).locator('..');
    this.courseContent = page.getByRole('heading', { name: /Course Content/i });
    this.sections = page.locator(
      '[class*="border-border"][class*="rounded-xl"]',
    );
    this.lessons = page.locator('[class*="divide-y"] > div');
    this.lockedLessons = page.locator('[data-testid="locked-lesson"]');
    this.previewableLessons = page.getByRole('button', { name: /Preview/i });
    this.authModal = page.getByRole('dialog');
  }

  async goto(courseId: string) {
    await this.page.goto(`/courses/${courseId}`);
  }

  async expectPageLoaded() {
    await expect(this.courseTitle).toBeVisible();
    await expect(this.courseContent).toBeVisible();
  }

  async getTitle() {
    return this.courseTitle.textContent();
  }

  async getPrice() {
    return this.priceDisplay.textContent();
  }

  async clickEnroll() {
    await this.enrollButton.click();
  }

  async expectEnrolled() {
    await expect(this.enrolledBadge).toBeVisible();
  }

  async expectNotEnrolled() {
    await expect(this.enrollButton).toBeVisible();
  }

  async clickContinueLearning() {
    await this.continueButton.click();
    await expect(this.page).toHaveURL(/\/learn/);
  }

  async getSectionCount() {
    return this.sections.count();
  }

  async getLessonCount() {
    return this.lessons.count();
  }

  async clickLockedLesson() {
    const lockedLesson = this.page
      .locator('button:has([class*="Lock"])')
      .first();
    await lockedLesson.click();
  }

  async expectAuthModalVisible() {
    await expect(this.authModal).toBeVisible();
  }

  async closeAuthModal() {
    await this.page.keyboard.press('Escape');
  }

  async clickPreviewLesson() {
    await this.previewableLessons.first().click();
    await expect(this.page).toHaveURL(/\/learn\?lesson=/);
  }
}
