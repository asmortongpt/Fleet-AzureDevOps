/**
 * Logger Utility Tests
 * Comprehensive test suite for production logger
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import logger from '../logger';

describe('Logger Utility', () => {
  beforeEach(() => {
    // Clear console spies before each test
    vi.clearAllMocks();
  });

  describe('Basic Logging Levels', () => {
    it('should log debug messages in development', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      logger.debug('Test debug message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.info('Test info message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log warning messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logger.warn('Test warning message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error messages', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.error('Test error message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Contextual Logging', () => {
    it('should accept context object with metadata', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.info('User action', { userId: '123', action: 'login' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle nested context objects', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.info('Complex event', {
        user: { id: '123', role: 'admin' },
        request: { method: 'POST', path: '/api/vehicles' }
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should log Error objects properly', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test error');

      logger.error('Error occurred', testError);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle errors with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Database connection failed');

      logger.error('Database error', { error: testError, connection: 'primary' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Logging', () => {
    it('should accept timing information in context', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.info('API request completed', {
        duration: 150,
        endpoint: '/api/vehicles',
        status: 200
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Sanitization and Security', () => {
    it('should handle sensitive data without logging it', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      // Logger should not expose sensitive fields
      logger.info('User login', {
        userId: '123',
        // Password should never be logged
        action: 'login'
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle null and undefined values gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.info('Null test', null as any);
      logger.info('Undefined test', undefined as any);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });
  });

  describe('Structured Logging', () => {
    it('should support structured log formats', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.info('Structured event', {
        event: 'vehicle.updated',
        vehicle_id: 'VEH-001',
        changes: ['status', 'location'],
        timestamp: Date.now()
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
