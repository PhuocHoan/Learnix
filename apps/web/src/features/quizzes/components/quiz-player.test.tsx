import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QuizPlayer } from './quiz-player';
import { quizzesApi } from '../api/quizzes-api';

// Mock the API
vi.mock('../api/quizzes-api', () => ({
  quizzesApi: {
    getSubmission: vi.fn(),
    saveProgress: vi.fn(),
    submitQuiz: vi.fn(),
  },
}));

const mockQuiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  questions: [
    {
      id: 'q1',
      questionText: 'Question 1',
      options: ['A', 'B', 'C', 'D'],
      points: 1,
    },
    {
      id: 'q2',
      questionText: 'Question 2',
      options: ['Yes', 'No'],
      points: 1,
    },
  ],
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function renderQuizPlayer(props: any = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <QuizPlayer quiz={mockQuiz} {...props} />
    </QueryClientProvider>,
  );
}

describe('QuizPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (quizzesApi.getSubmission as any).mockResolvedValue({});
    (quizzesApi.saveProgress as any).mockResolvedValue({});
    (quizzesApi.submitQuiz as any).mockResolvedValue({});
  });

  it('renders the first question', () => {
    renderQuizPlayer();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
  });

  it('navigates to next question', () => {
    renderQuizPlayer();

    // Select the first option (A)
    const options = screen.getAllByRole('radio');
    fireEvent.click(options[0]);

    // Click Next
    fireEvent.click(screen.getByText(/Next/i));

    expect(screen.getByText('Question 2')).toBeInTheDocument();
  });
  it('submits the quiz', async () => {
    const onComplete = vi.fn();
    renderQuizPlayer({ onComplete });

    // Answer Q1: Select first option
    let options = screen.getAllByRole('radio');
    fireEvent.click(options[0]);
    fireEvent.click(screen.getByText(/Next/i));

    // Answer Q2: Select first option
    options = screen.getAllByRole('radio');
    fireEvent.click(options[0]);
    fireEvent.click(screen.getByText(/Complete Quiz/i));

    await waitFor(() => {
      expect(quizzesApi.submitQuiz).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
