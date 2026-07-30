import { formatBytes, formatCurrency, formatRelativeTime } from '@/lib/format';

describe('formatCurrency', () => {
  it('formats a number as a two-decimal dollar string', () => {
    expect(formatCurrency(4)).toBe('$4.00');
    expect(formatCurrency(4.5)).toBe('$4.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatBytes', () => {
  it('formats bytes below 1024 as B', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for timestamps within the last few seconds', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('formats a past timestamp in minutes', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(formatRelativeTime(tenMinutesAgo)).toBe('10 minutes ago');
  });

  it('formats a past timestamp in hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
  });

  it('formats a future timestamp', () => {
    const inFiveMinutes = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(inFiveMinutes)).toBe('in 5 minutes');
  });

  it('uses singular units for a value of exactly 1', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
  });
});
