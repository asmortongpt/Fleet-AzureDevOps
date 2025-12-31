/**
 * Enhanced Input Sanitization
 * Comprehensive sanitization to prevent XSS, SQL injection, and other attacks
 *
 * @module security/sanitize
 */

import DOMPurify from 'dompurify';

/**
 * HTML Sanitization Options
 */
export interface HTMLSanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedSchemes?: string[];
  stripIgnoreTag?: boolean;
  stripIgnoreTagBody?: boolean;
}

/**
 * Default allowed HTML tags (whitelist)
 */
const DEFAULT_ALLOWED_TAGS = [
  'b',
  'i',
  'em',
  'strong',
  'u',
  'a',
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'code',
  'pre',
  'span',
  'div',
];

/**
 * Default allowed HTML attributes (whitelist)
 */
const DEFAULT_ALLOWED_ATTRIBUTES = ['href', 'target', 'rel', 'class', 'id', 'title'];

/**
 * Default allowed URL schemes (whitelist)
 */
const DEFAULT_ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];

/**
 * Sanitize HTML content using DOMPurify
 */
export function sanitizeHTML(
  dirty: string,
  options: HTMLSanitizeOptions = {}
): string {
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: options.allowedTags || DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: options.allowedAttributes || DEFAULT_ALLOWED_ATTRIBUTES,
    ALLOWED_URI_REGEXP: new RegExp(
      `^(?:(?:${(options.allowedSchemes || DEFAULT_ALLOWED_SCHEMES).join('|')}):)`,
      'i'
    ),
    KEEP_CONTENT: !options.stripIgnoreTagBody,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize plain text input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return '';

  return (
    input
      .trim()
      // Remove potential HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove data: protocol
      .replace(/data:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // Limit length
      .substring(0, maxLength)
  );
}

/**
 * Sanitize for SQL (prevent SQL injection)
 */
export function sanitizeSQL(input: string): string {
  if (!input) return '';

  return (
    input
      // Remove SQL comment markers
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      // Remove semicolons (statement separators)
      .replace(/;/g, '')
      // Remove quotes (use parameterized queries instead)
      .replace(/['"]/g, '')
      // Remove SQL keywords (basic protection)
      .replace(
        /\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|EXECUTE|UNION|SELECT)\b/gi,
        ''
      )
      .trim()
  );
}

/**
 * Sanitize file path (prevent directory traversal)
 */
export function sanitizeFilePath(path: string): string {
  if (!path) return '';

  return (
    path
      // Remove directory traversal
      .replace(/\.\./g, '')
      // Remove leading slashes
      .replace(/^\/+/, '')
      // Remove double slashes
      .replace(/\/\//g, '/')
      // Normalize backslashes
      .replace(/\\/g, '/')
      // Remove null bytes
      .replace(/\0/g, '')
      .trim()
  );
}

/**
 * Sanitize URL
 */
export function sanitizeURL(url: string, allowedSchemes: string[] = DEFAULT_ALLOWED_SCHEMES): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);

    // Check if scheme is allowed
    const scheme = parsed.protocol.replace(':', '');
    if (!allowedSchemes.includes(scheme)) {
      return '';
    }

    // Remove javascript: and data: URLs
    if (scheme === 'javascript' || scheme === 'data') {
      return '';
    }

    return parsed.toString();
  } catch {
    // Invalid URL
    return '';
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  const sanitized = email.trim().toLowerCase();

  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  // Remove all non-numeric characters except +
  return phone.replace(/[^0-9+]/g, '');
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  return (
    filename
      // Remove directory separators
      .replace(/[/\\]/g, '')
      // Remove dangerous characters
      .replace(/[<>:"|?*\x00-\x1F]/g, '')
      // Remove leading/trailing dots and spaces
      .replace(/^[.\s]+|[.\s]+$/g, '')
      // Limit length
      .substring(0, 255)
  );
}

/**
 * Sanitize JSON (prevent JSON injection)
 */
export function sanitizeJSON(json: string): string {
  if (!json) return '';

  try {
    // Parse and re-stringify to ensure valid JSON
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed);
  } catch {
    return '';
  }
}

/**
 * Sanitize command line arguments (prevent command injection)
 */
export function sanitizeCommandArg(arg: string): string {
  if (!arg) return '';

  return (
    arg
      // Remove shell metacharacters
      .replace(/[;&|`$(){}[\]<>]/g, '')
      // Remove quotes
      .replace(/['"]/g, '')
      // Remove backslashes
      .replace(/\\/g, '')
      .trim()
  );
}

/**
 * Sanitize MongoDB query (prevent NoSQL injection)
 */
export function sanitizeMongoQuery(query: any): any {
  if (typeof query !== 'object' || query === null) {
    return query;
  }

  // Remove dangerous operators
  const dangerousOperators = ['$where', '$function', '$accumulator', '$lookup'];

  const sanitized: any = Array.isArray(query) ? [] : {};

  Object.keys(query).forEach((key) => {
    // Skip dangerous operators
    if (dangerousOperators.includes(key)) {
      return;
    }

    // Recursively sanitize nested objects
    if (typeof query[key] === 'object' && query[key] !== null) {
      sanitized[key] = sanitizeMongoQuery(query[key]);
    } else {
      sanitized[key] = query[key];
    }
  });

  return sanitized;
}

/**
 * Sanitize RegExp input (prevent ReDoS)
 */
export function sanitizeRegExp(pattern: string, flags?: string): RegExp | null {
  try {
    // Limit pattern length to prevent ReDoS
    if (pattern.length > 100) {
      return null;
    }

    // Disallow nested quantifiers
    if (/[*+?{]\s*[*+?{]/.test(pattern)) {
      return null;
    }

    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

/**
 * Escape HTML entities
 */
export function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Unescape HTML entities
 */
export function unescapeHTML(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

/**
 * Sanitize CSS (prevent CSS injection)
 */
export function sanitizeCSS(css: string): string {
  if (!css) return '';

  return (
    css
      // Remove dangerous CSS
      .replace(/javascript:/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/import\s+/gi, '')
      .replace(/@import/gi, '')
      // Remove behavior (IE)
      .replace(/behavior\s*:/gi, '')
      // Remove -moz-binding (Firefox)
      .replace(/-moz-binding\s*:/gi, '')
      .trim()
  );
}

/**
 * Validate and sanitize user input based on type
 */
export function sanitizeByType(value: any, type: string): any {
  switch (type) {
    case 'html':
      return sanitizeHTML(String(value));
    case 'text':
      return sanitizeInput(String(value));
    case 'email':
      return sanitizeEmail(String(value));
    case 'url':
      return sanitizeURL(String(value));
    case 'phone':
      return sanitizePhone(String(value));
    case 'filename':
      return sanitizeFilename(String(value));
    case 'filepath':
      return sanitizeFilePath(String(value));
    case 'sql':
      return sanitizeSQL(String(value));
    case 'json':
      return sanitizeJSON(String(value));
    case 'number':
      return Number(value) || 0;
    case 'boolean':
      return Boolean(value);
    default:
      return sanitizeInput(String(value));
  }
}

/**
 * Deep sanitize object (recursively sanitize all string values)
 */
export function deepSanitize(obj: any, type: string = 'text'): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeByType(obj, type);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepSanitize(item, type));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    Object.keys(obj).forEach((key) => {
      sanitized[key] = deepSanitize(obj[key], type);
    });
    return sanitized;
  }

  return obj;
}

/**
 * Sanitization middleware for form data
 */
export function sanitizeFormData(
  data: Record<string, any>,
  schema?: Record<string, string>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  Object.keys(data).forEach((key) => {
    const type = schema?.[key] || 'text';
    sanitized[key] = sanitizeByType(data[key], type);
  });

  return sanitized;
}

/**
 * Content Security Policy nonce generator
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitization configuration
 */
export interface SanitizationConfig {
  enabled: boolean;
  strictMode: boolean;
  logViolations: boolean;
}

export const DEFAULT_SANITIZATION_CONFIG: SanitizationConfig = {
  enabled: true,
  strictMode: import.meta.env.PROD,
  logViolations: import.meta.env.DEV,
};

/**
 * Initialize sanitization
 */
export function initSanitization(config: Partial<SanitizationConfig> = {}): void {
  const finalConfig = { ...DEFAULT_SANITIZATION_CONFIG, ...config };

  // Configure DOMPurify
  DOMPurify.setConfig({
    ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: DEFAULT_ALLOWED_ATTRIBUTES,
  });

  // Add hooks for logging violations
  if (finalConfig.logViolations) {
    DOMPurify.addHook('uponSanitizeElement', (node, data) => {
      if (data.allowedTags && !data.allowedTags[data.tagName || '']) {
        console.warn('[Sanitization] Removed disallowed tag:', data.tagName);
      }
    });

    DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
      if (data.allowedAttributes && !data.allowedAttributes[data.attrName || '']) {
        console.warn('[Sanitization] Removed disallowed attribute:', data.attrName);
      }
    });
  }

  if (import.meta.env.DEV) {
    console.log('[Sanitization] Initialized with config:', finalConfig);
  }
}
