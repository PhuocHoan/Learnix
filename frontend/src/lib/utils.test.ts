import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  cn,
  formatRelativeTime,
  formatDate,
  formatDateTime,
  formatLastUpdated,
  formatStudentCount,
} from './utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const shouldHide = false;
    const shouldShow = true;
    expect(cn('base', shouldHide && 'hidden', shouldShow && 'visible')).toBe(
      'base visible',
    );
  });

  it('merges tailwind classes correctly', () => {
    // tw-merge should handle conflicting classes
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('handles empty strings', () => {
    expect(cn('base', '', 'end')).toBe('base end');
  });

  it('handles array of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles object syntax', () => {
    expect(cn({ hidden: true, visible: false })).toBe('hidden');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for recent times', () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString())).toBe('Just now');
  });

  it('formats minutes ago correctly', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('formats single minute correctly', () => {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('formats hours ago correctly', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
  });

  it('formats days ago correctly', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago');
  });

  it('formats weeks ago correctly', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('formats months ago correctly', () => {
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeMonthsAgo)).toBe('3 months ago');
  });

  it('formats years ago correctly', () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoYearsAgo)).toBe('2 years ago');
  });

  it('handles Date object input', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe('5 minutes ago');
  });
});

describe('formatDate', () => {
  it('formats date with default options', () => {
    const result = formatDate('2024-06-15T12:00:00Z');
    expect(result).toMatch(/Jun|June/);
    expect(result).toContain('2024');
  });

  it('formats date with custom options', () => {
    const result = formatDate('2024-06-15T12:00:00Z', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    expect(result).toMatch(/June|Jun/);
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('handles Date object input', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const result = formatDate(date);
    expect(result).toMatch(/Jun|June/);
  });
});

describe('formatDateTime', () => {
  it('formats date with time', () => {
    const result = formatDateTime('2024-06-15T15:45:00Z');
    expect(result).toMatch(/Jun|June/);
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('handles Date object input', () => {
    const date = new Date('2024-06-15T15:45:00Z');
    const result = formatDateTime(date);
    expect(result).toBeTruthy();
  });
});

describe('formatLastUpdated', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Updated today" for same day', () => {
    const today = new Date();
    expect(formatLastUpdated(today)).toBe('Updated today');
  });

  it('returns days ago for recent updates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatLastUpdated(threeDaysAgo)).toBe('Updated 3 days ago');
  });

  it('returns weeks ago for updates within a month', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    expect(formatLastUpdated(twoWeeksAgo)).toBe('Updated 2 weeks ago');
  });

  it('returns formatted date for older updates', () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const result = formatLastUpdated(twoMonthsAgo);
    expect(result).toMatch(/Last updated/);
  });
});

describe('formatStudentCount', () => {
  it('returns "No students yet" for zero', () => {
    expect(formatStudentCount(0)).toBe('No students yet');
  });

  it('returns "1 student" for single student', () => {
    expect(formatStudentCount(1)).toBe('1 student');
  });

  it('returns count with students for small numbers', () => {
    expect(formatStudentCount(50)).toBe('50 students');
    expect(formatStudentCount(999)).toBe('999 students');
  });

  it('formats thousands with K suffix', () => {
    expect(formatStudentCount(1500)).toBe('1.5K students');
    expect(formatStudentCount(5000)).toBe('5.0K students');
  });

  it('formats large thousands without decimal', () => {
    expect(formatStudentCount(15000)).toBe('15K students');
    expect(formatStudentCount(999999)).toBe('999K students');
  });

  it('formats millions with M suffix', () => {
    expect(formatStudentCount(1500000)).toBe('1.5M students');
  });
});
