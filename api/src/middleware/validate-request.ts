
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../errors/app-error';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // If you want to use your custom ValidationError class:
        // const formattedErrors = errors.array().map(err => ({ field: err.type === 'field' ? err.path : err.type, message: err.msg }));
        // return next(new ValidationError('Validation failed', formattedErrors));

        // Or simple JSON response:
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }

    next();
};
