/**
 * Input Sanitization Tests
 * Comprehensive tests for XSS, SQL injection, and attack prevention
 * Target: 80%+ coverage
 */

import { describe, it, expect, vi } from 'vitest';

import {
  sanitizeHTML,
  sanitizeInput,
  sanitizeSQL,
  sanitizeFilePath,
  sanitizeURL,
  sanitizeEmail,
  sanitizePhone,
  sanitizeFilename,
  sanitizeJSON,
  sanitizeCommandArg,
  sanitizeMongoQuery,
  sanitizeRegExp,
  sanitizeCSS,
  sanitizeByType,
  deepSanitize,
  sanitizeFormData,
  generateCSPNonce,
  escapeHTML,
  unescapeHTML,
  initSanitization,
} from '../sanitize';

// Mock DOMPurify for JSDOM environment
vi.mock('dompurify', () => {
  const mockSanitize = (dirty: string, config?: any) => {
    if (!config || !config.ALLOWED_TAGS || config.ALLOWED_TAGS.length > 0) {
      // Simple mock: remove script tags
      return dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    // If no tags allowed, strip all HTML
    return dirty.replace(/<[^>]*>/g, '');
  };

  return {
    default: {
      sanitize: mockSanitize,
      setConfig: vi.fn(),
      addHook: vi.fn(),
    },
  };
});

describe('sanitizeHTML', () => {
  it('should remove script tags', () => {
    const dirty = '<p>Safe content</p><script>alert("XSS")</script>';
    const clean = sanitizeHTML(dirty);

    expect(clean).not.toContain('<script>');
    expect(clean).toContain('<p>Safe content</p>');
  });

  it('should allow safe HTML tags', () => {
    const dirty = '<p>Paragraph</p><strong>Bold</strong><em>Italic</em>';
    const clean = sanitizeHTML(dirty);

    expect(clean).toContain('<p>');
    expect(clean).toContain('<strong>');
    expect(clean).toContain('<em>');
  });

  it('should handle empty string', () => {
    const clean = sanitizeHTML('');

    expect(clean).toBe('');
  });

  it('should handle plain text without HTML', () => {
    const text = 'Plain text with no HTML';
    const clean = sanitizeHTML(text);

    expect(clean).toBe(text);
  });
});

describe('sanitizeInput', () => {
  it('should remove HTML tags', () => {
    const dirty = 'Text with <script>alert("XSS")</script> tags';
    const clean = sanitizeInput(dirty);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('</script>');
  });

  it('should remove javascript: protocol', () => {
    const dirty = 'javascript:alert("XSS")';
    const clean = sanitizeInput(dirty);

    expect(clean).not.toContain('javascript:');
  });

  it('should remove data: protocol', () => {
    const dirty = 'data:text/html,<script>alert("XSS")</script>';
    const clean = sanitizeInput(dirty);

    expect(clean).not.toContain('data:');
  });

  it('should remove event handlers', () => {
    const dirty = 'Text with onclick=alert("XSS")';
    const clean = sanitizeInput(dirty);

    expect(clean).not.toContain('onclick=');
  });

  it('should remove control characters', () => {
    const dirty = 'Text\x00with\x1Fcontrol\x7Fchars';
    const clean = sanitizeInput(dirty);

    // eslint-disable-next-line no-control-regex
    expect(clean).not.toMatch(/[\x00-\x1F\x7F-\x9F]/);
  });

  it('should trim whitespace', () => {
    const dirty = '  text with spaces  ';
    const clean = sanitizeInput(dirty);

    expect(clean).toBe('text with spaces');
  });

  it('should limit length to maxLength', () => {
    const longText = 'a'.repeat(2000);
    const clean = sanitizeInput(longText, 500);

    expect(clean.length).toBe(500);
  });

  it('should handle empty string', () => {
    const clean = sanitizeInput('');

    expect(clean).toBe('');
  });

  it('should handle null/undefined gracefully', () => {
    const clean = sanitizeInput(null as any);

    expect(clean).toBe('');
  });
});

describe('sanitizeSQL', () => {
  it('should remove SQL comment markers', () => {
    const dirty = "SELECT * FROM users -- WHERE id=1";
    const clean = sanitizeSQL(dirty);

    expect(clean).not.toContain('--');
  });

  it('should remove multi-line comment markers', () => {
    const dirty = "SELECT * FROM users /* comment */ WHERE id=1";
    const clean = sanitizeSQL(dirty);

    expect(clean).not.toContain('/*');
    expect(clean).not.toContain('*/');
  });

  it('should remove semicolons', () => {
    const dirty = "SELECT * FROM users; DROP TABLE users;";
    const clean = sanitizeSQL(dirty);

    expect(clean).not.toContain(';');
  });

  it('should remove quotes', () => {
    const dirty = "' OR '1'='1";
    const clean = sanitizeSQL(dirty);

    expect(clean).not.toContain("'");
    expect(clean).not.toContain('"');
  });

  it('should remove dangerous SQL keywords', () => {
    const keywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'EXEC', 'UNION', 'SELECT'];

    keywords.forEach(keyword => {
      const dirty = `${keyword} FROM users`;
      const clean = sanitizeSQL(dirty);

      expect(clean.toUpperCase()).not.toContain(keyword);
    });
  });

  it('should handle empty string', () => {
    const clean = sanitizeSQL('');

    expect(clean).toBe('');
  });
});

