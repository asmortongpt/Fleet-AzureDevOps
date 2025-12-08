import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodSchema } from 'zod';

/**
 * Enhanced validation middleware for CRIT-B-003
 * Supports validation of body, query, and params
 *
 * SECURITY: Prevents injection attacks and data corruption through comprehensive input validation
 */

/**
 * Validation target type
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Strip unknown fields (default: true)
   */
  stripUnknown?: boolean;

  /**
   * Sanitize HTML/script tags (default: true)
   */
  sanitize?: boolean;
}

/**
 * Main validation middleware - validates request body
 *
 * @param schema - Zod schema to validate against
 * @param options - Validation options
 *
 * @example
 * router.post('/vehicles', validate(vehicleCreateSchema), async (req, res) => {...})
 */
export const validate = (schema: AnyZodObject, options: ValidationOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stripUnknown = true, sanitize = true } = options;

      // Sanitize input if enabled
      const data = sanitize ? sanitizeInput(req.body) : req.body;

      // Validate data
      const validated = await schema.parseAsync(data);

      // Replace request body with validated data (strips unknown fields if enabled)
      req.body = stripUnknown ? validated : { ...req.body, ...validated };

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Validate request body
 *
 * @param schema - Zod schema to validate against
 * @param options - Validation options
 */
export const validateBody = (schema: ZodSchema, options: ValidationOptions = {}) => {
  return validate(schema as AnyZodObject, options);
};

/**
 * Validate query parameters
 *
 * @param schema - Zod schema to validate against
 *
 * @example
 * router.get('/vehicles', validateQuery(vehicleQuerySchema), async (req, res) => {...})
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Validate URL parameters
 *
 * @param schema - Zod schema to validate against
 *
 * @example
 * router.get('/vehicles/:id', validateParams(vehicleIdSchema), async (req, res) => {...})
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Validate multiple targets at once
 *
 * @param schemas - Object with schemas for body, query, and/or params
 * @param options - Validation options (only applies to body)
 *
 * @example
 * router.put('/vehicles/:id',
 *   validateAll({
 *     params: vehicleIdSchema,
 *     body: vehicleUpdateSchema
 *   }),
 *   async (req, res) => {...}
 * )
 */
export const validateAll = (
  schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  },
  options: ValidationOptions = {}
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stripUnknown = true, sanitize = true } = options;

      // Validate params first (URL parameters)
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params) as any;
      }

      // Then query parameters
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query) as any;
      }

      // Finally body
      if (schemas.body) {
        const data = sanitize ? sanitizeInput(req.body) : req.body;
        const validated = await schemas.body.parseAsync(data);
        req.body = stripUnknown ? validated : { ...req.body, ...validated };
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Sanitize input to prevent XSS attacks
 * SECURITY: Removes potentially dangerous HTML/script tags and event handlers
 *
 * @param data - Data to sanitize
 * @returns Sanitized data
 */
function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Sanitize string to prevent XSS
 * SECURITY: Removes script tags, event handlers, and javascript: protocol
 *
 * @param str - String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(str: string): string {
  return str
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:text\/html/gi, '')
    // Trim whitespace
    .trim();
}

/**
 * Export default validation middleware (body validation)
 */
export default validate;
