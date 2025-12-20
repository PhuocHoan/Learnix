import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date/time relative to now (e.g., "2 hours ago", "3 days ago")
 * Automatically handles timezone by comparing with local time
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();

  // Calculate difference in milliseconds (timezone is handled automatically)
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  }
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  }
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}

/**
 * Format a date for display (e.g., "Dec 2024", "January 15, 2024")
 * Uses the user's local timezone
 */
export function formatDate(
  dateString: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    year: 'numeric',
  };
  return date.toLocaleDateString(undefined, options ?? defaultOptions);
}

/**
 * Format a date with time (e.g., "Dec 1, 2024 at 3:45 PM")
 * Uses the user's local timezone
 */
export function formatDateTime(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a date as "Last updated [date]" with smart display
 */
export function formatLastUpdated(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    return 'Updated today';
  }
  if (diffDays < 7) {
    return `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Updated ${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  return `Last updated ${formatDate(date)}`;
}

/**
 * Format student count with proper pluralization and abbreviation
 */
export function formatStudentCount(count: number): string {
  if (count === 0) {
    return 'No students yet';
  }
  if (count === 1) {
    return '1 student';
  }
  if (count < 1000) {
    return `${count} students`;
  }
  if (count < 10000) {
    return `${(count / 1000).toFixed(1)}K students`;
  }
  if (count < 1000000) {
    return `${Math.floor(count / 1000)}K students`;
  }
  return `${(count / 1000000).toFixed(1)}M students`;
}
/**
 * Simple URL format validation
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Check if a URL is reachable (best effort due to CORS)
 */
export async function validateUrlReachability(url: string): Promise<{
  reachable: boolean;
  message?: string;
}> {
  if (!isValidUrl(url)) {
    return { reachable: false, message: 'Invalid URL format' };
  }

  try {
    // We use mode: 'no-cors' because most external sites block cross-origin HEAD requests.
    // This won't let us see the status code (404 etc), but it will throw if the domain/IP is dead.
    await fetch(url, { method: 'GET', mode: 'no-cors' });
    return { reachable: true };
  } catch (_e) {
    return { reachable: false, message: 'Link is unreachable or corrupted' };
  }
}

/**
 * Extract YouTube video ID from URL
 */
export function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = regExp.exec(url);
  return match?.[2].length === 11 ? match[2] : null;
}

/**
 * Extract Vimeo video ID from URL
 */
export function getVimeoId(url: string): string | null {
  if (!url) {
    return null;
  }
  try {
    const urlObj = new URL(url);
    const allowedHosts = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];
    if (!allowedHosts.includes(urlObj.hostname)) {
      return null;
    }
    const parts = urlObj.pathname.split('/');
    // Find the last numeric segment in the path by reversing and finding
    const numericPart = [...parts].reverse().find((part) => /^\d+$/.test(part));
    if (numericPart) {
      return numericPart;
    }
  } catch {
    const match = /vimeo\.com\/(\d+)/.exec(url);
    return match ? match[1] : null;
  }
  return null;
}
