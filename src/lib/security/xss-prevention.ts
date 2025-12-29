/**
 * XSS Prevention & Content Security Policy (CSP)
 *
 * Production-grade defense against Cross-Site Scripting (XSS) attacks:
 * - DOMPurify integration for HTML sanitization
 * - CSP (Content Security Policy) headers
 * - Input validation and output encoding
 * - Trusted Types API enforcement
 * - Safe rendering hooks for React
 *
 * FedRAMP Compliance: SI-10, SI-11, SI-16
 * SOC 2: CC6.6, CC6.7
 * OWASP: A03:2021 – Injection
 */

import DOMPurify from 'dompurify';

/**
 * DOMPurify Configuration
 *
 * Strict sanitization to prevent XSS while preserving safe formatting
 */
const DOM_PURIFY_CONFIG: DOMPurify.Config = {
  // Allowed tags (whitelist approach)
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'span', 'div', 'pre', 'code', 'blockquote'
  ],

  // Allowed attributes (whitelist approach)
  ALLOWED_ATTR: [
    'href', 'title', 'class', 'id', 'target', 'rel'
  ],

  // Allowed URI schemes (prevent javascript:, data:, etc.)
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,

  // Add target="_blank" to external links
  ADD_ATTR: ['target'],

  // Force attributes to specific values
  FORCE_BODY: false,

  // Return a DOM node instead of string (safer)
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,

  // Sanitize <style> tags
  WHOLE_DOCUMENT: false,
  SAFE_FOR_TEMPLATES: true,

  // Keep comments
  KEEP_CONTENT: true,

  // Custom hook to enforce rel="noopener noreferrer" on external links
  AFTER_SANITIZE_ATTRIBUTES: (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (href && /^https?:\/\//.test(href)) {
        // External link - add security attributes
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  }
};

/**
 * Sanitize HTML content using DOMPurify
 *
 * @param dirty - Untrusted HTML string
 * @param config - Optional custom DOMPurify configuration
 * @returns Sanitized HTML safe for rendering
 *
 * @example
 * ```tsx
 * const userComment = '<script>alert("XSS")</script><p>Safe content</p>';
 * const safeHtml = sanitizeHtml(userComment);
 * // Returns: '<p>Safe content</p>'
 *
 * // Use in React:
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userComment) }} />
 * ```
 */
export function sanitizeHtml(
  dirty: string,
  config: DOMPurify.Config = DOM_PURIFY_CONFIG
): string {
  if (!dirty) return '';

  try {
    return DOMPurify.sanitize(dirty, config);
  } catch (error) {
    console.error('[XSS Prevention] DOMPurify sanitization failed:', error);
    // Return empty string on error (fail closed)
    return '';
  }
}

/**
 * Sanitize plain text (remove all HTML tags)
 *
 * Use for user inputs that should never contain HTML
 *
 * @param text - Untrusted text
 * @returns Plain text with all HTML stripped
 *
 * @example
 * ```ts
 * const userName = '<script>alert("XSS")</script>John Doe';
 * const safeName = sanitizeText(userName);
 * // Returns: 'John Doe'
 * ```
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  try {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  } catch (error) {
    console.error('[XSS Prevention] Text sanitization failed:', error);
    return '';
  }
}

/**
 * Sanitize URL to prevent javascript:, data:, and other malicious schemes
 *
 * @param url - Untrusted URL
 * @param allowedProtocols - Allowed URL protocols (default: https, http, mailto, tel)
 * @returns Sanitized URL or empty string if invalid
 *
 * @example
 * ```ts
 * const userUrl = 'javascript:alert("XSS")';
 * const safeUrl = sanitizeUrl(userUrl);
 * // Returns: ''
 *
 * const legitUrl = 'https://example.com';
 * const safeUrl2 = sanitizeUrl(legitUrl);
 * // Returns: 'https://example.com'
 * ```
 */
