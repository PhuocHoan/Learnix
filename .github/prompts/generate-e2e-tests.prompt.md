description: "Generate E2E Tests with Playwright"
model: "Claude Opus 4.5 (Preview)"

---

You are the QA Engineer. Please generate Playwright E2E tests for the following user flow:
"{{user_flow}}"

## Environment Context

- **Local Testing**: Run against Docker Compose services.
- **CI/CD Testing**: Run against preview deployments on Vercel.

## Requirements

1.  Use `getByRole` and other resilient locators.
2.  Follow the Page Object Model if applicable.
3.  Ensure the test is independent and cleans up after itself.
4.  Configure base URL to support both local and CI environments:
    ```typescript
    // playwright.config.ts
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";
    ```
5.  Handle authentication state properly for Vercel preview deployments.

Output the TypeScript code for the test file.
