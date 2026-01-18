/**
 * Date formatting utilities
 */

export type DateFormat = 'short' | 'medium' | 'long' | 'full' | 'relative' | 'iso';

export interface DateFormatOptions {
  format?: DateFormat;
  locale?: string;
  timezone?: string;
}

export interface RelativeTimeUnit {
  unit: Intl.RelativeTimeFormatUnit;
  value: number;
  threshold: number;
}

const RELATIVE_TIME_UNITS: RelativeTimeUnit[] = [
  { unit: 'year', value: 31536000000, threshold: 31536000000 },
  { unit: 'month', value: 2592000000, threshold: 2592000000 },
  { unit: 'week', value: 604800000, threshold: 604800000 },
  { unit: 'day', value: 86400000, threshold: 86400000 },
  { unit: 'hour', value: 3600000, threshold: 3600000 },
  { unit: 'minute', value: 60000, threshold: 60000 },
  { unit: 'second', value: 1000, threshold: 1000 }
];

/**
 * Format a date according to the specified format
 */
export function formatDate(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const { format = 'medium', locale = 'en-US', timezone } = options;
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  const formatOptions: Intl.DateTimeFormatOptions = timezone ? { timeZone: timezone } : {};

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString(locale, {
        ...formatOptions,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

    case 'medium':
      return dateObj.toLocaleDateString(locale, {
        ...formatOptions,
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

    case 'long':
      return dateObj.toLocaleDateString(locale, {
        ...formatOptions,
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    case 'full':
      return dateObj.toLocaleDateString(locale, {
        ...formatOptions,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    case 'relative':
      return formatRelativeTime(dateObj, locale);

    case 'iso':
      return dateObj.toISOString();

    default:
      return dateObj.toLocaleDateString(locale, formatOptions);
  }
}

/**
 * Format a date with time
 */
export function formatDateTime(
  date: Date | string | number,
  options: DateFormatOptions & { includeSeconds?: boolean } = {}
): string {
  const { format = 'medium', locale = 'en-US', timezone, includeSeconds = false } = options;
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    ...(timezone ? { timeZone: timezone } : {}),
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {})
  };

  switch (format) {
    case 'short':
      return dateObj.toLocaleString(locale, {
        ...formatOptions,
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      });

    case 'medium':
      return dateObj.toLocaleString(locale, {
        ...formatOptions,
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

    case 'long':
      return dateObj.toLocaleString(locale, {
        ...formatOptions,
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    case 'full':
      return dateObj.toLocaleString(locale, {
        ...formatOptions,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    case 'iso':
      return dateObj.toISOString();

    default:
      return dateObj.toLocaleString(locale, formatOptions);
  }
}

/**
 * Format time only
 */
export function formatTime(
  date: Date | string | number,
  options: { locale?: string; includeSeconds?: boolean; use24Hour?: boolean } = {}
): string {
  const { locale = 'en-US', includeSeconds = false, use24Hour = false } = options;
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  return dateObj.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: !use24Hour
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'en-US'
): string {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  const now = new Date();
  const diff = dateObj.getTime() - now.getTime();
  const absDiff = Math.abs(diff);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const { unit, value } of RELATIVE_TIME_UNITS) {
    if (absDiff >= value) {
      const unitValue = Math.round(diff / value);
      return rtf.format(unitValue, unit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Get the difference between two dates in a specific unit
 */
export function getDateDifference(
  date1: Date | string | number,
  date2: Date | string | number,
  unit: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' = 'days'
): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new Error('Invalid date provided');
  }

  const diff = Math.abs(d1.getTime() - d2.getTime());

  switch (unit) {
    case 'years':
      return diff / (1000 * 60 * 60 * 24 * 365);
    case 'months':
      return diff / (1000 * 60 * 60 * 24 * 30);
    case 'weeks':
      return diff / (1000 * 60 * 60 * 24 * 7);
    case 'days':
      return diff / (1000 * 60 * 60 * 24);
    case 'hours':
      return diff / (1000 * 60 * 60);
    case 'minutes':
      return diff / (1000 * 60);
    case 'seconds':
      return diff / 1000;
  }
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string | number): boolean {
  const dateObj = new Date(date);
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  const dateObj = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date | string | number): boolean {
  const dateObj = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    dateObj.getDate() === tomorrow.getDate() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  return new Date(date).getTime() < Date.now();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  return new Date(date).getTime() > Date.now();
}

/**
 * Add time to a date
 */
export function addTime(
  date: Date | string | number,
  amount: number,
  unit: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds'
): Date {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  switch (unit) {
    case 'years':
      dateObj.setFullYear(dateObj.getFullYear() + amount);
      break;
    case 'months':
      dateObj.setMonth(dateObj.getMonth() + amount);
      break;
    case 'weeks':
      dateObj.setDate(dateObj.getDate() + amount * 7);
      break;
    case 'days':
      dateObj.setDate(dateObj.getDate() + amount);
      break;
    case 'hours':
      dateObj.setHours(dateObj.getHours() + amount);
      break;
    case 'minutes':
      dateObj.setMinutes(dateObj.getMinutes() + amount);
      break;
    case 'seconds':
      dateObj.setSeconds(dateObj.getSeconds() + amount);
      break;
  }

  return dateObj;
}

/**
 * Get the start of a time period
 */
export function startOf(
  date: Date | string | number,
  unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute'
): Date {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  switch (unit) {
    case 'year':
      return new Date(dateObj.getFullYear(), 0, 1);
    case 'month':
      return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    case 'week':
      const day = dateObj.getDay();
      const diff = dateObj.getDate() - day;
      return new Date(dateObj.setDate(diff));
    case 'day':
      return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    case 'hour':
      return new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
        dateObj.getHours()
      );
    case 'minute':
      return new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
        dateObj.getHours(),
        dateObj.getMinutes()
      );
  }
}

/**
 * Get the end of a time period
 */
export function endOf(
  date: Date | string | number,
  unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute'
): Date {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }

  switch (unit) {
    case 'year':
      return new Date(dateObj.getFullYear(), 11, 31, 23, 59, 59, 999);
    case 'month':
      return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0, 23, 59, 59, 999);
    case 'week':
      const day = dateObj.getDay();
      const diff = dateObj.getDate() - day + 6;
      return new Date(dateObj.getFullYear(), dateObj.getMonth(), diff, 23, 59, 59, 999);
    case 'day':
      return new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
        23,
        59,
        59,
        999
      );
    case 'hour':
      return new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
        dateObj.getHours(),
        59,
        59,
        999
      );
    case 'minute':
      return new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
        dateObj.getHours(),
        dateObj.getMinutes(),
        59,
        999
      );
  }
}