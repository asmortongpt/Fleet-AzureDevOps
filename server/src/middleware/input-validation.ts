/**
 * Input Validation Middleware - Phase 2 Security Hardening
 * Centralized input validation using Zod schemas
 *
 * SECURITY: SEC-PHASE2-008
 * Priority: HIGH
 * CWE: CWE-20 (Improper Input Validation)
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

/**
 * Common validation schemas
 */
export const schemas = {
  // Vehicle validation
  vehicle: z.object({
    make: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s\-]+$/),
    model: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s\-]+$/),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 2),
    vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/),
    licensePlate: z.string().max(15).optional(),
    mileage: z.number().int().min(0).max(999999).optional(),
  }),

  // Driver validation
  driver: z.object({
    firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s\-']+$/),
    lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s\-']+$/),
    email: z.string().email().max(255),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
    licenseNumber: z.string().min(5).max(20).regex(/^[A-Z0-9\-]+$/),
    licenseExpiry: z.string().datetime(),
  }),

  // Work order validation
  workOrder: z.object({
    vehicleId: z.number().int().positive(),
    description: z.string().min(10).max(1000),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    estimatedCost: z.number().min(0).max(999999.99).optional(),
    scheduledDate: z.string().datetime().optional(),
  }),

  // Authentication validation
  login: z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128), // Don't validate password complexity here (handle in auth service)
  }),

  // User update validation
  userUpdate: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  }),

  // Query parameters validation
  pagination: z.object({
    page: z.number().int().min(1).max(10000).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),

  // ID parameter validation
  id: z.object({
    id: z.number().int().positive(),
  }),

  // Security module validation
  auditLogEntry: z.object({
    action: z.string().min(1).max(100),
    resourceType: z.string().min(1).max(100),
    resourceId: z.string().max(255).optional(),
    before: z.any().optional(),
    after: z.any().optional(),
    details: z.any().optional(),
  }),

  loginRequest: z.object({
    idToken: z.string().optional(),
    email: z.string().email().max(255).optional(),
  }),

  refreshTokenRequest: z.object({
    refreshToken: z.string().min(1).max(500),
  }),

  siemEventRequest: z.object({
    action: z.string().min(1).max(100),
    resourceType: z.string().min(1).max(100),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional(),
    details: z.any().optional(),
  }),
};

/**
 * Validation middleware factory
 * Creates Express middleware that validates request body/params/query
 */
export function validate(schema: z.ZodType, source: 'body' | 'params' | 'query' = 'body') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse and validate
      const data = req[source];
      const validated = await schema.parseAsync(data);

      // Replace request data with validated data (type-safe and sanitized)
      req[source] = validated;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.securityEvent({
          event: 'VALIDATION_FAILURE',
          endpoint: req.path,
          method: req.method,
          errors: error.errors,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });

        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      } else {
        logger.error('Unexpected validation error', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

/**
 * Sanitize string input to prevent XSS
 * Use this for user-generated content that will be displayed
 */
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize user input
 * Combines validation + sanitization for user-generated content
 */
export function validateAndSanitize(schema: z.ZodType) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.body);

      // Sanitize string fields
      const sanitized = Object.entries(validated).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = sanitizeHTML(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      req.body = sanitized;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

/**
 * SQL injection prevention - validate database identifiers
 * Use this when accepting table/column names from user input (rare, but critical)
 */
export function validateSQLIdentifier(identifier: string): boolean {
  // Only allow alphanumeric and underscore
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

/**
 * Path traversal prevention - validate file paths
 * Use this when accepting file paths from user input
 */
export function validateFilePath(path: string): boolean {
  // Prevent path traversal
  return !path.includes('..') && !/[<>:"|?*]/.test(path);
}
