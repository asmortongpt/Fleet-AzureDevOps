/**
 * @file logger.ts
 * @description Centralized logging configuration with sanitization.
 */

// @ts-ignore - winston is a Node.js module, types may not be available in browser builds
import { createLogger, format, transports } from 'winston';

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