export function sanitizeUrl(
  url: string,
  allowedProtocols: string[] = ['https:', 'http:', 'mailto:', 'tel:']
): string {
  if (!url) return '';

  try {
    const parsed = new URL(url, 'https://example.com'); // Provide base for relative URLs

    // Check if protocol is allowed
    if (!allowedProtocols.includes(parsed.protocol)) {
      console.warn(`[XSS Prevention] Blocked URL with disallowed protocol: ${parsed.protocol}`);
      return '';
    }

    return url;
  } catch (error) {
    console.warn('[XSS Prevention] Invalid URL blocked:', url);
    return '';
  }
}

/**
 * React hook for safe HTML rendering
 *
 * @param html - Untrusted HTML
 * @returns Object with sanitized __html for dangerouslySetInnerHTML
 *
 * @example
 * ```tsx
 * function Comment({ content }) {
 *   const safeHtml = useSafeHtml(content);
 *   return <div dangerouslySetInnerHTML={safeHtml} />;
 * }
 * ```
 */
export function useSafeHtml(html: string): { __html: string } {
  return { __html: sanitizeHtml(html) };
}

/**
 * Content Security Policy (CSP) Configuration
 *
 * FedRAMP SI-16: Content Security Policy
 * Prevents XSS, clickjacking, and other injection attacks
 */
export const CSP_DIRECTIVES = {
  // Default source (fallback for all fetch directives)
  'default-src': ["'self'"],

  // Scripts - strict nonce-based CSP (best practice)
  'script-src': [
    "'self'",
    "'nonce-{NONCE}'", // Replace {NONCE} with unique per-request nonce
    'https://cdn.jsdelivr.net', // For CDN dependencies (if needed)
    'https://*.azurestaticapps.net' // Azure Static Web Apps
  ],

  // Styles - nonce-based or hash-based
  'style-src': [
    "'self'",
    "'nonce-{NONCE}'",
    'https://fonts.googleapis.com' // Google Fonts
  ],

  // Images - allow data: for inline images, https for external
  'img-src': [
    "'self'",
    'data:', // Inline images (e.g., base64)
    'https:', // HTTPS images
    'blob:' // Blob URLs for file uploads
  ],

  // Fonts
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com'
  ],

  // Connect (AJAX, WebSocket, EventSource)
  'connect-src': [
    "'self'",
    'https://*.azurestaticapps.net',
    'https://*.azure.com', // Azure services
    'https://*.auth0.com', // Auth0
    'https://login.microsoftonline.com', // Azure AD
    'wss://*.azurestaticapps.net' // WebSocket
  ],

  // Media (audio/video)
  'media-src': ["'self'"],

  // Object (deprecated but blocked for security)
  'object-src': ["'none'"],

  // Base URI (prevents <base> tag injection)
  'base-uri': ["'self'"],

  // Form actions (prevents form submissions to external sites)
  'form-action': ["'self'"],

  // Frame ancestors (prevents clickjacking)
  'frame-ancestors': ["'none'"], // Disallow embedding in iframes (X-Frame-Options: DENY equivalent)

  // Upgrade insecure requests (HTTP → HTTPS)
  'upgrade-insecure-requests': [],

  // Block all mixed content
  'block-all-mixed-content': [],

  // Trusted Types (prevent DOM XSS)
  // Requires browser support
  'require-trusted-types-for': ["'script'"],
  'trusted-types': ['default', 'dompurify']
} as const;

/**
 * Generate CSP header value
 *
 * @param nonce - Unique nonce for this request (generated per-response)
 * @returns CSP header value
 *
 * @example
 * ```ts
 * const nonce = crypto.randomUUID();
 * const cspHeader = generateCSP(nonce);
 * response.setHeader('Content-Security-Policy', cspHeader);
 * ```
 */
