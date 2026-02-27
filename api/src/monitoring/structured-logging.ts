/**
 * Structured Logging Configuration
 * Provides JSON-structured logging with log rotation and retention
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

/**
 * Log levels configuration
 */
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace'
};

/**
 * Create logs directory if it doesn't exist
 */
function ensureLogsDirectory(): void {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

/**
 * Custom JSON formatter for structured logging
 */
const jsonFormatter = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Human-readable formatter for console output (development)
 */
const consoleFormatter = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message} ${metaStr ? '\n' + metaStr : ''}`;
  })
);

/**
 * Create structured logger with multiple transports
 */
function createStructuredLogger(): winston.Logger {
  ensureLogsDirectory();

  const logsDir = path.join(process.cwd(), 'logs');
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const transports: winston.transport[] = [];

  // Console transport (always)
  transports.push(
    new winston.transports.Console({
      format: isDevelopment ? consoleFormatter : jsonFormatter,
      level: isDevelopment ? 'debug' : 'info'
    })
  );

  // File transport - All logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: jsonFormatter,
      level: 'info'
    })
  );

  // File transport - Error logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: jsonFormatter,
      level: 'error'
    })
  );

  // File transport - Debug logs (development only)
  if (isDevelopment) {
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'debug-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: jsonFormatter,
        level: 'debug'
      })
    );
  }

  return winston.createLogger({
    defaultMeta: {
      service: 'fleet-api',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      instance: process.env.HOSTNAME || 'unknown'
    },
    transports
  });
}

/**
 * Structured logger instance
 */
const structuredLogger = createStructuredLogger();

/**
 * Log context helper
 */
export class LogContext {
  private context: Record<string, unknown> = {};

  constructor(private logger: winston.Logger) {}

  /**
   * Set context data
   */
  setContext(context: Record<string, unknown>): this {
    this.context = { ...context };
    return this;
  }

  /**
   * Add context data
   */
  addContext(key: string, value: unknown): this {
    this.context[key] = value;
    return this;
  }

  /**
   * Log error
   */
  error(message: string, error?: Error, additionalData?: Record<string, unknown>): void {
    this.logger.error(message, {
      ...this.context,
      ...additionalData,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    });
  }

  /**
   * Log warning
   */
  warn(message: string, additionalData?: Record<string, unknown>): void {
    this.logger.warn(message, {
      ...this.context,
      ...additionalData
    });
  }

  /**
   * Log info
   */
  info(message: string, additionalData?: Record<string, unknown>): void {
    this.logger.info(message, {
      ...this.context,
      ...additionalData
    });
  }

  /**
   * Log debug
   */
  debug(message: string, additionalData?: Record<string, unknown>): void {
    this.logger.debug(message, {
      ...this.context,
      ...additionalData
    });
  }

  /**
   * Clear context
   */
  clear(): this {
    this.context = {};
    return this;
  }
}

/**
 * Create a new log context
 */
export function createLogContext(): LogContext {
  return new LogContext(structuredLogger);
}

/**
 * HTTP Request logging helper
 */
export interface RequestLogData {
  requestId: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  error?: Error;
}

/**
 * Log HTTP request
 */
export function logHttpRequest(data: RequestLogData): void {
  const logContext = new LogContext(structuredLogger)
    .setContext({
      requestId: data.requestId,
      method: data.method,
      url: data.url,
      status: data.status,
      durationMs: data.duration,
      userId: data.userId,
      userAgent: data.userAgent,
      ip: data.ip
    });

  if (data.error) {
    logContext.error('HTTP request failed', data.error);
  } else if (data.status >= 400) {
    logContext.warn('HTTP request returned error status');
  } else {
    logContext.info('HTTP request completed');
  }
}

/**
 * Log database operation
 */
export interface DatabaseLogData {
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CALL';
  table: string;
  duration: number;
  rowsAffected?: number;
  error?: Error;
  userId?: string;
  tenantId?: string;
}

/**
 * Log database operation
 */
export function logDatabaseOperation(data: DatabaseLogData): void {
  const logContext = new LogContext(structuredLogger)
    .setContext({
      operation: data.operation,
      table: data.table,
      durationMs: data.duration,
      rowsAffected: data.rowsAffected,
      userId: data.userId,
      tenantId: data.tenantId,
      type: 'database'
    });

  if (data.error) {
    logContext.error('Database operation failed', data.error);
  } else if (data.duration > 1000) {
    logContext.warn('Slow database operation detected');
  } else {
    logContext.debug('Database operation completed');
  }
}

/**
 * Log business event
 */
export interface BusinessEventLogData {
  eventType: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log business event
 */
export function logBusinessEvent(data: BusinessEventLogData): void {
  const logContext = new LogContext(structuredLogger)
    .setContext({
      eventType: data.eventType,
      userId: data.userId,
      tenantId: data.tenantId,
      type: 'business_event',
      ...data.metadata
    });

  logContext.info(`Business event: ${data.eventType}`);
}

/**
 * Log audit event
 */
export interface AuditLogData {
  action: string;
  resource: string;
  userId: string;
  tenantId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  status: 'success' | 'failure';
  error?: Error;
}

/**
 * Log audit event
 */
export function logAuditEvent(data: AuditLogData): void {
  const logContext = new LogContext(structuredLogger)
    .setContext({
      action: data.action,
      resource: data.resource,
      userId: data.userId,
      tenantId: data.tenantId,
      status: data.status,
      type: 'audit',
      changes: data.changes
    });

  if (data.error) {
    logContext.error('Audit event - operation failed', data.error);
  } else {
    logContext.info('Audit event recorded');
  }
}

/**
 * Get logger instance
 */
export function getLogger(): winston.Logger {
  return structuredLogger;
}

/**
 * Configure log level at runtime
 */
export function setLogLevel(level: string): void {
  structuredLogger.level = level;
}

/**
 * Get current log level
 */
export function getLogLevel(): string {
  return structuredLogger.level;
}

export { LOG_LEVELS, structuredLogger };
export default structuredLogger;
