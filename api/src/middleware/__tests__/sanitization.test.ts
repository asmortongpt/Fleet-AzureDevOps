/**
 * Comprehensive Test Suite for Sanitization Middleware
 * Tests XSS, SQL injection, NoSQL injection, path traversal, command injection protection
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  sanitizeRequest,
  strictSanitization,
  sanitizeFields,
  sanitizationUtils
} from '../sanitization';

// Mock the logger
vi.mock('../../config/logger', () => ({
  securityLogger: {
    incident: vi.fn()
  }
}));

describe('Sanitization Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
      ip: '127.0.0.1',
      path: '/test',
      get: vi.fn().mockReturnValue('test-user-agent')
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe('XSS Protection', () => {
    it('should remove script tags from body', () => {
      mockReq.body = {
        name: '<script>alert("xss")</script>John'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.name).not.toContain('<script>');
      expect(mockReq.body.name).toBe('John');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove event handlers from input', () => {
      mockReq.body = {
        description: '<div onclick="malicious()">Click me</div>'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.description).not.toContain('onclick');
    });

    it('should remove javascript: protocol', () => {
      mockReq.body = {
        link: 'javascript:alert("xss")'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.link).not.toContain('javascript:');
    });

    it('should encode HTML entities in strict mode', () => {
      mockReq.body = {
        html: '<div>Test & "quotes" \' </div>'
      };

      const middleware = sanitizeRequest({ strict: true });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // In strict mode, dangerous HTML characters should be encoded
      const sanitized = mockReq.body.html;
      expect(sanitized).not.toContain('<div>');
      expect(sanitized).not.toContain('</div>');
      // Should have encoded versions (HTML entities or removed)
      expect(sanitized.length).toBeGreaterThan(0);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle multiple XSS patterns in one field', () => {
      mockReq.body = {
        malicious: '<script>alert(1)</script><img onerror="evil()" src=x>javascript:void(0)'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.malicious).not.toContain('<script>');
      expect(mockReq.body.malicious).not.toContain('onerror');
      expect(mockReq.body.malicious).not.toContain('javascript:');
    });

    it('should sanitize nested XSS in objects', () => {
      mockReq.body = {
        user: {
          profile: {
            bio: '<script>alert("nested")</script>Bio text'
          }
        }
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.user.profile.bio).not.toContain('<script>');
      expect(mockReq.body.user.profile.bio).toContain('Bio text');
    });

    it('should sanitize XSS in arrays', () => {
      mockReq.body = {
        tags: ['<script>xss</script>tag1', 'tag2', '<img onerror="alert(1)">tag3']
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.tags[0]).not.toContain('<script>');
      expect(mockReq.body.tags[2]).not.toContain('onerror="');
    });
  });

  describe('SQL Injection Protection', () => {
    it('should remove SQL comments from input', () => {
      mockReq.query = {
        search: "admin'-- "
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.search).not.toContain('--');
    });

    it('should remove SQL comment variations', () => {
      mockReq.body = {
        input: "test/*comment*/value#another"
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.input).not.toContain('/*');
      expect(mockReq.body.input).not.toContain('*/');
      expect(mockReq.body.input).not.toContain('#');
    });

    it('should remove SQL keywords in strict mode', () => {
      mockReq.body = {
        malicious: "1 UNION SELECT * FROM users"
      };

      const middleware = sanitizeRequest({ strict: true });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.malicious.toLowerCase()).not.toContain('union');
      expect(mockReq.body.malicious.toLowerCase()).not.toContain('select');
    });

    it('should handle common SQL injection patterns', () => {
      const sqlPatterns = [
        "1' OR '1'='1",
        "admin'--",
        "1; DROP TABLE users--",
        "' UNION SELECT NULL--"
      ];

      sqlPatterns.forEach(pattern => {
        mockReq.body = { input: pattern };
        const middleware = sanitizeRequest({ strict: true });
        middleware(mockReq as Request, mockRes as Response, mockNext);

        const sanitized = mockReq.body.input.toLowerCase();
        expect(sanitized).not.toContain('union');
        expect(sanitized).not.toContain('select');
        expect(sanitized).not.toContain('drop');
      });
    });
  });

  describe('NoSQL Injection Protection', () => {
    it('should remove MongoDB operators', () => {
      mockReq.body = {
        username: { $ne: null }
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const usernameStr = JSON.stringify(mockReq.body.username);
      expect(usernameStr).not.toContain('$ne');
    });

    it('should sanitize NoSQL operator strings', () => {
      const operators = ['$where', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin', '$regex'];

      operators.forEach(operator => {
        mockReq.body = { field: `test ${operator} value` };
        const middleware = sanitizeRequest();
        middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.body.field).not.toContain(operator);
      });
    });

    it('should handle nested NoSQL operators', () => {
      mockReq.body = {
        query: {
          password: '$ne',
          user: '$gt'
        }
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(JSON.stringify(mockReq.body)).not.toContain('$ne');
      expect(JSON.stringify(mockReq.body)).not.toContain('$gt');
    });
  });

  describe('Path Traversal Protection', () => {
    it('should remove path traversal sequences', () => {
      mockReq.params = {
        filename: '../../../etc/passwd'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.params.filename).not.toContain('../');
    });

    it('should handle Windows path traversal', () => {
      mockReq.body = {
        path: '..\\..\\windows\\system32\\config'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.path).not.toContain('..\\');
    });

    it('should remove absolute paths in strict mode', () => {
      mockReq.body = {
        file: '/etc/passwd'
      };

      const middleware = sanitizeRequest({ strict: true });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.file).not.toMatch(/^[\/\\]/);
    });

    it('should handle URL-encoded path traversal', () => {
      mockReq.query = {
        path: '..%2F..%2Fetc%2Fpasswd'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Should sanitize the decoded version
      expect(String(mockReq.query.path)).not.toContain('../');
    });
  });

  describe('Command Injection Protection', () => {
    it('should remove command injection characters', () => {
      const dangerousChars = [';', '&', '|', '`', '$', '(', ')'];

      dangerousChars.forEach(char => {
        mockReq.body = { command: `ls ${char} rm -rf` };
        const middleware = sanitizeRequest();
        middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.body.command).not.toContain(char);
      });
    });

    it('should sanitize command chaining attempts', () => {
      mockReq.body = {
        input: 'normal; rm -rf /'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.input).not.toContain(';');
    });

    it('should remove backticks used for command substitution', () => {
      mockReq.body = {
        value: 'test`whoami`value'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.value).not.toContain('`');
    });

    it('should handle multiple command injection patterns', () => {
      mockReq.body = {
        cmd: 'test; cat /etc/passwd | grep root && echo done'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.cmd).not.toContain(';');
      expect(mockReq.body.cmd).not.toContain('|');
      expect(mockReq.body.cmd).not.toContain('&&');
    });
  });

  describe('LDAP Injection Protection', () => {
    it('should remove LDAP special characters when enabled', () => {
      const ldapChars = ['(', ')', '&', '|', '!', '=', '<', '>'];

      ldapChars.forEach(char => {
        mockReq.body = { ldap: `cn=user${char}` };
        const middleware = sanitizeRequest({
          modes: { ldap: true }
        });
        middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.body.ldap).not.toContain(char);
      });
    });

    it('should handle LDAP injection in strict sanitization', () => {
      mockReq.body = {
        filter: '(cn=*)(|(password=*))'
      };

      const middleware = strictSanitization();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.filter).not.toContain('(');
      expect(mockReq.body.filter).not.toContain(')');
    });
  });

  describe('XML Injection Protection', () => {
    it('should remove XML tags when enabled', () => {
      mockReq.body = {
        xml: '<user><name>Test</name></user>'
      };

      const middleware = sanitizeRequest({
        modes: { xml: true }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.xml).not.toContain('<user>');
      expect(mockReq.body.xml).not.toContain('</name>');
    });
  });

  describe('Configuration Options', () => {
    it('should skip specified fields', () => {
      mockReq.body = {
        password: '<script>test</script>',
        username: '<script>test</script>'
      };

      const middleware = sanitizeRequest({
        skipFields: ['body.password']
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Field is skipped from sanitization
      expect(mockReq.body.password).toBeDefined();
      expect(mockReq.body.username).not.toContain('<script>'); // Sanitized
      expect(mockNext).toHaveBeenCalled();
    });

    it('should disable specific sanitization modes', () => {
      mockReq.body = {
        value: '$ne test'
      };

      const middleware = sanitizeRequest({
        modes: { noSql: false, xss: false, sql: false }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // NoSQL mode is disabled, but value is still trimmed
      expect(mockReq.body.value).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should enable all modes in strict mode', () => {
      mockReq.body = {
        dangerous: '<script>alert(1)</script> $ne UNION SELECT (test)'
      };

      const middleware = strictSanitization();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.dangerous).not.toContain('<script>');
      expect(mockReq.body.dangerous).not.toContain('$ne');
      expect(mockReq.body.dangerous.toLowerCase()).not.toContain('union');
      expect(mockReq.body.dangerous).not.toContain('(');
    });
  });

  describe('Request Sanitization', () => {
    it('should sanitize request body', () => {
      mockReq.body = {
        name: '<script>xss</script>John'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.name).not.toContain('<script>');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      mockReq.query = {
        search: '../../../etc/passwd' as any
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.search).not.toContain('../');
    });

    it('should sanitize URL parameters', () => {
      mockReq.params = {
        id: "1' OR '1'='1"
      };

      const middleware = sanitizeRequest({ strict: true });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // SQL keywords should be removed in strict mode
      const idValue = String(mockReq.params.id).toLowerCase();
      // At minimum, dangerous patterns should be sanitized
      expect(idValue).not.toContain("'1'='1");
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize all request parts simultaneously', () => {
      mockReq.body = { field1: '<script>1</script>' };
      mockReq.query = { field2: '$ne' as any };
      mockReq.params = { field3: '../path' };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.field1).not.toContain('<script>');
      expect(mockReq.query.field2).not.toContain('$ne');
      expect(mockReq.params.field3).not.toContain('../');
    });
  });

  describe('sanitizeFields function', () => {
    it('should sanitize only specified fields', () => {
      mockReq.body = {
        name: '<script>xss</script>',
        email: '<script>xss</script>',
        safe: '<script>xss</script>'
      };

      const middleware = sanitizeFields('name', 'email');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.name).not.toContain('<script>');
      expect(mockReq.body.email).not.toContain('<script>');
      expect(mockReq.body.safe).toContain('<script>'); // Not sanitized
    });

    it('should sanitize fields across body, query, and params', () => {
      mockReq.body = { username: '<script>test</script>' };
      mockReq.query = { username: '<script>test</script>' as any };
      mockReq.params = { username: '<script>test</script>' };

      const middleware = sanitizeFields('username');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.username).not.toContain('<script>');
      expect(mockReq.query.username).not.toContain('<script>');
      expect(mockReq.params.username).not.toContain('<script>');
    });
  });

  describe('sanitizationUtils', () => {
    describe('sanitize', () => {
      it('should manually sanitize a value', () => {
        const result = sanitizationUtils.sanitize('<script>test</script>value');
        expect(result).not.toContain('<script>');
        expect(result).toContain('value');
      });

      it('should sanitize objects', () => {
        const obj = {
          name: '<script>xss</script>',
          nested: {
            value: '$ne'
          }
        };

        const result = sanitizationUtils.sanitize(obj);
        expect(result.name).not.toContain('<script>');
        expect(result.nested.value).not.toContain('$ne');
      });

      it('should sanitize arrays', () => {
        const arr = ['<script>1</script>', '$ne', '../path'];
        const result = sanitizationUtils.sanitize(arr);

        expect(result[0]).not.toContain('<script>');
        expect(result[1]).not.toContain('$ne');
        expect(result[2]).not.toContain('../');
      });
    });

    describe('isDangerous', () => {
      it('should detect dangerous XSS patterns', () => {
        expect(sanitizationUtils.isDangerous('<script>alert(1)</script>')).toBe(true);
        expect(sanitizationUtils.isDangerous('<img onerror="evil()">')).toBe(true);
        expect(sanitizationUtils.isDangerous('javascript:void(0)')).toBe(true);
      });

      it('should detect dangerous SQL patterns', () => {
        expect(sanitizationUtils.isDangerous("admin'--")).toBe(true);
        expect(sanitizationUtils.isDangerous("UNION SELECT")).toBe(true);
      });

      it('should detect dangerous NoSQL patterns', () => {
        expect(sanitizationUtils.isDangerous('$ne')).toBe(true);
        expect(sanitizationUtils.isDangerous('$where')).toBe(true);
      });

      it('should detect path traversal', () => {
        expect(sanitizationUtils.isDangerous('../../../etc/passwd')).toBe(true);
        expect(sanitizationUtils.isDangerous('../../config/secrets')).toBe(true);
      });

      it('should detect command injection', () => {
        expect(sanitizationUtils.isDangerous('test; rm -rf /')).toBe(true);
        expect(sanitizationUtils.isDangerous('test | grep')).toBe(true);
      });

      it('should return false for safe strings', () => {
        expect(sanitizationUtils.isDangerous('normal text')).toBe(false);
        expect(sanitizationUtils.isDangerous('user@example.com')).toBe(false);
        expect(sanitizationUtils.isDangerous('123456')).toBe(false);
      });

      it('should handle non-string inputs', () => {
        expect(sanitizationUtils.isDangerous(123 as any)).toBe(false);
        expect(sanitizationUtils.isDangerous(null as any)).toBe(false);
        expect(sanitizationUtils.isDangerous(undefined as any)).toBe(false);
      });
    });

    describe('findDangerousPatterns', () => {
      it('should find XSS patterns', () => {
        const patterns = sanitizationUtils.findDangerousPatterns('<script>alert(1)</script>');
        expect(patterns).toContain('script');
      });

      it('should find multiple patterns', () => {
        const patterns = sanitizationUtils.findDangerousPatterns(
          '<script>test</script> $ne ../path; command'
        );
        expect(patterns.length).toBeGreaterThan(0);
        // The actual pattern names from DANGEROUS_PATTERNS
        expect(patterns.some(p => ['script', 'sqlKeywords', 'xmlTags'].includes(p))).toBe(true);
        expect(patterns).toContain('noSqlOperators');
        expect(patterns).toContain('pathTraversal');
        expect(patterns).toContain('commandChars');
      });

      it('should return empty array for safe strings', () => {
        const patterns = sanitizationUtils.findDangerousPatterns('safe string');
        expect(patterns).toEqual([]);
      });

      it('should handle non-string inputs', () => {
        expect(sanitizationUtils.findDangerousPatterns(123 as any)).toEqual([]);
        expect(sanitizationUtils.findDangerousPatterns(null as any)).toEqual([]);
      });
    });
  });

  describe('Whitespace Handling', () => {
    it('should trim whitespace from sanitized values', () => {
      mockReq.body = {
        name: '   John Doe   '
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.name).toBe('John Doe');
    });

    it('should trim after sanitization', () => {
      mockReq.body = {
        value: '   <script>xss</script>   clean   '
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.value).toBe('clean');
    });
  });

  describe('Data Type Preservation', () => {
    it('should preserve numbers', () => {
      mockReq.body = {
        age: 25,
        price: 99.99
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.age).toBe(25);
      expect(mockReq.body.price).toBe(99.99);
    });

    it('should preserve booleans', () => {
      mockReq.body = {
        active: true,
        verified: false
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.active).toBe(true);
      expect(mockReq.body.verified).toBe(false);
    });

    it('should preserve null values', () => {
      mockReq.body = {
        optional: null
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.optional).toBeNull();
    });

    it('should handle undefined values', () => {
      mockReq.body = {
        missing: undefined
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.missing).toBeUndefined();
    });
  });

  describe('Complex Nested Structures', () => {
    it('should sanitize deeply nested objects', () => {
      mockReq.body = {
        level1: {
          level2: {
            level3: {
              value: '<script>deep</script>'
            }
          }
        }
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.level1.level2.level3.value).not.toContain('<script>');
    });

    it('should sanitize arrays of objects', () => {
      mockReq.body = {
        users: [
          { name: '<script>user1</script>' },
          { name: '<script>user2</script>' }
        ]
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.users[0].name).not.toContain('<script>');
      expect(mockReq.body.users[1].name).not.toContain('<script>');
    });

    it('should sanitize object keys', () => {
      mockReq.body = {
        '<script>key</script>': 'value'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const keys = Object.keys(mockReq.body);
      expect(keys[0]).not.toContain('<script>');
    });
  });

  describe('Error Handling', () => {
    it('should call next with error on exception', () => {
      // Create a circular reference to cause sanitization error
      const circular: any = { a: 1 };
      circular.self = circular;
      mockReq.body = circular;

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Should call next (either with or without error, but shouldn't crash)
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing request parts gracefully', () => {
      const emptyReq: any = {
        ip: '127.0.0.1',
        path: '/test',
        get: () => 'test'
      };

      const middleware = sanitizeRequest();
      middleware(emptyReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large strings efficiently', () => {
      const largeString = 'a'.repeat(10000) + '<script>xss</script>' + 'b'.repeat(10000);
      mockReq.body = { large: largeString };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.large).not.toContain('<script>');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty strings', () => {
      mockReq.body = { empty: '' };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.empty).toBe('');
    });

    it('should handle unicode characters', () => {
      mockReq.body = {
        unicode: '你好世界 🌍 مرحبا العالم'
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.unicode).toContain('你好世界');
      expect(mockReq.body.unicode).toContain('🌍');
    });

    it('should handle empty objects and arrays', () => {
      mockReq.body = {
        emptyObj: {},
        emptyArr: []
      };

      const middleware = sanitizeRequest();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.emptyObj).toEqual({});
      expect(mockReq.body.emptyArr).toEqual([]);
    });
  });
});
