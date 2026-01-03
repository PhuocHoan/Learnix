import { test, expect } from '@playwright/test';

test.describe('Embedded IDE', () => {
  const courseId = 'ide-course-123';
  const lessonId = 'ide-lesson-456';

  test.beforeEach(async ({ page }) => {
    // Mock Auth (User is logged in)
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'student',
        }),
      });
    });

    // Mock Course with IDE Lesson
    await page.route(`**/courses/${courseId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: courseId,
          title: 'Python Masterclass',
          description: 'Learn Python',
          level: 'beginner',
          instructor: { id: 'inst-1', fullName: 'Guido van Rossum' },
          sections: [
            {
              id: 'sec-1',
              title: 'Introduction',
              orderIndex: 0,
              lessons: [
                {
                  id: lessonId,
                  title: 'First Python Program',
                  type: 'standard',
                  orderIndex: 0,
                  content: [
                    {
                      id: 'block-1',
                      type: 'text',
                      content:
                        'Use the IDE below to write your first Python program.',
                      orderIndex: 0,
                    },
                  ],
                  // IDE Configuration
                  ideConfig: {
                    defaultLanguage: 'python',
                    allowedLanguages: [
                      {
                        language: 'python',
                        initialCode: 'print("Hello from IDE")',
                        expectedOutput: 'Hello from IDE',
                      },
                      {
                        language: 'javascript',
                        initialCode: 'console.log("Hello JS")',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      });
    });

    // Mock Enrollment (User has access)
    await page.route(`**/courses/${courseId}/enrollment`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isEnrolled: true,
          hasAccess: true, // Crucial for viewing lesson
          progress: {
            id: 'prog-1',
            completedLessonIds: [],
            lastAccessedAt: new Date().toISOString(),
          },
        }),
      });
    });

    // Mock Code Execution
    await page.route('**/code-execution/run', async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');

      // Basic validation of request
      if (postData.language === 'python') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            stdout: 'Hello from IDE\n',
            stderr: '',
            code: 0,
            output: 'Hello from IDE\n',
          }),
        });
      } else {
        await route.fulfill({ status: 400 });
      }
    });

    // Mock Lesson Completion
    await page.route(
      `**/courses/${courseId}/lessons/${lessonId}/complete`,
      async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Lesson completed' }),
        });
      },
    );
  });

  test('should render IDE and execute code successfully', async ({
    page,
    isMobile,
  }) => {
    // Navigate to the lesson page
    await page.goto(`/courses/${courseId}/learn?lesson=${lessonId}`);

    // verify title - always visible on both mobile and desktop
    await expect(
      page.getByRole('heading', { name: 'First Python Program' }),
    ).toBeVisible();

    // Verify lesson content is visible
    await expect(
      page.getByText('Use the IDE below to write your first Python program.'),
    ).toBeVisible();

    // IDE is only visible on desktop (lg breakpoint = 1024px)
    // On mobile, the IDE panel is intentionally hidden (hidden lg:block in CSS)
    if (isMobile) {
      // On mobile: verify course content sidebar is accessible
      const sidebarContent = page.getByText('Course Content');
      await expect(sidebarContent).toBeVisible();

      // Verify the lesson appears in the sidebar as a button
      await expect(
        page.getByRole('button', { name: /First Python Program/i }),
      ).toBeVisible();
    } else {
      // On desktop: verify IDE components
      const runButton = page.getByRole('button', { name: 'Run' });
      await expect(runButton).toBeVisible();
      await expect(runButton).toBeEnabled();

      // Check for Language Selector
      const langTrigger = page.getByRole('combobox');
      await expect(langTrigger).toBeVisible();
      await expect(langTrigger).toHaveText(/python/i);

      // Run the code
      await runButton.click();

      // Verify Output (target the output container div specifically)
      await expect(
        page
          .locator('.whitespace-pre-wrap')
          .filter({ hasText: 'Hello from IDE' }),
      ).toBeVisible();
      await expect(page.getByText('SUCCESS', { exact: true })).toBeVisible();
    }
  });
});
