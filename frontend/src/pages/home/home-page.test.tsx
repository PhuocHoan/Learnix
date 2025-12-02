import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as useAuthModule from '@/contexts/use-auth';

import { HomePage } from './home-page';

// Mock the courses API
vi.mock('@/features/courses/api/courses-api', () => ({
  coursesApi: {
    getAllCourses: vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          title: 'React Course',
          description: 'Learn React',
          level: 'beginner',
          price: 0,
          tags: ['react'],
          instructor: { fullName: 'John Doe' },
          thumbnailUrl: null,
        },
      ],
      meta: { total: 1, page: 1, limit: 6, totalPages: 1 },
    }),
    getTags: vi.fn().mockResolvedValue(['react', 'typescript', 'javascript']),
  },
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

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('renders hero section with title', async () => {
    renderWithProviders(<HomePage />);

    expect(
      await screen.findByRole('heading', {
        name: /Master New Skills with AI-Powered Learning/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders Browse Courses button', async () => {
    renderWithProviders(<HomePage />);

    expect(
      await screen.findByRole('link', { name: /Browse Courses/i }),
    ).toBeInTheDocument();
  });

  it('renders Get Started button for unauthenticated users', async () => {
    renderWithProviders(<HomePage />);

    expect(
      await screen.findByRole('link', { name: /Get Started Free/i }),
    ).toBeInTheDocument();
  });

  it('hides Get Started button for authenticated users', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { userId: '1', email: 'test@example.com', role: 'student' },
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithProviders(<HomePage />);

    // Wait for hero to render
    await screen.findByRole('heading', {
      name: /Master New Skills with AI-Powered Learning/i,
    });

    expect(
      screen.queryByRole('link', { name: /Get Started Free/i }),
    ).not.toBeInTheDocument();
  });

  it('renders categories section', async () => {
    renderWithProviders(<HomePage />);

    expect(
      await screen.findByRole('heading', { name: /Explore Categories/i }),
    ).toBeInTheDocument();
  });

  it('renders latest courses section', async () => {
    renderWithProviders(<HomePage />);

    expect(
      await screen.findByRole('heading', { name: /Latest Courses/i }),
    ).toBeInTheDocument();
  });

  it('renders View All Courses link or button', async () => {
    renderWithProviders(<HomePage />);

    // Wait for the page to load
    await screen.findByRole('heading', { name: /Latest Courses/i });

    // The "View All Courses" link is hidden on mobile (hidden md:flex), but there's a button for mobile
    // Check that at least one View All Courses element exists
    const viewAllElements = screen.getAllByText(/View All Courses/i);
    expect(viewAllElements.length).toBeGreaterThan(0);
  });

  it('displays loading state while fetching', () => {
    renderWithProviders(<HomePage />);

    // Check for loading skeletons (animate-pulse class)
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });
});
