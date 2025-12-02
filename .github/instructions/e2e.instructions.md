---
description: 'End-to-End Testing with Playwright'
applyTo: '**/e2e/**'
---

# E2E Testing Instructions (Playwright)

## Core Principles

1.  **User-Centric**: Test user flows, not implementation details.
2.  **Resilience**: Use resilient locators (`getByRole`, `getByText`) that resemble how users interact with the page.
3.  **Isolation**: Tests should be independent. Reset state between tests.

## Writing Tests

1.  **Locators**:
    - Prefer `page.getByRole('button', { name: 'Submit' })`.
    - Avoid CSS selectors like `.btn-primary` or `#submit-btn`.
2.  **Assertions**:
    - Use web-first assertions: `await expect(locator).toBeVisible()`.
    - Avoid manual waits (`page.waitForTimeout`).
3.  **Page Object Model (POM)**:
    - Encapsulate page-specific logic in Page Objects.
    - Example: `LoginPage` class with `login(username, password)` method.

## Configuration

- Run tests in parallel.
- Configure retries for flaky tests (but fix the flakiness!).
- Use different projects for different browsers (Chromium, Firefox, WebKit) and viewports (Desktop, Mobile).

## Environment Configuration

### Local Development

```bash
# Start services with Docker Compose
make dev

# Run E2E tests
pnpm test:e2e
```

### CI/CD (Vercel Preview)

```typescript
// playwright.config.ts
export default defineConfig({
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
  // ... other config
});
```

### GitHub Actions Integration

```yaml
- name: Run E2E Tests
  env:
    PLAYWRIGHT_BASE_URL: ${{ github.event.deployment_status.target_url }}
  run: pnpm test:e2e
```

## Example

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Welcome, User')).toBeVisible();
});
```
