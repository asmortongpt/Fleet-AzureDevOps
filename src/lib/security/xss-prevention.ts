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
};

/**
 * Sanitize HTML content using DOMPurify
 *
 * @param dirty - Untrusted HTML string
 * @param config - Optional custom DOMPurify configuration
 * @returns Sanitized HTML safe for rendering
 *
 * @example
 *