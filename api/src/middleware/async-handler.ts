/**
 * Async Handler Middleware
 *
 * Wraps async route handlers to catch errors and pass them to Express error middleware
 * Eliminates need for try/catch blocks in every route handler
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps async route handlers to automatically catch errors
 *
 * Usage:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json(users);
 * }));
 */
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Alternative wrapper that provides stronger typing
 */
export const catchAsync = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err) => next(err));
  };
};
