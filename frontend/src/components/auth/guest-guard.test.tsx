import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { GuestGuard } from './guest-guard';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/contexts/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

function TestComponent() {
  return <div data-testid="guest-content">Guest Content</div>;
}

function DashboardComponent() {
  return <div data-testid="dashboard">Dashboard</div>;
}

function renderWithRouter(initialRoute = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestGuard>
              <TestComponent />
            </GuestGuard>
          }
        />
        <Route path="/dashboard" element={<DashboardComponent />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GuestGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithRouter();

    expect(screen.getByTestId('guest-content')).toBeInTheDocument();
  });

  it('redirects to dashboard when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    renderWithRouter();

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('guest-content')).not.toBeInTheDocument();
  });

  it('shows loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    renderWithRouter();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Learnix')).toBeInTheDocument();
    expect(screen.queryByTestId('guest-content')).not.toBeInTheDocument();
  });

  it('does not render children during loading state', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: true,
    });

    renderWithRouter();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('guest-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });
});