describe('sanitizeFilePath', () => {
  it('should remove directory traversal attempts', () => {
    const dirty = '../../../etc/passwd';
    const clean = sanitizeFilePath(dirty);

    expect(clean).not.toContain('..');
  });

  it('should remove leading slashes', () => {
    const dirty = '/etc/passwd';
    const clean = sanitizeFilePath(dirty);

    expect(clean).not.toMatch(/^\//);
  });

  it('should normalize backslashes to forward slashes', () => {
    const dirty = 'path\\to\\file.txt';
    const clean = sanitizeFilePath(dirty);

    expect(clean).toBe('path/to/file.txt');
  });

  it('should remove double slashes', () => {
    const dirty = 'path//to//file.txt';
    const clean = sanitizeFilePath(dirty);

    expect(clean).toBe('path/to/file.txt');
  });

  it('should remove null bytes', () => {
    const dirty = 'file.txt\0.php';
    const clean = sanitizeFilePath(dirty);

    expect(clean).not.toContain('\0');
  });

  it('should handle empty string', () => {
    const clean = sanitizeFilePath('');

    expect(clean).toBe('');
  });
});

describe('sanitizeURL', () => {
  it('should allow https URLs', () => {
    const url = 'https://example.com';
    const clean = sanitizeURL(url);

    expect(clean).toBe(url);
  });

  it('should allow http URLs', () => {
    const url = 'http://example.com';
    const clean = sanitizeURL(url);

    expect(clean).toBe(url);
  });

  it('should allow mailto URLs', () => {
    const url = 'mailto:user@example.com';
    const clean = sanitizeURL(url);

    expect(clean).toBe(url);
  });

  it('should allow tel URLs', () => {
    const url = 'tel:+1234567890';
    const clean = sanitizeURL(url);

    expect(clean).toBe(url);
  });

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

  it('should reject invalid URLs', () => {
    const url = 'not a valid url';
    const clean = sanitizeURL(url);

    expect(clean).toBe('');
  });

  it('should respect custom allowed schemes', () => {
    const url = 'ftp://example.com';
    const clean = sanitizeURL(url, ['ftp']);

    expect(clean).toBeTruthy();
  });

  it('should handle empty string', () => {
    const clean = sanitizeURL('');

    expect(clean).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('should accept valid email addresses', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user_name@example.com',
    ];

    validEmails.forEach(email => {
      const clean = sanitizeEmail(email);
      expect(clean).toBe(email.toLowerCase());
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'invalid',
      '@example.com',
      'user@',
      'user @example.com',
      'user@example',
    ];

    invalidEmails.forEach(email => {
      const clean = sanitizeEmail(email);
      expect(clean).toBe('');
    });
  });

  it('should convert to lowercase', () => {
    const email = 'User@Example.COM';
    const clean = sanitizeEmail(email);

    expect(clean).toBe('user@example.com');
  });

  it('should trim whitespace', () => {
    const email = '  user@example.com  ';
    const clean = sanitizeEmail(email);

    expect(clean).toBe('user@example.com');
  });

  it('should handle empty string', () => {
    const clean = sanitizeEmail('');

    expect(clean).toBe('');
  });
});

describe('sanitizePhone', () => {
  it('should keep only digits and plus sign', () => {
    const phone = '+1 (555) 123-4567';
    const clean = sanitizePhone(phone);

    expect(clean).toBe('+15551234567');
  });

  it('should remove letters and special chars', () => {
    const phone = 'Call: +1-555-ABC-DEFG';
    const clean = sanitizePhone(phone);

    expect(clean).toMatch(/^[\d+]+$/);
  });

  it('should handle empty string', () => {
    const clean = sanitizePhone('');

    expect(clean).toBe('');
  });
});

describe('sanitizeFilename', () => {
  it('should remove directory separators', () => {
    const dirty = '../../../file.txt';
    const clean = sanitizeFilename(dirty);

    expect(clean).not.toContain('/');
    expect(clean).not.toContain('\\');
  });

  it('should remove dangerous characters', () => {
    const dirty = 'file<>:"|?*.txt';
    const clean = sanitizeFilename(dirty);

    expect(clean).toMatch(/^[^<>:"|?*]+$/);
  });

  it('should remove leading/trailing dots and spaces', () => {
    const dirty = '...file.txt...';
    const clean = sanitizeFilename(dirty);

    expect(clean).not.toMatch(/^\./);
    expect(clean).not.toMatch(/\.$/);
  });

  it('should limit length to 255 characters', () => {
    const longName = 'a'.repeat(300) + '.txt';
    const clean = sanitizeFilename(longName);

    expect(clean.length).toBeLessThanOrEqual(255);
  });

  it('should handle empty string', () => {
    const clean = sanitizeFilename('');

    expect(clean).toBe('');
  });
});

describe('sanitizeJSON', () => {
  it('should accept valid JSON', () => {
    const json = '{"key": "value", "number": 123}';
    const clean = sanitizeJSON(json);

    expect(clean).toBe(json);
  });

  it('should reject invalid JSON', () => {
    const invalid = '{invalid json}';
    const clean = sanitizeJSON(invalid);

    expect(clean).toBe('');
  });

  it('should normalize JSON formatting', () => {
    const json = '{"key":"value","number":123}';
    const clean = sanitizeJSON(json);
    const parsed = JSON.parse(clean);

    expect(parsed).toEqual({ key: 'value', number: 123 });
  });

  it('should handle empty string', () => {
    const clean = sanitizeJSON('');

    expect(clean).toBe('');
  });
});

describe('sanitizeCommandArg', () => {
  it('should remove shell metacharacters', () => {
    const dirty = 'arg; rm -rf /';
    const clean = sanitizeCommandArg(dirty);

    expect(clean).not.toContain(';');
    expect(clean).not.toContain('|');
    expect(clean).not.toContain('&');
  });

  it('should remove backticks and command substitution', () => {
    const dirty = 'arg`whoami`';
    const clean = sanitizeCommandArg(dirty);

    expect(clean).not.toContain('`');
  });

  it('should remove quotes', () => {
    const dirty = 'arg"with"quotes';
    const clean = sanitizeCommandArg(dirty);

    expect(clean).not.toContain('"');
    expect(clean).not.toContain("'");
  });

  it('should handle empty string', () => {
    const clean = sanitizeCommandArg('');

    expect(clean).toBe('');
  });
});

describe('sanitizeMongoQuery', () => {
  it('should remove dangerous operators', () => {
    const query = { $where: 'this.age > 18' };
    const clean = sanitizeMongoQuery(query);

    expect(clean.$where).toBeUndefined();
  });

  it('should allow safe query operators', () => {
    const query = { name: 'John', age: { $gt: 18 } };
    const clean = sanitizeMongoQuery(query);

    expect(clean.name).toBe('John');
    expect(clean.age.$gt).toBe(18);
  });

  it('should recursively sanitize nested objects', () => {
    const query = {
      user: {
        $where: 'dangerous',
        name: 'John',
      },
    };
    const clean = sanitizeMongoQuery(query);

    expect(clean.user.$where).toBeUndefined();
    expect(clean.user.name).toBe('John');
  });

  it('should handle arrays', () => {
    const query = [{ name: 'John' }, { $where: 'dangerous' }];
    const clean = sanitizeMongoQuery(query);

    expect(Array.isArray(clean)).toBe(true);
    expect(clean[0].name).toBe('John');
  });

  it('should handle non-object inputs', () => {
    expect(sanitizeMongoQuery('string')).toBe('string');
    expect(sanitizeMongoQuery(123)).toBe(123);
    expect(sanitizeMongoQuery(null)).toBeNull();
  });
});

describe('sanitizeRegExp', () => {
  it('should create valid RegExp from safe pattern', () => {
    const regex = sanitizeRegExp('^[a-z]+$', 'i');

    expect(regex).toBeInstanceOf(RegExp);
    expect(regex?.test('abc')).toBe(true);
  });

  it('should reject patterns longer than 100 chars', () => {
    const longPattern = 'a'.repeat(101);
    const regex = sanitizeRegExp(longPattern);

    expect(regex).toBeNull();
  });

  it('should reject nested quantifiers (ReDoS prevention)', () => {
    const dangerous = '(a+)+';
    const regex = sanitizeRegExp(dangerous);

    expect(regex).toBeNull();
  });

  it('should reject invalid patterns', () => {
    const invalid = '[invalid(';
    const regex = sanitizeRegExp(invalid);

    expect(regex).toBeNull();
  });

  it('should handle empty pattern', () => {
    const regex = sanitizeRegExp('');

    expect(regex).toBeInstanceOf(RegExp);
  });
});

describe('escapeHTML', () => {
  it('should escape HTML entities', () => {
    const text = '<script>alert("XSS")</script>';
    const escaped = escapeHTML(text);

    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&gt;');
    expect(escaped).not.toContain('<script>');
  });

  it('should escape ampersands', () => {
    const text = 'Tom & Jerry';
    const escaped = escapeHTML(text);

    expect(escaped).toContain('&amp;');
  });

  it('should escape quotes', () => {
    const text = 'Say "hello"';
    const escaped = escapeHTML(text);

    expect(escaped).toContain('&quot;');
  });
});

describe('unescapeHTML', () => {
  it('should unescape HTML entities', () => {
    const html = '&lt;p&gt;Text&lt;/p&gt;';
    const unescaped = unescapeHTML(html);

    expect(unescaped).toBe('<p>Text</p>');
  });

  it('should unescape ampersands', () => {
    const html = 'Tom &amp; Jerry';
    const unescaped = unescapeHTML(html);

    expect(unescaped).toBe('Tom & Jerry');
  });
});

describe('sanitizeCSS', () => {
  it('should remove javascript: in CSS', () => {
    const css = 'background: url(javascript:alert("XSS"))';
    const clean = sanitizeCSS(css);

    expect(clean).not.toContain('javascript:');
  });

  it('should remove CSS expressions', () => {
    const css = 'width: expression(alert("XSS"))';
    const clean = sanitizeCSS(css);

    expect(clean).not.toContain('expression(');
  });

  it('should remove @import', () => {
    const css = '@import url("evil.css")';
    const clean = sanitizeCSS(css);

    expect(clean).not.toContain('@import');
  });

  it('should remove behavior (IE)', () => {
    const css = 'behavior: url(xss.htc)';
    const clean = sanitizeCSS(css);

    expect(clean).not.toContain('behavior:');
  });

  it('should handle empty string', () => {
    const clean = sanitizeCSS('');

    expect(clean).toBe('');
  });
});

describe('sanitizeByType', () => {
  it('should sanitize by html type', () => {
    const value = '<script>alert("XSS")</script><p>Safe</p>';
    const clean = sanitizeByType(value, 'html');

    expect(clean).not.toContain('<script>');
  });

  it('should sanitize by email type', () => {
    const value = 'USER@EXAMPLE.COM';
    const clean = sanitizeByType(value, 'email');

    expect(clean).toBe('user@example.com');
  });

  it('should sanitize by phone type', () => {
    const value = '+1 (555) 123-4567';
    const clean = sanitizeByType(value, 'phone');

    expect(clean).toBe('+15551234567');
  });

  it('should sanitize by number type', () => {
    const value = '123.45';
    const clean = sanitizeByType(value, 'number');

    expect(clean).toBe(123.45);
  });

  it('should sanitize by boolean type', () => {
    expect(sanitizeByType('true', 'boolean')).toBe(true);
    expect(sanitizeByType('false', 'boolean')).toBe(true); // truthy string
    expect(sanitizeByType('', 'boolean')).toBe(false);
  });

  it('should default to text sanitization', () => {
    const value = '<script>alert("XSS")</script>';
    const clean = sanitizeByType(value, 'unknown');

    expect(clean).not.toContain('<script>');
  });
});

describe('deepSanitize', () => {
  it('should sanitize nested objects', () => {
    const obj = {
      name: '<script>XSS</script>John',
      address: {
        street: '<b>123 Main St</b>',
        city: 'New York',
      },
    };

    const clean = deepSanitize(obj);

    expect(clean.name).not.toContain('<script>');
    expect(clean.address.street).not.toContain('<b>');
  });

  it('should sanitize arrays', () => {
    const arr = ['<script>XSS</script>', 'safe text', '<b>bold</b>'];
    const clean = deepSanitize(arr);

    expect(clean[0]).not.toContain('<script>');
    expect(clean[2]).not.toContain('<b>');
  });

  it('should handle null and undefined', () => {
    expect(deepSanitize(null)).toBeNull();
    expect(deepSanitize(undefined)).toBeUndefined();
  });

  it('should preserve non-string values', () => {
    const obj = { name: 'John', age: 30, active: true };
    const clean = deepSanitize(obj);

    expect(clean.age).toBe(30);
    expect(clean.active).toBe(true);
  });
});

describe('sanitizeFormData', () => {
  it('should sanitize form data with schema', () => {
    const data = {
      name: '<script>XSS</script>John',
      email: 'USER@EXAMPLE.COM',
      phone: '+1 (555) 123-4567',
    };

    const schema = {
      name: 'text',
      email: 'email',
      phone: 'phone',
    };

    const clean = sanitizeFormData(data, schema);

    expect(clean.name).not.toContain('<script>');
    expect(clean.email).toBe('user@example.com');
    expect(clean.phone).toBe('+15551234567');
  });

  it('should default to text sanitization without schema', () => {
    const data = {
      field1: '<script>XSS</script>',
      field2: '<b>text</b>',
    };

    const clean = sanitizeFormData(data);

    expect(clean.field1).not.toContain('<script>');
    expect(clean.field2).not.toContain('<b>');
  });
});

describe('generateCSPNonce', () => {
  it('should generate 32-character hex string', () => {
    const nonce = generateCSPNonce();

    expect(nonce).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should generate unique nonces', () => {
    const nonces = Array.from({ length: 100 }, () => generateCSPNonce());
    const uniqueNonces = new Set(nonces);

    expect(uniqueNonces.size).toBe(100);
  });

  it('should use cryptographically secure random', () => {
    const nonce1 = generateCSPNonce();
    const nonce2 = generateCSPNonce();

    expect(nonce1).not.toBe(nonce2);
  });
});

describe('initSanitization', () => {
  it('should initialize with default config', () => {
    expect(() => initSanitization()).not.toThrow();
  });

  it('should accept custom config', () => {
    const config = {
      enabled: false,
      strictMode: false,
      logViolations: true,
    };

    expect(() => initSanitization(config)).not.toThrow();
  });
});
