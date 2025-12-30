/**
 * XSS Sanitization Utilities
 * Frontend Security - Task 2/8
 * Fortune 50 Security Standards
 */

import DOMPurify from 'dompurify';

import logger from '@/utils/logger';
/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Untrusted HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(dirty: string, options?: Partial<DOMPurify.Config>): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  const config: DOMPurify.Config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: true,
    ...(options || {}),
  };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize user input for display (strict mode)
 * @param input - User-provided string
 * @returns Sanitized string with no HTML tags
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 * @param url - URL string to sanitize
 * @returns Sanitized URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim().toLowerCase();

  // Block javascript: and data: URIs
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
    logger.warn('Blocked potentially malicious URL:', url);
    return '';
  }

  // Only allow http, https, and relative URLs
  if (!trimmed.match(/^(https?:\/\/|\/)/)) {
    logger.warn('Blocked non-HTTP URL:', url);
    return '';
  }

  return url;
}

/**
 * Escape HTML entities in a string
 * @param unsafe - String containing potentially unsafe HTML
 * @returns String with HTML entities escaped
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') {
    return '';
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize JSON string to prevent injection
 * @param jsonString - JSON string to sanitize
 * @returns Parsed and re-stringified safe JSON or null
 */
export function sanitizeJson(jsonString: string): string | null {
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch (error) {
    logger.error('Invalid JSON:', error);
    return null;
  }
}
