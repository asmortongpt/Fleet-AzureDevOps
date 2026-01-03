/**
 * @file logger.ts
 * @description Centralized logging configuration with sanitization.
 */

import { createLogger, format, transports, Logger } from 'winston';

import { sanitizeForLogging } from './logSanitizer';

// Define LogData type for logging
export interface LogData {
  email?: string;
  phone?: string;
  [key: string]: any;
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.printf(({ level, message, timestamp }: { level: string; message: unknown; timestamp: string }) => {
      const sanitizedMessage = sanitizeForLogging(message as LogData);
      return `${timestamp} [${level}]: ${JSON.stringify(sanitizedMessage)}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'combined.log' })
  ],
});

export default logger;