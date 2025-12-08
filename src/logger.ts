/**
 * @file logger.ts
 * @description Centralized logging configuration with sanitization.
 */

import { createLogger, format, transports } from 'winston';

import { sanitizeForLogging } from './logSanitizer';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.printf(({ level, message, timestamp }) => {
      const sanitizedMessage = sanitizeForLogging(message);
      return `${timestamp} [${level}]: ${JSON.stringify(sanitizedMessage)}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'combined.log' })
  ],
});

export default logger;