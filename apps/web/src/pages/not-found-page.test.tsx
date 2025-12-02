import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import { NotFoundPage } from './not-found-page';

function renderNotFoundPage() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  it('renders 404 badge', () => {
    renderNotFoundPage();

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders page not found heading', () => {
    renderNotFoundPage();

    expect(
      screen.getByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument();
  });

  it('renders descriptive message', () => {
    renderNotFoundPage();

    expect(
      screen.getByText(/the page you're looking for doesn't exist/i),
    ).toBeInTheDocument();
  });

  it('renders Go Back Home link', () => {
    renderNotFoundPage();

    const homeLink = screen.getByRole('link', { name: /go back home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders Dashboard link', () => {
    renderNotFoundPage();

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('renders Learnix branding', () => {
    renderNotFoundPage();

    expect(screen.getByText('Learnix')).toBeInTheDocument();
  });
});
