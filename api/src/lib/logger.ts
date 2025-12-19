/**
 * Production-Grade Winston Logging System
 *
 * Features:
 * - Multiple transports: Console, Daily Rotating Files, Application Insights
 * - PII redaction (emails, phones, SSNs, credit cards, passwords)
 * - Correlation ID support for request tracing
 * - Security event logging
 * - Performance monitoring
 * - Environment-based configuration
 * - Structured JSON format for production
 * - Log rotation (7d general, 30d errors)
 *
 * @module lib/logger
 */

import fs from 'fs';
import path from 'path';

import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';


// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * PII Redaction Utility
 * Masks sensitive data in logs to comply with privacy regulations
 */
export const redactPII = (data: any): any => {
  if (!data || typeof data !== 'object') {
    if (typeof data === 'string') {
      return redactString(data);
    }
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => redactPII(item));
  }

  // Handle objects
  const redacted: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Remove password fields entirely
    if (lowerKey.includes('password') || lowerKey.includes('secret') ||
        lowerKey.includes('token') || lowerKey.includes('apikey') ||
        lowerKey.includes('authorization')) {
      redacted[key] = '[REDACTED]';
      continue;
    }

    // Redact known PII fields
    if (lowerKey.includes('email')) {
      redacted[key] = typeof value === 'string' ? maskEmail(value) : '[REDACTED]';
    } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
      redacted[key] = typeof value === 'string' ? maskPhone(value) : '[REDACTED]';
    } else if (lowerKey.includes('ssn') || lowerKey === 'social_security_number') {
      redacted[key] = typeof value === 'string' ? maskSSN(value) : '[REDACTED]';
    } else if (lowerKey.includes('credit') || lowerKey.includes('card')) {
      redacted[key] = typeof value === 'string' ? maskCreditCard(value) : '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactPII(value);
    } else if (typeof value === 'string') {
      redacted[key] = redactString(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
};

/**
 * Redact PII patterns in strings
 */
const redactString = (str: string): string => {
  let result = str;

  // Email pattern
  result = result.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (email) => maskEmail(email));

  // Phone pattern (various formats)
  result = result.replace(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, (phone) => maskPhone(phone));

  // SSN pattern
  result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, (ssn) => maskSSN(ssn));

  // Credit card pattern (13-19 digits with optional spaces/dashes)
  result = result.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4,7}\b/g, (cc) => maskCreditCard(cc));

  return result;
};

/**
 * Mask email: user@example.com → u***@e***.com
 */
const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[REDACTED EMAIL]';

  const maskedLocal = local[0] + '***';
  const [domainName, tld] = domain.split('.');
  const maskedDomain = domainName ? domainName[0] + '***' : '***';

  return `${maskedLocal}@${maskedDomain}.${tld || 'com'}`;
};

/**
 * Mask phone: (555) 123-4567 → (***) ***-4567
 */
const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return '[REDACTED PHONE]';

  const lastFour = digits.slice(-4);
  return `(***) ***-${lastFour}`;
};

/**
 * Mask SSN: 123-45-6789 → ***-**-6789
 */
const maskSSN = (ssn: string): string => {
  const digits = ssn.replace(/\D/g, '');
  if (digits.length !== 9) return '[REDACTED SSN]';

  const lastFour = digits.slice(-4);
  return `***-**-${lastFour}`;
};

/**
 * Mask credit card: 4111111111111111 → ************1111
 */
const maskCreditCard = (cc: string): string => {
  const digits = cc.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return '[REDACTED CC]';

  const lastFour = digits.slice(-4);
  return '*'.repeat(digits.length - 4) + lastFour;
};

/**
 * Custom log levels
 */
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  }
};

winston.addColors(customLevels.colors);

/**
 * PII redaction format
 */
const piiRedactionFormat = winston.format((info) => {
  // Redact the entire info object
  const redacted = redactPII(info);
  return redacted;
});

/**
 * Correlation ID format
 */
