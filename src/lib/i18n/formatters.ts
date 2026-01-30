import { useTranslation } from 'react-i18next';
import logger from '@/utils/logger';

/**
 * Custom hook providing locale-aware formatting utilities
 *
 * Provides formatters for:
 * - Dates (short, long, full formats)
 * - Times
 * - Currency (with automatic locale detection)
 * - Numbers (with decimal precision)
 * - Distance (with metric/imperial conversion)
 * - Relative time (e.g., "2 hours ago")
 * - File sizes
 * - Percentages
 *
 * All formatters respect the current i18n language setting
 *
 * @example
 * ```tsx
 * const { formatDate, formatCurrency, formatDistance } = useFormatters();
 *
 * formatDate(new Date(), 'long'); // "December 31, 2025"
 * formatCurrency(1234.56, 'USD'); // "$1,234.56"
 * formatDistance(5000); // "3.1 mi" (en-US) or "5.0 km" (fr-FR)
 * ```
 */
export function useFormatters() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  /**
   * Format a date according to the current locale
   */
  const formatDate = (
    date: Date | string | number,
    format: 'short' | 'long' | 'full' = 'short'
  ): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }

    const options: Record<string, Intl.DateTimeFormatOptions> = {
      short: { year: 'numeric', month: 'numeric', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    };

    try {
      return new Intl.DateTimeFormat(locale, options[format]).format(d);
    } catch (error) {
      logger.error('Date formatting error:', error);
      return d.toLocaleDateString();
    }
  };

  /**
   * Format a time according to the current locale
   */
  const formatTime = (
    date: Date | string | number,
    includeSeconds = false
  ): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
      return 'Invalid Time';
    }

    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      ...(includeSeconds && { second: 'numeric' }),
    };

    try {
      return new Intl.DateTimeFormat(locale, options).format(d);
    } catch (error) {
      logger.error('Time formatting error:', error);
      return d.toLocaleTimeString();
    }
  };

  /**
   * Format date and time together
   */
  const formatDateTime = (
    date: Date | string | number,
    dateFormat: 'short' | 'long' | 'full' = 'short',
    includeSeconds = false
  ): string => {
    return `${formatDate(date, dateFormat)} ${formatTime(date, includeSeconds)}`;
  };

  /**
   * Format currency according to the current locale
   */
  const formatCurrency = (
    amount: number,
    currency: string = 'USD',
    minimumFractionDigits?: number
  ): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: minimumFractionDigits ?? 2,
        maximumFractionDigits: minimumFractionDigits ?? 2,
      }).format(amount);
    } catch (error) {
      logger.error('Currency formatting error:', error);
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  /**
   * Format a number according to the current locale
   */
  const formatNumber = (
    num: number,
    decimals = 0,
    options?: Intl.NumberFormatOptions
  ): string => {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        ...options,
      }).format(num);
    } catch (error) {
      logger.error('Number formatting error:', error);
      return num.toFixed(decimals);
    }
  };

  /**
   * Format distance (meters) with automatic unit conversion
   * Converts to miles for en-US, kilometers for others
   */
  const formatDistance = (meters: number, precision = 1): string => {
    const useMetric = !locale.startsWith('en-US');

    if (useMetric) {
      const km = meters / 1000;
      return `${formatNumber(km, precision)} km`;
    } else {
      const miles = meters / 1609.34;
      return `${formatNumber(miles, precision)} mi`;
    }
  };

  /**
   * Format relative time (e.g., "2 hours ago", "in 3 days")
   */
  const formatRelativeTime = (date: Date | string | number): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }

    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      const diff = d.getTime() - Date.now();
      const diffSeconds = Math.round(diff / 1000);
      const diffMinutes = Math.round(diffSeconds / 60);
      const diffHours = Math.round(diffMinutes / 60);
      const diffDays = Math.round(diffHours / 24);

      // Choose appropriate unit
      if (Math.abs(diffSeconds) < 60) {
        return rtf.format(diffSeconds, 'second');
      }
      if (Math.abs(diffMinutes) < 60) {
        return rtf.format(diffMinutes, 'minute');
      }
      if (Math.abs(diffHours) < 24) {
        return rtf.format(diffHours, 'hour');
      }
      if (Math.abs(diffDays) < 30) {
        return rtf.format(diffDays, 'day');
      }

      const diffMonths = Math.round(diffDays / 30);
      if (Math.abs(diffMonths) < 12) {
        return rtf.format(diffMonths, 'month');
      }

      const diffYears = Math.round(diffMonths / 12);
      return rtf.format(diffYears, 'year');
    } catch (error) {
      logger.error('Relative time formatting error:', error);
      return formatDate(d, 'short');
    }
  };

  /**
   * Format file size in human-readable format
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${formatNumber(bytes / Math.pow(k, i), 2)} ${units[i]}`;
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number, decimals = 0): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    } catch (error) {
      logger.error('Percentage formatting error:', error);
      return `${(value * 100).toFixed(decimals)}%`;
    }
  };

  /**
   * Format compact number (e.g., 1.2K, 3.4M)
   */
  const formatCompactNumber = (num: number): string => {
    try {
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(num);
    } catch (error) {
      logger.error('Compact number formatting error:', error);
      return formatNumber(num);
    }
  };

  /**
   * Format duration in milliseconds to human-readable format
   */
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  /**
   * Format list of items according to locale
   */
  const formatList = (
    items: string[],
    type: 'conjunction' | 'disjunction' = 'conjunction'
  ): string => {
    try {
      return new Intl.ListFormat(locale, {
        style: 'long',
        type,
      }).format(items);
    } catch (error) {
      logger.error('List formatting error:', error);
      return items.join(', ');
    }
  };

  /**
   * Get the currency symbol for a given currency code
   */
  const getCurrencySymbol = (currency: string = 'USD'): string => {
    try {
      return (
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
          .format(0)
          .replace(/\d/g, '')
          .trim() || currency
      );
    } catch (error) {
      return currency;
    }
  };

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatCurrency,
    formatNumber,
    formatDistance,
    formatRelativeTime,
    formatFileSize,
    formatPercentage,
    formatCompactNumber,
    formatDuration,
    formatList,
    getCurrencySymbol,
    locale,
  };
}

/**
 * Standalone formatter functions (non-hook versions)
 * Useful for use outside of React components
 */
export const formatters = {
  formatDate: (
    date: Date | string | number,
    locale: string,
    format: 'short' | 'long' | 'full' = 'short'
  ): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const options: Record<string, Intl.DateTimeFormatOptions> = {
      short: { year: 'numeric', month: 'numeric', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    };
    return new Intl.DateTimeFormat(locale, options[format]).format(d);
  },

  formatCurrency: (amount: number, locale: string, currency = 'USD'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  },

  formatNumber: (num: number, locale: string, decimals = 0): string => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  },
};
