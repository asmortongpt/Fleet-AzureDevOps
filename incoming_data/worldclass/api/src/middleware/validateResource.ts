import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

import { ValidationError } from '../services/dal/errors'; // Reusing existing error class

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
    } catch (e: any) {
        if (e instanceof ZodError) {
            // Format Zod errors into a readable string or object
            const errorMessage = e.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
            next(new ValidationError(errorMessage));
        } else {
            next(e);
        }
    }
};