const correlationFormat = winston.format((info) => {
  // Add correlation ID if available in context
  if (info.correlationId) {
    info.correlation_id = info.correlationId;
  }
  return info;
});

/**
 * Development console format (colorized, readable)
 */
const devConsoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, ...meta } = info;
    let output = `${timestamp} [${level}]`;

    if (correlationId) {
      output += ` [${correlationId}]`;
    }

    output += `: ${message}`;

    if (Object.keys(meta).length > 0) {
      output += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return output;
  })
);

/**
 * Production JSON format
 */
const prodJsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'ISO' }),
  correlationFormat(),
  piiRedactionFormat(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Console transport
 */
const consoleTransport = new winston.transports.Console({
  format: process.env.NODE_ENV === 'production' ? prodJsonFormat : devConsoleFormat,
});

/**
 * Daily rotating file transport for general logs (7 days retention)
 */
const generalLogTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '100m',
  maxFiles: '7d',
  zippedArchive: true,
  format: prodJsonFormat,
});

/**
 * Daily rotating file transport for error logs (30 days retention)
 */
const errorLogTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '100m',
  maxFiles: '30d',
  zippedArchive: true,
  format: prodJsonFormat,
});

/**
 * HTTP access log transport
 */
const httpLogTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: '100m',
  maxFiles: '7d',
  zippedArchive: true,
  format: prodJsonFormat,
});

/**
 * Security log transport (30 days retention for audit trails)
 */
const securityLogTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'security-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '100m',
  maxFiles: '30d',
  zippedArchive: true,
  format: prodJsonFormat,
});

/**
 * Application Insights transport (if configured)
 */
let appInsightsTransport: winston.transport | null = null;

if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  try {
    const appInsights = require('applicationinsights');
    appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .start();

    // Custom Winston transport for Application Insights
    const { Transport } = require('winston-transport');

    class ApplicationInsightsTransport extends Transport {
      constructor(opts: any) {
        super(opts);
      }

      log(info: any, callback: () => void) {
        setImmediate(() => {
          this.emit('logged', info);
        });

        const client = appInsights.defaultClient;
        if (!client) {
          callback();
          return;
        }

        // Map Winston levels to Application Insights severity
        const severityMap: any = {
          error: 3,   // Error
          warn: 2,    // Warning
          info: 1,    // Information
          http: 1,    // Information
          debug: 0,   // Verbose
        };

        const severity = severityMap[info.level] || 1;

        // Send to Application Insights
        if (info.level === 'error' && info.stack) {
          client.trackException({
            exception: new Error(info.message),
            properties: {
              ...info,
              stack: info.stack,
            },
            severity,
          });
        } else {
          client.trackTrace({
            message: info.message,
            severity,
            properties: info,
          });
        }

        callback();
      }
    }

    appInsightsTransport = new ApplicationInsightsTransport({});
  } catch (error) {
    console.error('Failed to initialize Application Insights:', error);
  }
}

/**
 * Determine transports based on environment
 */
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [consoleTransport];

  // Add file transports in production or when LOG_TO_FILE is true
  if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
    transports.push(generalLogTransport, errorLogTransport, httpLogTransport, securityLogTransport);
  }

  // Add Application Insights if configured
  if (appInsightsTransport) {
    transports.push(appInsightsTransport);
  }

  return transports;
};

/**
 * Main logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: customLevels.levels,
  transports: getTransports(),
  exitOnError: false,
});

/**
 * Generate correlation ID
 */
export const generateCorrelationId = (): string => {
  return uuidv4();
};

/**
 * Create child logger with correlation ID
 */
export const createLoggerWithCorrelation = (correlationId: string): winston.Logger => {
  return logger.child({ correlationId });
};

/**
 * Security event logger
 */
