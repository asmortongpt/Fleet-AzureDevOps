import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodObject } from 'zod';

import { ValidationError } from '../services/dal/errors'; // Reusing existing error class

// Type alias for any Zod object schema
type AnyZodObject = ZodObject<any>;

export const validateResource = (schema: AnyZodObject) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });
        next();
    } catch (e: unknown) {
        if (e instanceof ZodError) {
            // Format Zod errors into a readable string or object
            const errorMessage = e.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
            next(new ValidationError(errorMessage));
        } else {
            next(e);
        }
    }
};
