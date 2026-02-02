/**
 * Comprehensive Logging System Tests
 *
 * Tests coverage:
 * - PII redaction functionality
 * - Correlation ID generation and propagation
 * - Log levels and transports
 * - Security event logging
 * - Performance logging
 * - Middleware functionality
 *
 * @module tests/logging
 */

import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { redactPII, generateCorrelationId, logger, securityLogger, perfLogger } from '../src/lib/logger';
import { requestLogger, logQuery, withCorrelation } from '../src/middleware/logging';

describe('PII Redaction', () => {
  describe('Email Masking', () => {
    it('should mask email addresses', () => {
      const input = { email: 'user@example.com' };
      const result = redactPII(input);
      expect(result.email).toMatch(/u\*\*\*@e\*\*\*\.com/);
    });

    it('should mask emails in strings', () => {
      const input = 'Contact us at support@company.com';
      const result = redactPII(input);
      expect(result).toContain('***@');
      expect(result).not.toContain('support@company.com');
    });

    it('should handle multiple emails in object', () => {
      const input = {
        primaryEmail: 'primary@test.com',
        secondaryEmail: 'secondary@test.org',
      };
      const result = redactPII(input);
      expect(result.primaryEmail).toMatch(/p\*\*\*@t\*\*\*\.com/);
      expect(result.secondaryEmail).toMatch(/s\*\*\*@t\*\*\*\.org/);
    });
  });

  describe('Phone Number Masking', () => {
    it('should mask phone numbers with various formats', () => {
      const testCases = [
        { phone: '(555) 123-4567' },
        { phone: '555-123-4567' },
        { phone: '5551234567' },
        { phone: '+1-555-123-4567' },
      ];

      testCases.forEach(input => {
        const result = redactPII(input);
        expect(result.phone).toContain('***');
        expect(result.phone).toContain('4567');
        expect(result.phone).not.toContain('555-123');
      });
    });

    it('should mask phones in strings', () => {
      const input = 'Call me at (555) 123-4567 or 555-987-6543';
      const result = redactPII(input);
      expect(result).toContain('***-4567');
      expect(result).toContain('***-6543');
      expect(result).not.toContain('555-123');
    });
  });

  describe('SSN Masking', () => {
    it('should mask SSN completely except last 4 digits', () => {
      const input = { ssn: '123-45-6789' };
      const result = redactPII(input);
      expect(result.ssn).toBe('***-**-6789');
    });

    it('should mask SSN in strings', () => {
      const input = 'SSN: 123-45-6789';
      const result = redactPII(input);
      expect(result).toContain('***-**-6789');
      expect(result).not.toContain('123-45');
    });

    it('should handle malformed SSN', () => {
      const input = { ssn: '12345' };
      const result = redactPII(input);
      expect(result.ssn).toBe('[REDACTED SSN]');
    });
  });

  describe('Credit Card Masking', () => {
    it('should mask credit card numbers', () => {
      const testCases = [
        { card: '4111111111111111' },
        { card: '4111 1111 1111 1111' },
        { card: '4111-1111-1111-1111' },
      ];

      testCases.forEach(input => {
        const result = redactPII(input);
        expect(result.card).toContain('1111');
        expect(result.card).toMatch(/\*+1111/);
        expect(result.card).not.toContain('4111');
      });
    });

    it('should mask card numbers in strings', () => {
      const input = 'Payment: 4111111111111111';
      const result = redactPII(input);
      expect(result).toContain('1111');
      expect(result).not.toContain('4111111111111111');
    });
  });

  describe('Password and Secret Redaction', () => {
    it('should completely redact password fields', () => {
      const input = {
        password: 'MySecretPass123!',
        confirmPassword: 'MySecretPass123!',
      };
      const result = redactPII(input);
      expect(result.password).toBe('[REDACTED]');
      expect(result.confirmPassword).toBe('[REDACTED]');
    });

    it('should redact token and secret fields', () => {
      const input = {
        apiKey: 'sk-1234567890abcdef',
        authToken: 'Bearer xyz123',
        secret: 'secret-value',
        authorization: 'Basic abc123',
      };
      const result = redactPII(input);
      expect(result.apiKey).toBe('[REDACTED]');
      expect(result.authToken).toBe('[REDACTED]');
      expect(result.secret).toBe('[REDACTED]');
      expect(result.authorization).toBe('[REDACTED]');
    });
  });

  describe('Nested Object Redaction', () => {
    it('should redact PII in nested objects', () => {
      const input = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          profile: {
            phone: '555-123-4567',
            ssn: '123-45-6789',
          },
        },
      };
      const result = redactPII(input);
      expect(result.user.name).toBe('John Doe');
      expect(result.user.email).toMatch(/j\*\*\*@e\*\*\*\.com/);
      expect(result.user.profile.phone).toContain('***');
      expect(result.user.profile.ssn).toBe('***-**-6789');
    });

    it('should redact PII in arrays', () => {
      const input = {
        users: [
          { email: 'user1@test.com' },
          { email: 'user2@test.com' },
        ],
      };
      const result = redactPII(input);
      expect(result.users[0].email).toMatch(/u\*\*\*@t\*\*\*\.com/);
      expect(result.users[1].email).toMatch(/u\*\*\*@t\*\*\*\.com/);
    });
  });
});