export const securityLogger = {
  /**
   * Log authentication failures
   */
  authFailure(data: {
    email?: string;
    ip: string;
    userAgent: string;
    reason: string;
    tenantId?: string;
  }) {
    logger.warn('Authentication failure', {
      category: 'security',
      event: 'auth_failure',
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Write to security log file
    const securityEntry = {
      level: 'warn',
      message: 'Authentication failure',
      category: 'security',
      event: 'auth_failure',
      ...data,
      timestamp: new Date().toISOString(),
    };

    securityLogTransport.log(securityEntry, () => {});
  },

  /**
   * Log permission denials
   */
  permissionDenied(data: {
    userId: string;
    tenantId: string;
    resource: string;
    action: string;
    ip: string;
    reason?: string;
  }) {
    logger.warn('Permission denied', {
      category: 'security',
      event: 'permission_denied',
      ...data,
      timestamp: new Date().toISOString(),
    });

    securityLogTransport.log({
      level: 'warn',
      message: 'Permission denied',
      category: 'security',
      event: 'permission_denied',
      ...data,
      timestamp: new Date().toISOString(),
    }, () => {});
  },

  /**
   * Log rate limit hits
   */
  rateLimitHit(data: {
    ip: string;
    route: string;
    threshold: number;
    userAgent: string;
    userId?: string;
  }) {
    logger.warn('Rate limit exceeded', {
      category: 'security',
      event: 'rate_limit_hit',
      ...data,
      timestamp: new Date().toISOString(),
    });

    securityLogTransport.log({
      level: 'warn',
      message: 'Rate limit exceeded',
      category: 'security',
      event: 'rate_limit_hit',
      ...data,
      timestamp: new Date().toISOString(),
    }, () => {});
  },

  /**
   * Log invalid tokens
   */
  invalidToken(data: {
    ip: string;
    userAgent: string;
    tokenType: 'jwt' | 'api_key' | 'oauth';
    reason: string;
    userId?: string;
  }) {
    logger.warn('Invalid token', {
      category: 'security',
      event: 'invalid_token',
      ...data,
      timestamp: new Date().toISOString(),
    });

    securityLogTransport.log({
      level: 'warn',
      message: 'Invalid token',
      category: 'security',
      event: 'invalid_token',
      ...data,
      timestamp: new Date().toISOString(),
    }, () => {});
  },

  /**
   * Log CSRF violations
   */
  csrfViolation(data: {
    ip: string;
    userAgent: string;
    path: string;
    method: string;
    userId?: string;
  }) {
    logger.error('CSRF violation', {
      category: 'security',
      event: 'csrf_violation',
      severity: 'high',
      ...data,
      timestamp: new Date().toISOString(),
    });

    securityLogTransport.log({
      level: 'error',
      message: 'CSRF violation',
      category: 'security',
      event: 'csrf_violation',
      severity: 'high',
      ...data,
      timestamp: new Date().toISOString(),
    }, () => {});
  },
};

/**
 * Performance logger
 */
export const perfLogger = {
  /**
   * Log slow database queries (>1 second)
   */
  slowQuery(data: {
    query: string;
    duration: number;
    rows?: number;
    params?: any[];
    correlationId?: string;
  }) {
    logger.warn('Slow database query', {
      category: 'performance',
      type: 'slow_query',
      ...data,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log API endpoint latency
   */
  apiLatency(data: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    userId?: string;
    tenantId?: string;
    correlationId?: string;
  }) {
    const level = data.duration > 3000 ? 'warn' : 'http';
    logger.log(level, 'API request completed', {
      category: 'performance',
      type: 'api_latency',
      ...data,
      slow: data.duration > 1000,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log database connection pool metrics
   */
  dbPoolMetrics(data: {
    total: number;
    idle: number;
    waiting: number;
  }) {
    logger.debug('Database pool metrics', {
      category: 'performance',
      type: 'db_pool',
      ...data,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log memory usage warnings
   */
  memoryWarning(data: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    threshold: number;
  }) {
    logger.warn('High memory usage detected', {
      category: 'performance',
      type: 'memory_warning',
      ...data,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Export default logger
 */
export default logger;
