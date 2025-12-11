import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

// Create Winston logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'fleet-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        })
      )
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Logging middleware for HTTP requests
export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Generate request ID
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;

  // Log request
  logger.http('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;

    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('Server error response', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error response', logData);
    } else {
      logger.http('Request completed', logData);
    }

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        ...logData,
        threshold: '1000ms'
      });
    }
  });

  next();
}

// Sanitize sensitive data from logs
export function sanitizeLogData(data: any): any {
  const sensitive = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized = { ...data };

  for (const key of sensitive) {
    if (sanitized[key]) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}
