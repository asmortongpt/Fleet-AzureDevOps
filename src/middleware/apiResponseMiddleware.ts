import { Request, Response, NextFunction } from 'express';

import { ApiResponse } from '../utils/apiResponse';

/**
 * Middleware to ensure all responses conform to a standard format.
 */
export const apiResponseMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send.bind(res);

  res.send = (body: any): Response => {
    if (res.headersSent) {
      return originalSend(body);
    }

    if (typeof body === 'object' && !body.success) {
      return ApiResponse.error(res, body.error || 'An error occurred');
    }

    return originalSend(body);
  };

  next();
};