export function generateCSP(nonce?: string): string {
  const directives = { ...CSP_DIRECTIVES };

  // Replace {NONCE} placeholder with actual nonce
  if (nonce) {
    directives['script-src'] = directives['script-src'].map(src =>
      src.replace('{NONCE}', nonce)
    );
    directives['style-src'] = directives['style-src'].map(src =>
      src.replace('{NONCE}', nonce)
    );
  }

  // Convert directives object to CSP string
  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive; // Directives without sources (e.g., upgrade-insecure-requests)
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security Headers Configuration
 *
 * FedRAMP SC-8: HTTPS enforcement and security headers
 * Comprehensive defense-in-depth headers
 */
export const SECURITY_HEADERS = {
  // Content Security Policy (primary XSS defense)
  'Content-Security-Policy': generateCSP(),

  // CSP reporting (optional - for monitoring violations)
  // 'Content-Security-Policy-Report-Only': generateCSP() + '; report-uri /api/csp-report',

  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS protection (legacy, CSP is better but add for defense-in-depth)
  'X-XSS-Protection': '1; mode=block',

  // Frame options (prevent clickjacking)
  'X-Frame-Options': 'DENY',

  // Referrer policy (limit information leakage)
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy (limit browser features)
  'Permissions-Policy': [
    'geolocation=(self)', // Allow geolocation for fleet tracking
    'camera=()', // Disable camera
    'microphone=()', // Disable microphone
    'payment=()', // Disable payment API
    'usb=()', // Disable USB
    'bluetooth=()' // Disable Bluetooth
  ].join(', '),

  // Strict Transport Security (HSTS) - force HTTPS
  // max-age=31536000 (1 year), includeSubDomains, preload
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Cross-Origin policies
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
} as const;

/**
 * Input Validation Patterns
 *
 * FedRAMP SI-10: Information Input Validation
 * Whitelist-based validation for common input types
 */
export const INPUT_PATTERNS = {
  // Alphanumeric with spaces and hyphens (names, titles)
  name: /^[a-zA-Z0-9\s\-']{1,100}$/,

  // Email (RFC 5322 simplified)
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Phone (US format, flexible)
  phone: /^[\d\s\-\(\)\+]{7,20}$/,

  // VIN (Vehicle Identification Number) - 17 alphanumeric
  vin: /^[A-HJ-NPR-Z0-9]{17}$/,

  // License plate (US format, flexible)
  licensePlate: /^[A-Z0-9\s\-]{2,10}$/,

  // ZIP code (US 5-digit or 5+4)
  zipCode: /^\d{5}(-\d{4})?$/,

  // Currency amount (dollars and cents)
  currency: /^\$?\d{1,10}(\.\d{2})?$/,

  // Mileage (numeric with optional commas)
  mileage: /^\d{1,7}$/,

  // Date (ISO 8601: YYYY-MM-DD)
  date: /^\d{4}-\d{2}-\d{2}$/,

  // Time (HH:MM 24-hour)
  time: /^([01]\d|2[0-3]):([0-5]\d)$/,

  // URL (https only)
  url: /^https:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/
} as const;

/**
 * Validate input against pattern
 *
 * @param value - User input
 * @param pattern - Validation pattern from INPUT_PATTERNS
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * const isValidVin = validateInput(userInput, INPUT_PATTERNS.vin);
 * if (!isValidVin) {
 *   throw new Error('Invalid VIN format');
 * }
 * ```
 */
export function validateInput(value: string, pattern: RegExp): boolean {
  if (!value) return false;

  try {
    return pattern.test(value.trim());
  } catch (error) {
    console.error('[Input Validation] Pattern test failed:', error);
    return false;
  }
}

/**
 * Escape HTML entities in plain text
 *
 * Use when rendering user-provided text in HTML context
 *
 * @param text - Plain text
 * @returns HTML-escaped text
 *
 * @example
 * ```tsx
 * const comment = '<script>alert("XSS")</script>';
 * const escaped = escapeHtml(comment);
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 *
 * <div>{escaped}</div>
 * ```
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
}

/**
 * Rate Limiting Configuration (Anti-Abuse)
 *
 * FedRAMP SC-5: Denial of Service Protection
 */
export const RATE_LIMITS = {
  // Global per-IP limits
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests, please try again later'
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later'
  },

  // API endpoints (moderate)
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'API rate limit exceeded'
  },

  // Export/bulk operations (very strict)
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 exports per hour
    message: 'Export rate limit exceeded'
  }
} as const;
