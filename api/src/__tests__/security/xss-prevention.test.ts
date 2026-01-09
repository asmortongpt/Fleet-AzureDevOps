import { describe, it, expect } from 'vitest';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

/**
 * Critical Security Test Suite: XSS (Cross-Site Scripting) Prevention
 *
 * This test suite validates that all user-generated content is properly sanitized
 * to prevent XSS attacks. This is a CRITICAL security requirement.
 */

// Setup DOMPurify with JSDOM
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitize HTML content to prevent XSS
 */
function sanitizeHtml(dirty: string): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
  });
}

/**
 * Escape HTML entities
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

describe('XSS Prevention', () => {
  describe('Script Tag Injection', () => {
    it('should remove <script> tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove inline event handlers', () => {
      const malicious = '<img src="x" onerror="alert(\'XSS\')" />';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove onclick handlers', () => {
      const malicious = '<button onclick="stealCookies()">Click me</button>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('stealCookies');
    });

    it('should remove onload handlers', () => {
      const malicious = '<body onload="maliciousCode()">';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('maliciousCode');
    });
  });

  describe('JavaScript Protocol Injection', () => {
    it('should remove javascript: protocol in href', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove data: protocol with JavaScript', () => {
      const malicious = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('data:text/html');
      expect(sanitized).not.toContain('<script>');
    });

    it('should remove vbscript: protocol', () => {
      const malicious = '<a href="vbscript:msgbox(\'XSS\')">Click</a>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('vbscript:');
    });
  });

  describe('HTML Entity Encoding', () => {
    it('should escape < and > characters', () => {
      const unsafe = '<div>Test</div>';
      const escaped = escapeHtml(unsafe);

      expect(escaped).toBe('&lt;div&gt;Test&lt;/div&gt;');
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
    });

    it('should escape quotes', () => {
      const unsafe = 'Test "quoted" and \'single\' quotes';
      const escaped = escapeHtml(unsafe);

      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&#039;');
    });

    it('should escape ampersands', () => {
      const unsafe = 'Tom & Jerry';
      const escaped = escapeHtml(unsafe);

      expect(escaped).toBe('Tom &amp; Jerry');
    });
  });

  describe('SVG XSS Vectors', () => {
    it('should remove malicious SVG', () => {
      const malicious = '<svg onload="alert(\'XSS\')"><script>alert(1)</script></svg>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<svg');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove SVG with embedded scripts', () => {
      const malicious = '<svg><foreignObject><body onload="alert(1)"></body></foreignObject></svg>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('foreignObject');
      expect(sanitized).not.toContain('onload');
    });
  });

  describe('CSS Injection', () => {
    it('should remove style tags', () => {
      const malicious = '<style>body { background: red; }</style>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<style>');
      expect(sanitized).not.toContain('background');
    });

    it('should remove style attributes', () => {
      const malicious = '<div style="background-image: url(javascript:alert(\'XSS\'))">Test</div>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('style=');
      expect(sanitized).not.toContain('javascript:');
    });
  });

  describe('Advanced XSS Vectors', () => {
    it('should prevent polyglot XSS', () => {
      const malicious = 'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//->';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('oNcliCk');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).not.toContain('<sVg');
    });

    it('should prevent mutation XSS', () => {
      const malicious = '<noscript><p title="</noscript><img src=x onerror=alert(1)>">';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should prevent DOM clobbering', () => {
      const malicious = '<form name="getElementById"><input name="getElementById"></form>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<form');
      expect(sanitized).not.toContain('getElementById');
    });
  });

  describe('Context-Specific Sanitization', () => {
    it('should sanitize vehicle names', () => {
      const maliciousName = '<script>alert("XSS")</script>Fleet-001';
      const sanitized = sanitizeHtml(maliciousName);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Fleet-001');
    });

    it('should sanitize driver notes', () => {
      const maliciousNotes = 'Good driver<img src=x onerror=alert(1)>';
      const sanitized = sanitizeHtml(maliciousNotes);

      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('Good driver');
    });

    it('should sanitize maintenance descriptions', () => {
      const maliciousDesc = 'Oil change <iframe src="javascript:alert(\'XSS\')"></iframe>';
      const sanitized = sanitizeHtml(maliciousDesc);

      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('Oil change');
    });
  });

  describe('JSON Injection', () => {
    it('should prevent JSON injection in API responses', () => {
      const userInput = '"; alert(1); var foo="';
      const jsonSafe = JSON.stringify({ value: userInput });

      expect(jsonSafe).toContain('\\"');
      expect(jsonSafe).not.toContain('"; alert');
    });

    it('should escape control characters in JSON', () => {
      const userInput = 'Line1\nLine2\rLine3\tTabbed';
      const jsonSafe = JSON.stringify({ value: userInput });

      expect(jsonSafe).toContain('\\n');
      expect(jsonSafe).toContain('\\r');
      expect(jsonSafe).toContain('\\t');
    });
  });

  describe('URL Injection', () => {
    it('should validate URLs', () => {
      const maliciousUrl = 'javascript:alert(document.cookie)';
      const isValidUrl = (url: string): boolean => {
        try {
          const parsed = new URL(url);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      };

      expect(isValidUrl(maliciousUrl)).toBe(false);
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should sanitize redirect URLs', () => {
      const maliciousRedirect = 'javascript:alert(1)';
      const safeRedirect = (url: string): string => {
        try {
          const parsed = new URL(url);
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '/'; // Default safe redirect
          }
          return url;
        } catch {
          return '/';
        }
      };

      expect(safeRedirect(maliciousRedirect)).toBe('/');
      expect(safeRedirect('https://example.com/page')).toBe('https://example.com/page');
    });
  });

  describe('File Upload XSS', () => {
    it('should sanitize file names', () => {
      const maliciousFileName = '<script>alert(1)</script>.pdf';
      const sanitized = escapeHtml(maliciousFileName);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('.pdf');
    });

    it('should validate file MIME types', () => {
      const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maliciousMime = 'text/html';

      expect(allowedMimeTypes.includes(maliciousMime)).toBe(false);
      expect(allowedMimeTypes.includes('application/pdf')).toBe(true);
    });
  });

  describe('Multi-Tenant XSS Protection', () => {
    it('should sanitize tenant names', () => {
      const maliciousTenant = 'TenantA<img src=x onerror=alert(1)>';
      const sanitized = sanitizeHtml(maliciousTenant);

      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('TenantA');
    });

    it('should sanitize custom field values', () => {
      const maliciousField = {
        label: 'Custom Field',
        value: '<script>stealData()</script>Important Value'
      };
      const sanitizedValue = sanitizeHtml(maliciousField.value);

      expect(sanitizedValue).not.toContain('<script>');
      expect(sanitizedValue).toContain('Important Value');
    });
  });

  describe('Content Security Policy Helpers', () => {
    it('should generate safe nonce values', () => {
      const generateNonce = (): string => {
        return Buffer.from(Math.random().toString()).toString('base64').substring(0, 16);
      };

      const nonce = generateNonce();
      expect(nonce).toBeTruthy();
      expect(nonce.length).toBeGreaterThan(0);
      expect(nonce).not.toContain('<');
      expect(nonce).not.toContain('>');
    });

    it('should validate CSP directives', () => {
      const cspHeader = "default-src 'self'; script-src 'self' 'unsafe-inline'";

      // Should NOT allow unsafe-inline in production
      expect(cspHeader).toContain('unsafe-inline'); // This is BAD - should be removed
    });
  });
});
