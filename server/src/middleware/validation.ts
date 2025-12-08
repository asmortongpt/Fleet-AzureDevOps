import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

import { Logger } from '../utils/logger'; // Assuming a logger utility is available

// FedRAMP Compliance Note: Ensure that all data validation is logged for auditing purposes.
// SOC 2 Compliance Note: Validation errors should not expose sensitive data in logs.

export function validate(schema: ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body against the provided schema
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Log validation errors without exposing sensitive data
        Logger.error('Validation error', {
          errors: error.errors.map(err => ({
            path: err.path,
            message: err.message
          })),
          requestId: req.headers['x-request-id'] || 'N/A'
        });

        // Respond with a generic error message to the client
        res.status(400).json({
          error: 'Invalid request data',
          details: error.errors.map(err => ({
            path: err.path,
            message: err.message
          }))
        });
      } else {
        // Log unexpected errors
        Logger.error('Unexpected error during validation', {
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId: req.headers['x-request-id'] || 'N/A'
        });

        // Respond with a generic error message to the client
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }
  };
}