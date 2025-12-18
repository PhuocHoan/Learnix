import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { coursesApi } from '@/features/courses/api/courses-api';

import CourseEditorPage from './course-editor-page';

// Mock API
vi.mock('@/features/courses/api/courses-api', () => ({
  coursesApi: {
    getCourse: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    createSection: vi.fn(),
    createLesson: vi.fn(),
    getTags: vi.fn(),
  },
}));

// Mock BlockEditor since it might be complex
vi.mock('@/components/instructor/block-editor', () => ({
  BlockEditor: () => <div data-testid="block-editor">Block Editor</div>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function renderCourseEditor(courseId?: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          courseId
            ? `/instructor/courses/${courseId}`
            : '/instructor/courses/new',
        ]}
      >
        <Routes>
          <Route
            path="/instructor/courses/new"
            element={<CourseEditorPage />}
          />
          <Route
            path="/instructor/courses/:courseId"
            element={<CourseEditorPage />}
          />
          <Route
            path="/instructor/courses/:courseId/edit"
            element={<CourseEditorPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CourseEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (coursesApi.getTags as any).mockResolvedValue(['react', 'typescript']);
  });

  it('renders create course form when no courseId provided', () => {
    renderCourseEditor();
    expect(screen.getByText(/Create New Course/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
  });

  it('renders edit course form when courseId provided', async () => {
    const mockCourse = {
      id: '123',
      title: 'Existing Course',
      description: 'Description',
      level: 'beginner',
      price: 0,
      sections: [],
    };
    (coursesApi.getCourse as any).mockResolvedValue(mockCourse);

    renderCourseEditor('123');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Course')).toBeInTheDocument();
    });
  });

  it('submits new course', async () => {
    (coursesApi.createCourse as any).mockResolvedValue({ id: 'new-id' });
    renderCourseEditor();

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'New Course' },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'New Description' },
    });
    // Assuming level is a select or radio, might need specific interaction
    // For now, let's assume defaults or simple inputs work for the test skeleton

    const saveButton = screen.getByRole('button', { name: /Create Course/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(coursesApi.createCourse).toHaveBeenCalled();
    });
  });
});
