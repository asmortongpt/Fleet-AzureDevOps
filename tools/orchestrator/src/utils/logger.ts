/**
 * Structured Logger using Winston
 * Provides comprehensive logging with rotation and multiple transports
 */

import path from 'path';

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logDir = path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // File transport with rotation
    new DailyRotateFile({
      dirname: logDir,
      filename: 'orchestrator-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
      format: logFormat,
    }),

    // Error log
    new DailyRotateFile({
      dirname: logDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '30d',
      format: logFormat,
    }),
  ],
  exitOnError: false,
});

/**
 * Create a child logger with context
 */
export function createContextLogger(context: Record<string, unknown>): winston.Logger {
  return logger.child(context);
}

/**
 * Log scanner execution
 */
export function logScannerStart(scanner: string, target: string): void {
  logger.info('Scanner started', { scanner, target, event: 'scanner_start' });
}

export function logScannerComplete(
  scanner: string,
  duration: number,
  findingsCount: number
): void {
  logger.info('Scanner completed', {
    scanner,
    duration_ms: duration,
    findings: findingsCount,
    event: 'scanner_complete',
  });
}

export function logScannerError(scanner: string, error: Error): void {
  logger.error('Scanner failed', {
    scanner,
    error: error.message,
    stack: error.stack,
    event: 'scanner_error',
  });
}

/**
 * Log remediation events
 */
export function logRemediationStart(findingId: string, strategy: string): void {
  logger.info('Remediation started', {
    finding_id: findingId,
    strategy,
    event: 'remediation_start',
  });
}

export function logRemediationComplete(findingId: string, success: boolean): void {
  logger.info('Remediation completed', {
    finding_id: findingId,
    success,
    event: 'remediation_complete',
  });
}

/**
 * Log gate execution
 */
export function logGateStart(gate: string): void {
  logger.info('Gate started', { gate, event: 'gate_start' });
}

export function logGateResult(gate: string, passed: boolean, duration: number): void {
  logger.info('Gate completed', {
    gate,
    passed,
    duration_ms: duration,
    event: 'gate_complete',
  });
}

/**
 * Performance measurement helper
 */
export class PerformanceTimer {
  private startTime: number;
  private context: string;

  constructor(context: string) {
    this.context = context;
    this.startTime = Date.now();
  }

  end(additionalData?: Record<string, unknown>): number {
    const duration = Date.now() - this.startTime;
    logger.debug('Performance measurement', {
      context: this.context,
      duration_ms: duration,
      ...additionalData,
    });
    return duration;
  }
}

export default logger;