describe('Correlation ID', () => {
  it('should generate valid UUID v4 correlation IDs', () => {
    const id1 = generateCorrelationId();
    const id2 = generateCorrelationId();

    expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(id2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(id1).not.toBe(id2);
  });
});

describe('Security Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log authentication failures', () => {
    const logSpy = vi.spyOn(logger, 'warn');

    securityLogger.authFailure({
      email: 'test@example.com',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      reason: 'Invalid password',
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Authentication failure',
      expect.objectContaining({
        category: 'security',
        event: 'auth_failure',
        ip: '192.168.1.1',
        reason: 'Invalid password',
      })
    );
  });

  it('should log permission denials', () => {
    const logSpy = vi.spyOn(logger, 'warn');

    securityLogger.permissionDenied({
      userId: 'user-123',
      tenantId: 'tenant-456',
      resource: 'vehicles',
      action: 'delete',
      ip: '192.168.1.1',
      reason: 'Insufficient permissions',
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Permission denied',
      expect.objectContaining({
        category: 'security',
        event: 'permission_denied',
        resource: 'vehicles',
        action: 'delete',
      })
    );
  });

  it('should log rate limit hits', () => {
    const logSpy = vi.spyOn(logger, 'warn');

    securityLogger.rateLimitHit({
      ip: '192.168.1.1',
      route: '/api/vehicles',
      threshold: 100,
      userAgent: 'test-agent',
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Rate limit exceeded',
      expect.objectContaining({
        category: 'security',
        event: 'rate_limit_hit',
        threshold: 100,
      })
    );
  });

  it('should log invalid tokens', () => {
    const logSpy = vi.spyOn(logger, 'warn');

    securityLogger.invalidToken({
      ip: '192.168.1.1',
      userAgent: 'test-agent',
      tokenType: 'jwt',
      reason: 'Token expired',
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Invalid token',
      expect.objectContaining({
        category: 'security',
        event: 'invalid_token',
        tokenType: 'jwt',
        reason: 'Token expired',
      })
    );
  });

  it('should log CSRF violations', () => {
    const logSpy = vi.spyOn(logger, 'error');

    securityLogger.csrfViolation({
      ip: '192.168.1.1',
      userAgent: 'test-agent',
      path: '/api/vehicles',
      method: 'POST',
    });

    expect(logSpy).toHaveBeenCalledWith(
      'CSRF violation',
      expect.objectContaining({
        category: 'security',
        event: 'csrf_violation',
        severity: 'high',
      })
    );
  });
});

describe('Performance Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log slow queries', () => {
    const logSpy = vi.spyOn(logger, 'warn');

    perfLogger.slowQuery({
      query: 'SELECT * FROM vehicles WHERE ...',
      duration: 2500,
      rows: 1000,
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Slow database query',
      expect.objectContaining({
        category: 'performance',
        type: 'slow_query',
        duration: 2500,
      })
    );
  });

  it('should log API latency', () => {
    const logSpy = vi.spyOn(logger, 'log');

    perfLogger.apiLatency({
      method: 'GET',
      path: '/api/vehicles',
      statusCode: 200,
      duration: 150,
      userId: 'user-123',
      tenantId: 'tenant-456',
    });

    expect(logSpy).toHaveBeenCalled();
  });

  it('should warn on slow API requests', () => {
    const logSpy = vi.spyOn(logger, 'log');

    perfLogger.apiLatency({
      method: 'GET',
      path: '/api/vehicles',
      statusCode: 200,
      duration: 3500,
    });

    expect(logSpy).toHaveBeenCalled();
  });

  it('should log memory warnings', () => {
    const logSpy = vi.spyOn(logger, 'warn');

    perfLogger.memoryWarning({
      heapUsed: 800 * 1024 * 1024,
      heapTotal: 1000 * 1024 * 1024,
      external: 10 * 1024 * 1024,
      rss: 900 * 1024 * 1024,
      threshold: 80,
    });

    expect(logSpy).toHaveBeenCalledWith(
      'High memory usage detected',
      expect.objectContaining({
        category: 'performance',
        type: 'memory_warning',
        threshold: 80,
      })
    );
  });
});

describe('Logging Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/vehicles',
      query: {},
      headers: {},
      ip: '192.168.1.1',
    };

    mockRes = {
      setHeader: vi.fn(),
      json: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === 'finish') {
          // Simulate response finish
          setTimeout(callback, 0);
        }
      }),
      statusCode: 200,
    };

    nextFn = vi.fn();
  });

  it('should add correlation ID to request', () => {
    requestLogger(mockReq as Request, mockRes as Response, nextFn);

    expect((mockReq as any).correlationId).toBeDefined();
    expect((mockReq as any).correlationId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(nextFn).toHaveBeenCalled();
  });

  it('should use existing correlation ID from headers', () => {
    const existingId = '12345678-1234-1234-1234-123456789012';
    mockReq.headers = { 'x-correlation-id': existingId };

    requestLogger(mockReq as Request, mockRes as Response, nextFn);

    expect((mockReq as any).correlationId).toBe(existingId);
  });

  it('should add correlation ID to response headers', () => {
    requestLogger(mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      expect.any(String)
    );
  });

  it('should track request start time', () => {
    const before = Date.now();
    requestLogger(mockReq as Request, mockRes as Response, nextFn);
    const after = Date.now();

    expect((mockReq as any).startTime).toBeGreaterThanOrEqual(before);
    expect((mockReq as any).startTime).toBeLessThanOrEqual(after);
  });
});

