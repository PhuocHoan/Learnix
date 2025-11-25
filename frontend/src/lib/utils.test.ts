import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const shouldHide = false;
    const shouldShow = true;
    expect(cn('base', shouldHide && 'hidden', shouldShow && 'visible')).toBe('base visible');
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
