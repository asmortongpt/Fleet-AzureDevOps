import winston from 'winston';

/**
 * Winston Logger Configuration
 * Production-ready logging with sanitization
 */

// Sanitize sensitive data from logs
const sanitizeLog = winston.format((info: winston.Logform.TransformableInfo) => {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];

  const message = info.message as Record<string, unknown> | undefined;
  if (message && typeof message === 'object') {
    sensitiveFields.forEach(field => {
      if (message[field]) {
        message[field] = '[REDACTED]';
      }
    });
  }

  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    sanitizeLog(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fleet-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export default logger;

