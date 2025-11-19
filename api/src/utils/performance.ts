import { Request, Response, NextFunction } from 'express';

/**
 * Performance monitoring middleware
 * Tracks response times and logs slow requests
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(`⚠️ SLOW REQUEST: ${req.method} ${req.originalUrl} - ${duration}ms`);
    } else if (duration > 500) {
      console.log(`⏱️ ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });

  next();
};

/**
 * Slow query logger utility
 * Wraps async database operations and logs if they exceed threshold
 */
export const slowQueryLogger = async <T>(
  queryFn: () => Promise<T>,
  queryName: string,
  threshold: number = 100
): Promise<T> => {
  const start = Date.now();
  const result = await queryFn();
  const duration = Date.now() - start;

  if (duration > threshold) {
    console.warn(`⚠️ SLOW QUERY: ${queryName} - ${duration}ms`);
  }

  return result;
};

/**
 * Request logger for debugging performance
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};
