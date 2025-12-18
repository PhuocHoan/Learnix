import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as useAuthModule from '@/contexts/use-auth';

import { CoursesPage } from './courses-page';

// Mock the courses API
const mockGetAllCourses = vi.fn();
const mockGetTags = vi
  .fn()
  .mockResolvedValue(['react', 'typescript', 'javascript']);
const mockGetEnrolledCourses = vi.fn().mockResolvedValue([]);

vi.mock('@/features/courses/api/courses-api', () => ({
  coursesApi: {
    getAllCourses: (...args: unknown[]) => mockGetAllCourses(...args),
    getTags: () => mockGetTags(),
    getEnrolledCourses: () => mockGetEnrolledCourses(),
  },
}));

// Mock useInView from react-intersection-observer
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: vi.fn(), inView: false }),
}));

// Mock useAuth
vi.mock('@/contexts/use-auth', () => ({
  useAuth: vi.fn(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
};

describe('CoursesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllCourses.mockResolvedValue({
      data: [
        {
          id: '1',
          title: 'React Fundamentals',
          description: 'Learn React from scratch',
          level: 'beginner',
          price: 0,
          tags: ['react', 'javascript'],
          instructor: { id: 'inst-1', fullName: 'John Doe' },
          thumbnailUrl: null,
          studentCount: 100,
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Advanced TypeScript',
          description: 'Master TypeScript',
          level: 'advanced',
          price: 49.99,
          tags: ['typescript'],
          instructor: { id: 'inst-2', fullName: 'Jane Smith' },
          thumbnailUrl: null,
          studentCount: 50,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { total: 2, page: 1, limit: 9, totalPages: 1 },
    });

    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('renders page title', async () => {
    renderWithProviders(<CoursesPage />);

    expect(
      await screen.findByRole('heading', { name: /Browse Courses/i }),
    ).toBeInTheDocument();
  });

  it('renders filter controls', async () => {
    renderWithProviders(<CoursesPage />);

    expect(
      await screen.findByPlaceholderText(/Search by title/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Type tag & press Enter/i),
    ).toBeInTheDocument();
  });

  it('renders course cards after loading', async () => {
    renderWithProviders(<CoursesPage />);

    expect(await screen.findByText('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument();
  });

  it('displays course instructor names', async () => {
    renderWithProviders(<CoursesPage />);

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays course prices correctly', async () => {
    renderWithProviders(<CoursesPage />);

    expect(await screen.findByText(/Free/i)).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
  });

  it('displays course levels', async () => {
    renderWithProviders(<CoursesPage />);

    const beginnerElements = await screen.findAllByText(/beginner/i);
    expect(beginnerElements.length).toBeGreaterThan(0);

    const advancedElements = await screen.findAllByText(/advanced/i);
    expect(advancedElements.length).toBeGreaterThan(0);
  });

  it('allows searching courses', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CoursesPage />);

    const searchInput = await screen.findByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'react');

    expect(searchInput).toHaveValue('react');
  });

  it('allows adding tags', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CoursesPage />);

    // Wait for page to load
    await screen.findByText('React Fundamentals');

    const tagInput = screen.getByPlaceholderText(/Type tag & press Enter/i);
    await user.type(tagInput, 'newtag{Enter}');

    // Tag should appear as a badge
    expect(await screen.findByText('newtag')).toBeInTheDocument();
    // Clear all button should also appear
    expect(screen.getByText(/Clear all/i)).toBeInTheDocument();
  });

  it('allows selecting difficulty level', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CoursesPage />);

    // Wait for courses to load first
    await screen.findByText('React Fundamentals');

    const levelSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(levelSelect, 'beginner');

    expect(levelSelect).toHaveValue('beginner');
  });

  it('allows changing sort order', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CoursesPage />);

    // Wait for courses to load first
    await screen.findByText('React Fundamentals');

    const sortSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(sortSelect, 'price-ASC');

    expect(sortSelect).toHaveValue('price-ASC');
  });

  it('shows loading skeletons initially', () => {
    renderWithProviders(<CoursesPage />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows no results message when no courses match', async () => {
    mockGetAllCourses.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 9, totalPages: 0 },
    });

    renderWithProviders(<CoursesPage />);

    expect(
      await screen.findByText(/No courses found matching your criteria/i),
    ).toBeInTheDocument();
  });

  it('allows removing added tags', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CoursesPage />);

    // Wait for page to load
    await screen.findByText('React Fundamentals');

    const tagInput = screen.getByPlaceholderText(/Type tag & press Enter/i);
    await user.type(tagInput, 'mytag{Enter}');

    // Tag should appear
    expect(await screen.findByText('mytag')).toBeInTheDocument();

    // Find and click clear all button (it's a button element, not with role)
    const clearButton = screen.getByText(/Clear all/i);
    await user.click(clearButton);

    // Tag should be removed
    await waitFor(() => {
      expect(screen.queryByText('mytag')).not.toBeInTheDocument();
    });
  });
});
