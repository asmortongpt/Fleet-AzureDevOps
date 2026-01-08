/**
 * Enhanced Logging Middleware
 *
 * Features:
 * - Correlation ID generation and propagation
 * - Request/response tracking with timing
 * - Automatic slow request detection
 * - PII redaction in logs
 * - Integration with Winston logger
 *
 * @module middleware/logging
 */

import { Request, Response, NextFunction } from 'express';

import { logger, generateCorrelationId, createLoggerWithCorrelation, perfLogger } from '../lib/logger';

/**
 * Extended Request type with correlation ID
 */
export interface RequestWithCorrelation extends Request {
  correlationId: string;
  startTime: number;
  logger: typeof logger;
}

/**
 * Request logger middleware
 * Adds correlation ID, logs requests, tracks timing
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Generate or extract correlation ID
  const correlationId = (req.headers['x-correlation-id'] as string) || generateCorrelationId();

  // Attach to request for downstream use
  (req as RequestWithCorrelation).correlationId = correlationId;
  (req as RequestWithCorrelation).startTime = Date.now();

  // Create child logger with correlation ID
  (req as RequestWithCorrelation).logger = createLoggerWithCorrelation(correlationId);

  // Log request start
  logger.http('API Request', {
    correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    tenantId: (req as any).user?.tenant_id,
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
  });

  // Capture response
  const originalJson = res.json;
  res.json = function(body: any) {
    (res as any).responseBody = body;
    return originalJson.call(this, body);
  };

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - (req as RequestWithCorrelation).startTime;
    const statusCode = res.statusCode;

    // Determine log level based on status code and duration
    let level: 'http' | 'warn' | 'error' = 'http';
    if (statusCode >= 500) {
      level = 'error';
    } else if (statusCode >= 400 || duration > 3000) {
      level = 'warn';
    }

    logger.log(level, 'API Response', {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      slow: duration > 1000,
      userId: (req as any).user?.id,
      tenantId: (req as any).user?.tenant_id,
      timestamp: new Date().toISOString(),
    });

    // Also log to performance logger
    perfLogger.apiLatency({
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      userId: (req as any).user?.id,
      tenantId: (req as any).user?.tenant_id,
      correlationId,
    });
  });

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  next();
}

/**
 * Error logging middleware
 * Should be placed after all routes
 */
export function errorLogger(err: any, req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req as RequestWithCorrelation).correlationId;

  logger.error('Unhandled error', {
    correlationId,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
    },
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    userId: (req as any).user?.id,
    tenantId: (req as any).user?.tenant_id,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
  });

  next(err);
}

/**
 * Database query logger wrapper
 * Use this to wrap database queries and log slow queries
 */
export async function logQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  correlationId?: string
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    // Log slow queries
    if (duration > 1000) {
      perfLogger.slowQuery({
        query: queryName,
        duration,
        correlationId,
      });
    } else if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Database query', {
        query: queryName,
        duration,
        correlationId,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Database query failed', {
      query: queryName,
      duration,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
      correlationId,
    });

    throw error;
  }
}

/**
 * Correlation ID propagation helper
 * Use this in async operations to maintain correlation context
 */
export function withCorrelation<T>(
  correlationId: string,
  fn: () => Promise<T>
): Promise<T> {
  const contextLogger = createLoggerWithCorrelation(correlationId);

  return fn().catch((error) => {
    contextLogger.error('Operation failed', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
    });
    throw error;
  });
}

/**
 * Request body logging middleware (for debugging)
 * Only enabled when LOG_LEVEL=debug
 */
export function requestBodyLogger(req: Request, res: Response, next: NextFunction): void {
  if (process.env.LOG_LEVEL === 'debug' && req.body) {
    const correlationId = (req as RequestWithCorrelation).correlationId;

    logger.debug('Request body', {
      correlationId,
      method: req.method,
      path: req.path,
      body: req.body,
    });
  }

  next();
}

/**
 * Memory monitoring middleware
 * Logs memory usage periodically
 */
let lastMemoryCheck = 0;
const MEMORY_CHECK_INTERVAL = 60000; // 1 minute

export function memoryMonitor(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();

  if (now - lastMemoryCheck > MEMORY_CHECK_INTERVAL) {
    lastMemoryCheck = now;

    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // Log warning if heap usage > 80%
    if (heapUsedPercent > 80) {
      perfLogger.memoryWarning({
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        threshold: 80,
      });
    } else if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Memory usage', {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        heapUsedPercent: heapUsedPercent.toFixed(2) + '%',
        external: memUsage.external,
        rss: memUsage.rss,
      });
    }
  }

  next();
}
