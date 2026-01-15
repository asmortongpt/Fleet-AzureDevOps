/**
 * @file logSanitizer.ts
 * @description Provides functions to sanitize logs by redacting PII.
 */

interface LogData {
  email?: string;
  phone?: string;
  [key: string]: any;
}

/**
 * Masks an email address to protect PII.
 * @param email - The email address to mask.
 * @returns The masked email address.
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  return `${localPart[0]}***@${domain}`;
}

/**
 * Sanitizes log data by redacting PII.
 * @param data - The log data to sanitize.
 * @returns The sanitized log data.
 */
export function sanitizeForLogging(data: LogData): LogData {
  return {
    ...data,
    email: data.email ? maskEmail(data.email) : undefined,
    phone: data.phone ? '***-***-' + data.phone.slice(-4) : undefined,
  };
}