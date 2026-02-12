/**
 * Comprehensive Test Suite for Security Headers Middleware
 * Tests CSP, HSTS, frame options, and other security headers
 */
import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  securityHeaders,
  strictSecurityHeaders,
  apiSecurityHeaders,
  downloadSecurityHeaders
} from '../security-headers';

describe('Security Headers Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      setHeader: vi.fn(),
      getHeader: vi.fn(),
      removeHeader: vi.fn()
    };
    mockNext = vi.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Content Security Policy (CSP)', () => {
    it('should set default CSP header', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'")
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should include all default CSP directives', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const cspCall = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Content-Security-Policy'
      );
      const cspValue = cspCall[1];

      expect(cspValue).toContain("default-src 'self'");
      expect(cspValue).toContain("base-uri 'self'");
      expect(cspValue).toContain("frame-ancestors 'none'");
      expect(cspValue).toContain("object-src 'none'");
      expect(cspValue).toContain("script-src 'self'");
      expect(cspValue).toContain('upgrade-insecure-requests');
    });

    it('should allow custom CSP directives', () => {
      const middleware = securityHeaders({
        csp: {
          directives: {
            'default-src': ["'none'"],
            'script-src': ["'self'", 'https://cdn.example.com']
          }
        }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const cspCall = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Content-Security-Policy'
      );
      const cspValue = cspCall[1];

      expect(cspValue).toContain("default-src 'none'");
      expect(cspValue).toContain('https://cdn.example.com');
    });

    it('should support CSP report-only mode', () => {
      const middleware = securityHeaders({
        csp: {
          reportOnly: true
        }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy-Report-Only',
        expect.any(String)
      );
    });

    it('should include report URI if provided', () => {
      const reportUri = '/csp-violation-report';
      const middleware = securityHeaders({
        csp: {
          reportUri
        }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const reportOnlyCall = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Content-Security-Policy-Report-Only'
      );

      expect(reportOnlyCall).toBeDefined();
      expect(reportOnlyCall[1]).toContain(`report-uri ${reportUri}`);
    });

    it('should handle CSP directives with empty values', () => {
      const middleware = securityHeaders({
        csp: {
          directives: {
            'upgrade-insecure-requests': []
          }
        }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const cspCall = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Content-Security-Policy'
      );
      const cspValue = cspCall[1];

      expect(cspValue).toContain('upgrade-insecure-requests');
      expect(cspValue).not.toContain('upgrade-insecure-requests ;'); // No trailing space
    });

    it('should merge custom directives with defaults', () => {
      const middleware = securityHeaders({
        csp: {
          directives: {
            'img-src': ["'self'", 'https://images.example.com']
          }
        }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const cspCall = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Content-Security-Policy'
      );
      const cspValue = cspCall[1];

      // Custom directive
      expect(cspValue).toContain('https://images.example.com');
      // Default directives still present
      expect(cspValue).toContain("default-src 'self'");
    });
  });

  describe('HTTP Strict Transport Security (HSTS)', () => {
    it('should set HSTS header in production', () => {
      process.env.NODE_ENV = 'production';

      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.stringContaining('max-age=')
      );
    });

    it('should not set HSTS header in development', () => {
      process.env.NODE_ENV = 'development';

      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const hstsCall = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Strict-Transport-Security'
      );

      expect(hstsCall).toBeUndefined();
    });

    it('should use default max-age of 1 year', () => {
      process.env.NODE_ENV = 'production';

      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.stringContaining('max-age=31536000')
      );
    });

    it('should allow custom max-age', () => {
      process.env.NODE_ENV = 'production';

      const middleware = securityHeaders({
        hsts: {
          maxAge: 63072000 // 2 years
        }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains'
      );
    });

    it('should include includeSubDomains by default', () => {
      process.env.NODE_ENV = 'production';

      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.stringContaining('includeSubDomains')
      );
    });

    it('should allow disabling includeSubDomains', () => {
      process.env.NODE_ENV = 'production';

      const middleware = securityHeaders({
        hsts: {
          includeSubDomains: false
        }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const hstsCall = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Strict-Transport-Security'
      );

      expect(hstsCall[1]).not.toContain('includeSubDomains');
    });

    it('should include preload when configured', () => {
      process.env.NODE_ENV = 'production';

      const middleware = securityHeaders({
        hsts: {
          preload: true
        }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.stringContaining('preload')
      );
    });
  });

  describe('X-Frame-Options', () => {
    it('should set X-Frame-Options to DENY by default', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should allow SAMEORIGIN option', () => {
      const middleware = securityHeaders({
        frameOptions: 'SAMEORIGIN'
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
    });

    it('should allow custom frame options', () => {
      const middleware = securityHeaders({
        frameOptions: 'ALLOW-FROM https://example.com'
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-Frame-Options',
        'ALLOW-FROM https://example.com'
      );
    });
  });

  describe('X-Content-Type-Options', () => {
    it('should set X-Content-Type-Options to nosniff by default', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    it('should allow disabling X-Content-Type-Options', () => {
      const middleware = securityHeaders({
        contentTypeOptions: false
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const call = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'X-Content-Type-Options'
      );

      expect(call).toBeUndefined();
    });
  });

  describe('X-XSS-Protection', () => {
    it('should set X-XSS-Protection by default', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    });

    it('should allow disabling X-XSS-Protection', () => {
      const middleware = securityHeaders({
        xssProtection: false
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const call = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'X-XSS-Protection'
      );

      expect(call).toBeUndefined();
    });
  });

  describe('Referrer-Policy', () => {
    it('should set default Referrer-Policy', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      );
    });

    it('should allow custom Referrer-Policy', () => {
      const middleware = securityHeaders({
        referrerPolicy: 'no-referrer'
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer');
    });
  });

  describe('Permissions-Policy', () => {
    it('should set default Permissions-Policy', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Permissions-Policy',
        expect.stringContaining('accelerometer=()')
      );
    });

    it('should allow geolocation for fleet tracking', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const call = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Permissions-Policy'
      );

      expect(call[1]).toContain("geolocation=('self')");
    });

    it('should restrict camera and microphone by default', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const call = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Permissions-Policy'
      );

      expect(call[1]).toContain('camera=()');
      expect(call[1]).toContain('microphone=()');
    });

    it('should allow custom Permissions-Policy', () => {
      const middleware = securityHeaders({
        permissionsPolicy: {
          'camera': ["'self'"],
          'microphone': ["'self'"]
        }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const call = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Permissions-Policy'
      );

      expect(call[1]).toContain("camera=('self')");
      expect(call[1]).toContain("microphone=('self')");
    });
  });

  describe('Additional Security Headers', () => {
    it('should set X-DNS-Prefetch-Control', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-DNS-Prefetch-Control', 'off');
    });

    it('should set X-Download-Options', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Download-Options', 'noopen');
    });

    it('should set X-Permitted-Cross-Domain-Policies', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-Permitted-Cross-Domain-Policies',
        'none'
      );
    });

    it('should set Cross-Origin-Embedder-Policy', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Cross-Origin-Embedder-Policy',
        'require-corp'
      );
    });

    it('should set Cross-Origin-Opener-Policy', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Cross-Origin-Opener-Policy',
        'same-origin'
      );
    });

    it('should set Cross-Origin-Resource-Policy', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Cross-Origin-Resource-Policy',
        'same-origin'
      );
    });

    it('should remove X-Powered-By header', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    });
  });

  describe('Custom Headers', () => {
    it('should allow adding custom headers', () => {
      const middleware = securityHeaders({
        customHeaders: {
          'X-Custom-Header': 'custom-value',
          'X-App-Version': '1.0.0'
        }
      });
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Custom-Header', 'custom-value');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-App-Version', '1.0.0');
    });
  });

  describe('strictSecurityHeaders', () => {
    it('should set ultra-restrictive CSP', () => {
      const middleware = strictSecurityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const cspCall = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Content-Security-Policy'
      );
      const cspValue = cspCall[1];

      expect(cspValue).toContain("default-src 'none'");
      expect(cspValue).toContain("script-src 'none'");
      expect(cspValue).toContain("style-src 'none'");
      expect(cspValue).toContain("frame-ancestors 'none'");
    });

    it('should set X-Frame-Options to DENY', () => {
      const middleware = strictSecurityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should disable all permissions', () => {
      const middleware = strictSecurityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const permissionsCall = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Permissions-Policy'
      );
      const permissionsValue = permissionsCall[1];

      expect(permissionsValue).toContain('geolocation=()');
      expect(permissionsValue).toContain('camera=()');
      expect(permissionsValue).toContain('microphone=()');
    });
  });

  describe('apiSecurityHeaders', () => {
    it('should set API-appropriate CSP', () => {
      const middleware = apiSecurityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const cspCall = mockRes.setHeader.mock.calls.find(
        (call: any[]) => call[0] === 'Content-Security-Policy'
      );
      const cspValue = cspCall[1];

      expect(cspValue).toContain("default-src 'none'");
      expect(cspValue).toContain("frame-ancestors 'none'");
    });

    it('should set X-Frame-Options to DENY', () => {
      const middleware = apiSecurityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });
  });

  describe('downloadSecurityHeaders', () => {
    it('should set X-Content-Type-Options to nosniff', () => {
      const middleware = downloadSecurityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    it('should set X-Frame-Options to DENY', () => {
      const middleware = downloadSecurityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should force download if Content-Disposition not set', () => {
      mockRes.getHeader = vi.fn().mockReturnValue(undefined);

      const middleware = downloadSecurityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment');
    });

    it('should not override existing Content-Disposition', () => {
      mockRes.getHeader = vi.fn().mockReturnValue('attachment; filename="file.pdf"');

      const middleware = downloadSecurityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const contentDispositionCalls = mockRes.setHeader.mock.calls.filter(
        (call: any[]) => call[0] === 'Content-Disposition'
      );

      expect(contentDispositionCalls.length).toBe(0);
    });

    it('should call next middleware', () => {
      const middleware = downloadSecurityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Header Count and Completeness', () => {
    it('should set all expected security headers', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const headerNames = mockRes.setHeader.mock.calls.map((call: any[]) => call[0]);

      expect(headerNames).toContain('Content-Security-Policy');
      expect(headerNames).toContain('X-Frame-Options');
      expect(headerNames).toContain('X-Content-Type-Options');
      expect(headerNames).toContain('X-XSS-Protection');
      expect(headerNames).toContain('Referrer-Policy');
      expect(headerNames).toContain('Permissions-Policy');
      expect(headerNames).toContain('X-DNS-Prefetch-Control');
      expect(headerNames).toContain('X-Download-Options');
      expect(headerNames).toContain('X-Permitted-Cross-Domain-Policies');
      expect(headerNames).toContain('Cross-Origin-Embedder-Policy');
      expect(headerNames).toContain('Cross-Origin-Opener-Policy');
      expect(headerNames).toContain('Cross-Origin-Resource-Policy');
    });

    it('should set minimum 12 security headers', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader.mock.calls.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should work correctly in test environment', () => {
      process.env.NODE_ENV = 'test';

      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalled();
    });

    it('should work correctly without NODE_ENV', () => {
      delete process.env.NODE_ENV;

      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Integration and Compatibility', () => {
    it('should be chainable', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should not modify request object', () => {
      const originalReq = { ...mockReq };
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq).toEqual(originalReq);
    });

    it('should work with empty configuration', () => {
      const middleware = securityHeaders({});
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalled();
    });
  });

  describe('FedRAMP Compliance', () => {
    it('should implement SC-8 with HSTS in production', () => {
      process.env.NODE_ENV = 'production';

      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.stringContaining('max-age=')
      );
    });

    it('should implement SC-7 with X-Frame-Options', () => {
      const middleware = securityHeaders();
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });
  });
});