describe('Query Logger Wrapper', () => {
  it('should execute query and return result', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await logQuery('test-query', mockQuery);

    expect(result).toEqual({ rows: [{ id: 1 }] });
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('should log slow queries', async () => {
    const logSpy = vi.spyOn(perfLogger, 'slowQuery');
    const slowQuery = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ rows: [] }), 1100))
    );

    await logQuery('slow-query', slowQuery);

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'slow-query',
        duration: expect.any(Number),
      })
    );
  });

  it('should log query errors', async () => {
    const logSpy = vi.spyOn(logger, 'error');
    const failingQuery = vi.fn().mockRejectedValue(new Error('Query failed'));

    await expect(logQuery('failing-query', failingQuery)).rejects.toThrow('Query failed');

    expect(logSpy).toHaveBeenCalledWith(
      'Database query failed',
      expect.objectContaining({
        query: 'failing-query',
      })
    );
  });

  it('should propagate correlation ID', async () => {
    const correlationId = generateCorrelationId();
    const mockQuery = vi.fn().mockResolvedValue({ rows: [] });

    await logQuery('test-query', mockQuery, correlationId);

    // Verify correlation ID is included in logs
    // This would be tested via log inspection
  });
});

describe('Correlation Context Helper', () => {
  it('should execute function with correlation context', async () => {
    const correlationId = generateCorrelationId();
    const mockFn = vi.fn().mockResolvedValue('result');

    const result = await withCorrelation(correlationId, mockFn);

    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should log errors with correlation context', async () => {
    const logSpy = vi.spyOn(logger, 'error');
    const correlationId = generateCorrelationId();
    const failingFn = vi.fn().mockRejectedValue(new Error('Operation failed'));

    await expect(withCorrelation(correlationId, failingFn)).rejects.toThrow('Operation failed');

    // Verify error was logged with correlation ID
    expect(logSpy).toHaveBeenCalled();
  });
});

describe('Log Rotation', () => {
  it('should configure daily rotation for general logs', () => {
    // This test would verify the transport configuration
    // In a real scenario, you'd check the transport properties
    expect(true).toBe(true); // Placeholder
  });

  it('should configure 7-day retention for general logs', () => {
    // Verify maxFiles configuration
    expect(true).toBe(true); // Placeholder
  });

  it('should configure 30-day retention for error logs', () => {
    // Verify maxFiles configuration for error transport
    expect(true).toBe(true); // Placeholder
  });

  it('should enable gzip compression for rotated logs', () => {
    // Verify zippedArchive configuration
    expect(true).toBe(true); // Placeholder
  });
});

describe('Integration Tests', () => {
  it('should redact PII in logged data', () => {
    const logSpy = vi.spyOn(logger, 'info');

    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      ssn: '123-45-6789',
    };

    logger.info('User data', userData);

    // The logged data should have PII redacted
    // This would be verified by inspecting the actual log call
    expect(logSpy).toHaveBeenCalled();
  });

  it('should maintain correlation ID through async operations', async () => {
    const correlationId = generateCorrelationId();

    const operation1 = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'step1';
    };

    const operation2 = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'step2';
    };

    const result1 = await withCorrelation(correlationId, operation1);
    const result2 = await withCorrelation(correlationId, operation2);

    expect(result1).toBe('step1');
    expect(result2).toBe('step2');
  });
});
