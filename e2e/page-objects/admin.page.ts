import { type Page, type Locator, expect } from '@playwright/test';

export class AdminPage {
  readonly page: Page;
  readonly usersLink: Locator;
  readonly coursesLink: Locator;
  readonly statsLink: Locator;
  readonly userTable: Locator;
  readonly courseTable: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usersLink = page.getByRole('link', { name: /User Management/i });
    this.coursesLink = page.getByRole('link', { name: /Course Moderation/i });
    this.statsLink = page.getByRole('link', { name: /System Statistics/i });
    this.userTable = page.locator('div.divide-y, table').first();
    this.courseTable = page.locator('div.grid.gap-6, table').first();
    this.approveButton = page.getByRole('button', { name: /Approve/i });
    this.rejectButton = page.getByRole('button', { name: /Reject/i });
  }

  async gotoDashboard() {
    await this.page.goto('/admin');
  }

  async gotoUsers() {
    await this.page.goto('/admin/users');
  }

  async gotoCourses() {
    await this.page.goto('/admin/courses');
  }

  async expectUserInTable(email: string) {
    await expect(this.page.getByText(email)).toBeVisible();
  }

  async expectCourseInTable(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }
}
