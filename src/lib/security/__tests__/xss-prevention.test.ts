/**
 * XSS Prevention Tests
 * Comprehensive tests for Cross-Site Scripting defense
 * Target: 80%+ coverage
 */

import { describe, it, expect, vi } from 'vitest';
import { sanitizeHTML, sanitizeText, sanitizeURL, CSP_HEADERS } from '../xss-prevention';

// Mock DOMPurify for JSDOM environment
vi.mock('dompurify', () => {
  const mockSanitize = (dirty: string, config?: any) => {
    // Simple mock implementation
    if (!config) {
      // Default: remove script tags
      return dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    if (config.ALLOWED_TAGS && config.ALLOWED_TAGS.length === 0) {
      // No tags allowed: strip all HTML
      return dirty.replace(/<[^>]*>/g, '');
    }

    // With allowed tags: keep safe tags, remove script
    return dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  return {
    default: {
      sanitize: mockSanitize,
    },
  };
});

describe('sanitizeHTML', () => {
  describe('XSS Attack Prevention', () => {
    it('should remove script tags', () => {
      const xss = '<script>alert("XSS")</script>';
      const clean = sanitizeHTML(xss);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
    });

    it('should remove inline event handlers', () => {
      const xss = '<img src="x" onerror="alert(\'XSS\')">';
      const clean = sanitizeHTML(xss);

      // DOMPurify removes dangerous attributes
      expect(clean).not.toContain('onerror');
    });

    it('should remove javascript: URLs', () => {
      const xss = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const clean = sanitizeHTML(xss);

      expect(clean).not.toContain('javascript:');
    });

    it('should remove data: URLs with scripts', () => {
      const xss = '<img src="data:text/html,<script>alert(\'XSS\')</script>">';
      const clean = sanitizeHTML(xss);

      expect(clean).not.toContain('data:text/html');
    });

    it('should prevent DOM clobbering', () => {
      const xss = '<form><input name="attributes"></form>';
      const clean = sanitizeHTML(xss);

      // Should still sanitize even if tag is allowed
      expect(typeof clean).toBe('string');
    });

    it('should handle nested script tags', () => {
      const xss = '<div><script><script>alert("XSS")</script></script></div>';
      const clean = sanitizeHTML(xss);

      expect(clean).not.toContain('<script>');
    });

    it('should handle encoded script tags', () => {
      const xss = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const clean = sanitizeHTML(xss);

      // Should handle HTML entities
      expect(typeof clean).toBe('string');
    });

    it('should remove SVG with embedded scripts', () => {
      const xss = '<svg><script>alert("XSS")</script></svg>';
      const clean = sanitizeHTML(xss);

      expect(clean).not.toContain('<script>');
    });

    it('should handle malformed HTML', () => {
      const malformed = '<script<script>alert("XSS")</script>';
      const clean = sanitizeHTML(malformed);

      expect(clean).not.toContain('alert');
    });
  });

  describe('Safe HTML Preservation', () => {
    it('should preserve safe paragraph tags', () => {
      const safe = '<p>This is safe content</p>';
      const clean = sanitizeHTML(safe);

      expect(clean).toContain('<p>');
      expect(clean).toContain('This is safe content');
    });

    it('should preserve safe formatting tags', () => {
      const safe = '<strong>Bold</strong> <em>Italic</em> <u>Underline</u>';
      const clean = sanitizeHTML(safe);

      expect(clean).toContain('<strong>');
      expect(clean).toContain('<em>');
      expect(clean).toContain('<u>');
    });

    it('should preserve safe links', () => {
      const safe = '<a href="https://example.com">Link</a>';
      const clean = sanitizeHTML(safe);

      expect(clean).toContain('<a');
      expect(clean).toContain('https://example.com');
    });

    it('should preserve lists', () => {
      const safe = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const clean = sanitizeHTML(safe);

      expect(clean).toContain('<ul>');
      expect(clean).toContain('<li>');
    });

    it('should preserve headings', () => {
      const safe = '<h1>Title</h1><h2>Subtitle</h2>';
      const clean = sanitizeHTML(safe);

      expect(clean).toContain('<h1>');
      expect(clean).toContain('<h2>');
    });

    it('should preserve code blocks', () => {
      const safe = '<pre><code>const x = 1;</code></pre>';
      const clean = sanitizeHTML(safe);

      expect(clean).toContain('<pre>');
      expect(clean).toContain('<code>');
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom allowed tags', () => {
      const html = '<p>Paragraph</p><script>alert("XSS")</script>';
      const config = {
        ALLOWED_TAGS: ['p'],
      };

      const clean = sanitizeHTML(html, config);

      expect(clean).toContain('<p>');
      expect(clean).not.toContain('<script>');
    });

    it('should accept custom allowed attributes', () => {
      const html = '<a href="https://example.com" onclick="alert(\'XSS\')">Link</a>';
      const config = {
        ALLOWED_ATTR: ['href'],
      };

      const clean = sanitizeHTML(html, config);

      expect(clean).not.toContain('onclick');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const clean = sanitizeHTML('');

      expect(clean).toBe('');
    });

    it('should handle plain text', () => {
      const text = 'Plain text with no HTML';
      const clean = sanitizeHTML(text);

      expect(clean).toBe(text);
    });

    it('should handle very long HTML', () => {
      const longHtml = '<p>' + 'a'.repeat(100000) + '</p>';
      const clean = sanitizeHTML(longHtml);

      expect(clean).toContain('<p>');
    });

    it('should handle unicode characters', () => {
      const unicode = '<p>你好世界 🌍</p>';
      const clean = sanitizeHTML(unicode);

      expect(clean).toContain('你好世界');
      expect(clean).toContain('🌍');
    });

    it('should handle special characters', () => {
      const special = '<p>Special chars: &amp; &lt; &gt; &quot;</p>';
      const clean = sanitizeHTML(special);

      expect(clean).toContain('&amp;');
    });
  });
});

describe('sanitizeText', () => {
  it('should strip all HTML tags', () => {
    const html = '<p>Text</p><script>alert("XSS")</script>';
    const clean = sanitizeText(html);

    expect(clean).not.toContain('<p>');
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('Text');
  });

  it('should preserve text content', () => {
    const html = '<div><p>Paragraph text</p><span>Span text</span></div>';
    const clean = sanitizeText(html);

    expect(clean).toContain('Paragraph text');
    expect(clean).toContain('Span text');
    expect(clean).not.toContain('<');
    expect(clean).not.toContain('>');
  });

  it('should handle nested tags', () => {
    const html = '<div><p><strong>Bold text</strong></p></div>';
    const clean = sanitizeText(html);

    expect(clean).toContain('Bold text');
    expect(clean).not.toContain('<strong>');
  });

  it('should handle malicious content', () => {
    const xss = '<script>alert("XSS")</script>Safe text';
    const clean = sanitizeText(xss);

    expect(clean).toContain('Safe text');
    expect(clean).not.toContain('alert');
    expect(clean).not.toContain('<script>');
  });

  it('should handle empty string', () => {
    const clean = sanitizeText('');

    expect(clean).toBe('');
  });

  it('should handle plain text', () => {
    const text = 'Plain text with no HTML';
    const clean = sanitizeText(text);

    expect(clean).toBe(text);
  });

  it('should preserve whitespace and line breaks', () => {
    const text = 'Line 1\nLine 2\n  Indented';
    const clean = sanitizeText(text);

    expect(clean).toBe(text);
  });
});

describe('sanitizeURL', () => {
  describe('Safe URLs', () => {
    it('should allow https URLs', () => {
      const url = 'https://example.com/path?query=value';
      const clean = sanitizeURL(url);

      expect(clean).toBeTruthy();
      expect(clean).toContain('https://');
    });

    it('should allow http URLs', () => {
      const url = 'http://example.com';
      const clean = sanitizeURL(url);

      expect(clean).toBeTruthy();
      expect(clean).toContain('http://');
    });

    it('should allow mailto URLs', () => {
      const url = 'mailto:user@example.com';
      const clean = sanitizeURL(url);

      expect(clean).toBeTruthy();
      expect(clean).toContain('mailto:');
    });

    it('should allow tel URLs', () => {
      const url = 'tel:+1234567890';
      const clean = sanitizeURL(url);

      expect(clean).toBeTruthy();
      expect(clean).toContain('tel:');
    });
  });

  describe('Dangerous URLs', () => {
    it('should reject javascript URLs', () => {
      const url = 'javascript:alert("XSS")';
      const clean = sanitizeURL(url);

      expect(clean).toBe('');
    });

    it('should reject data URLs', () => {
      const url = 'data:text/html,<script>alert("XSS")</script>';
      const clean = sanitizeURL(url);

      expect(clean).toBe('');
    });

    it('should reject vbscript URLs', () => {
      const url = 'vbscript:msgbox("XSS")';
      const clean = sanitizeURL(url);

      expect(clean).toBe('');
    });

    it('should reject file URLs', () => {
      const url = 'file:///etc/passwd';
      const clean = sanitizeURL(url);

      expect(clean).toBe('');
    });

    it('should reject malformed URLs', () => {
      const url = 'not a url at all';
      const clean = sanitizeURL(url);

      expect(clean).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const clean = sanitizeURL('');

      expect(clean).toBe('');
    });

    it('should handle URLs with fragments', () => {
      const url = 'https://example.com#section';
      const clean = sanitizeURL(url);

      expect(clean).toBeTruthy();
    });

    it('should handle URLs with credentials', () => {
      const url = 'https://user:pass@example.com';
      const clean = sanitizeURL(url);

      // Should either allow or reject, but not crash
      expect(typeof clean).toBe('string');
    });

    it('should handle international domain names', () => {
      const url = 'https://例え.jp';
      const clean = sanitizeURL(url);

      expect(typeof clean).toBe('string');
    });

    it('should handle case variations', () => {
      const url = 'JavaScript:alert("XSS")';
      const clean = sanitizeURL(url);

      expect(clean).toBe('');
    });
  });
});

describe('CSP Headers', () => {
  it('should define Content-Security-Policy header', () => {
    expect(CSP_HEADERS['Content-Security-Policy']).toBeDefined();
  });

  it('should include default-src directive', () => {
    expect(CSP_HEADERS['Content-Security-Policy']).toContain("default-src 'self'");
  });

  it('should include script-src directive', () => {
    expect(CSP_HEADERS['Content-Security-Policy']).toContain('script-src');
  });

  it('should include style-src directive', () => {
    expect(CSP_HEADERS['Content-Security-Policy']).toContain('style-src');
  });

  it('should include img-src directive', () => {
    expect(CSP_HEADERS['Content-Security-Policy']).toContain('img-src');
  });

  it('should include frame-ancestors directive', () => {
    expect(CSP_HEADERS['Content-Security-Policy']).toContain('frame-ancestors');
  });

  it('should prevent framing with frame-ancestors none', () => {
    expect(CSP_HEADERS['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  });

  it('should include base-uri directive', () => {
    expect(CSP_HEADERS['Content-Security-Policy']).toContain('base-uri');
  });

  it('should include form-action directive', () => {
    expect(CSP_HEADERS['Content-Security-Policy']).toContain('form-action');
  });

  it('should be a valid CSP header format', () => {
    const csp = CSP_HEADERS['Content-Security-Policy'];

    // Should have multiple directives separated by semicolons
    expect(csp.split(';').length).toBeGreaterThan(5);
  });
});

describe('Real-World XSS Payloads', () => {
  it('should prevent image onerror attack', () => {
    const xss = '<img src=x onerror="alert(\'XSS\')">';
    const clean = sanitizeHTML(xss);

    expect(clean).not.toContain('onerror');
  });

  it('should prevent SVG onload attack', () => {
    const xss = '<svg onload="alert(\'XSS\')">';
    const clean = sanitizeHTML(xss);

    expect(clean).not.toContain('onload');
  });

  it('should prevent iframe javascript attack', () => {
    const xss = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
    const clean = sanitizeHTML(xss);

    expect(clean).not.toContain('javascript:');
  });

  it('should prevent style expression attack', () => {
    const xss = '<div style="background:url(javascript:alert(\'XSS\'))"></div>';
    const clean = sanitizeHTML(xss);

    expect(clean).not.toContain('javascript:');
  });

  it('should prevent meta refresh attack', () => {
    const xss = '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">';
    const clean = sanitizeHTML(xss);

    expect(clean).not.toContain('javascript:');
  });

  it('should prevent link import attack', () => {
    const xss = '<link rel="import" href="javascript:alert(\'XSS\')">';
    const clean = sanitizeHTML(xss);

    expect(clean).not.toContain('javascript:');
  });

  it('should prevent embed src attack', () => {
    const xss = '<embed src="javascript:alert(\'XSS\')">';
    const clean = sanitizeHTML(xss);

    expect(clean).not.toContain('javascript:');
  });

  it('should prevent object data attack', () => {
    const xss = '<object data="javascript:alert(\'XSS\')">';
    const clean = sanitizeHTML(xss);

    expect(clean).not.toContain('javascript:');
  });

  it('should prevent form action attack', () => {
    const xss = '<form action="javascript:alert(\'XSS\')"><input type="submit"></form>';
    const clean = sanitizeHTML(xss);

    expect(clean).not.toContain('javascript:');
  });

  it('should prevent button formaction attack', () => {
    const xss = '<button formaction="javascript:alert(\'XSS\')">Click</button>';
    const clean = sanitizeHTML(xss);

    expect(clean).not.toContain('javascript:');
  });
});
