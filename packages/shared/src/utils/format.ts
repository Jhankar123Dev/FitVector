const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * Formats a date string or Date into a readable format.
 * @example formatDate('2024-03-15T10:30:00Z') => "Mar 15, 2024"
 * @example formatDate('2024-03-15T10:30:00Z', true) => "Mar 15, 2024, 10:30 AM"
 */
export function formatDate(date: string | Date, includeTime = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';
  return includeTime ? DATE_TIME_FORMATTER.format(d) : DATE_FORMATTER.format(d);
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Returns a human-readable relative time string (e.g. "3 hours ago", "in 2 days").
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';

  const now = Date.now();
  const diffSeconds = Math.round((now - d.getTime()) / 1000);
  const absDiff = Math.abs(diffSeconds);
  const isFuture = diffSeconds < 0;

  let value: number;
  let unit: string;

  if (absDiff < MINUTE) {
    return 'just now';
  } else if (absDiff < HOUR) {
    value = Math.floor(absDiff / MINUTE);
    unit = 'minute';
  } else if (absDiff < DAY) {
    value = Math.floor(absDiff / HOUR);
    unit = 'hour';
  } else if (absDiff < WEEK) {
    value = Math.floor(absDiff / DAY);
    unit = 'day';
  } else if (absDiff < MONTH) {
    value = Math.floor(absDiff / WEEK);
    unit = 'week';
  } else if (absDiff < YEAR) {
    value = Math.floor(absDiff / MONTH);
    unit = 'month';
  } else {
    value = Math.floor(absDiff / YEAR);
    unit = 'year';
  }

  const plural = value !== 1 ? 's' : '';
  return isFuture ? `in ${value} ${unit}${plural}` : `${value} ${unit}${plural} ago`;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  INR: '\u20B9',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '\u00A5',
};

/**
 * Formats a salary value or range into a readable string.
 * @example formatSalary(80000, 120000, 'USD') => "$80K - $120K"
 * @example formatSalary(50000, null, 'INR') => "₹50K"
 * @example formatSalary(null, null) => "Not disclosed"
 */
export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'USD',
): string {
  if (min == null && max == null) return 'Not disclosed';

  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency + ' ';

  const fmt = (val: number): string => {
    if (val >= 1_000_000) return `${symbol}${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${symbol}${Math.round(val / 1_000)}K`;
    return `${symbol}${val}`;
  };

  if (min != null && max != null) {
    if (min === max) return fmt(min);
    return `${fmt(min)} - ${fmt(max)}`;
  }

  if (min != null) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

/**
 * Formats a number with comma separators.
 * @example formatNumber(1234567) => "1,234,567"
 * @example formatNumber(1234567, true) => "1.2M"
 */
export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return String(value);
  }
  return new Intl.NumberFormat('en-US').format(value);
}
