"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.perfLogger = exports.securityLogger = exports.createLoggerWithCorrelation = exports.generateCorrelationId = exports.logger = exports.redactPII = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
// Ensure logs directory exists
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
/**
 * PII Redaction Utility
 * Masks sensitive data in logs to comply with privacy regulations
 */
const redactPII = (data) => {
    if (!data || typeof data !== 'object') {
        if (typeof data === 'string') {
            return redactString(data);
        }
        return data;
    }
    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => (0, exports.redactPII)(item));
    }
    // Handle objects
    const redacted = {};
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
        }
        else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
            redacted[key] = typeof value === 'string' ? maskPhone(value) : '[REDACTED]';
        }
        else if (lowerKey.includes('ssn') || lowerKey === 'social_security_number') {
            redacted[key] = typeof value === 'string' ? maskSSN(value) : '[REDACTED]';
        }
        else if (lowerKey.includes('credit') || lowerKey.includes('card')) {
            redacted[key] = typeof value === 'string' ? maskCreditCard(value) : '[REDACTED]';
        }
        else if (typeof value === 'object') {
            redacted[key] = (0, exports.redactPII)(value);
        }
        else if (typeof value === 'string') {
            redacted[key] = redactString(value);
        }
        else {
            redacted[key] = value;
        }
    }
    return redacted;
};
exports.redactPII = redactPII;
/**
 * Redact PII patterns in strings
 */
const redactString = (str) => {
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
const maskEmail = (email) => {
    const [local, domain] = email.split('@');
    if (!local || !domain)
        return '[REDACTED EMAIL]';
    const maskedLocal = local[0] + '***';
    const [domainName, tld] = domain.split('.');
    const maskedDomain = domainName ? domainName[0] + '***' : '***';
    return `${maskedLocal}@${maskedDomain}.${tld || 'com'}`;
};
/**
 * Mask phone: (555) 123-4567 → (***) ***-4567
 */
const maskPhone = (phone) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7)
        return '[REDACTED PHONE]';
    const lastFour = digits.slice(-4);
    return `(***) ***-${lastFour}`;
};
/**
 * Mask SSN: 123-45-6789 → ***-**-6789
 */
const maskSSN = (ssn) => {
    const digits = ssn.replace(/\D/g, '');
    if (digits.length !== 9)
        return '[REDACTED SSN]';
    const lastFour = digits.slice(-4);
    return `***-**-${lastFour}`;
};
/**
 * Mask credit card: 4111111111111111 → ************1111
 */
const maskCreditCard = (cc) => {
    const digits = cc.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19)
        return '[REDACTED CC]';
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
winston_1.default.addColors(customLevels.colors);
/**
 * PII redaction format
 */
const piiRedactionFormat = winston_1.default.format((info) => {
    // Redact the entire info object
    const redacted = (0, exports.redactPII)(info);
    return redacted;
});
/**
 * Correlation ID format
 */
const correlationFormat = winston_1.default.format((info) => {
    // Add correlation ID if available in context
    if (info.correlationId) {
        info.correlation_id = info.correlationId;
    }
    return info;
});
/**
 * Development console format (colorized, readable)
 */
const devConsoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf((info) => {
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
}));
/**
 * Production JSON format
 */
const prodJsonFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'ISO' }), correlationFormat(), piiRedactionFormat(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
/**
 * Console transport
 */
const consoleTransport = new winston_1.default.transports.Console({
    format: process.env.NODE_ENV === 'production' ? prodJsonFormat : devConsoleFormat,
});
/**
 * Daily rotating file transport for general logs (7 days retention)
 */
const generalLogTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logsDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '100m',
    maxFiles: '7d',
    zippedArchive: true,
    format: prodJsonFormat,
});
/**
 * Daily rotating file transport for error logs (30 days retention)
 */
const errorLogTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logsDir, 'error-%DATE%.log'),
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
const httpLogTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logsDir, 'http-%DATE%.log'),
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
const securityLogTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '100m',
    maxFiles: '30d',
    zippedArchive: true,
    format: prodJsonFormat,
});
/**
 * Application Insights transport (if configured)
 */
let appInsightsTransport = null;
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
            constructor(opts) {
                super(opts);
            }
            log(info, callback) {
                setImmediate(() => {
                    this.emit('logged', info);
                });
                const client = appInsights.defaultClient;
                if (!client) {
                    callback();
                    return;
                }
                // Map Winston levels to Application Insights severity
                const severityMap = {
                    error: 3, // Error
                    warn: 2, // Warning
                    info: 1, // Information
                    http: 1, // Information
                    debug: 0, // Verbose
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
                }
                else {
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
    }
    catch (error) {
        console.error('Failed to initialize Application Insights:', error);
    }
}
/**
 * Determine transports based on environment
 */
const getTransports = () => {
    const transports = [consoleTransport];
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
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    levels: customLevels.levels,
    transports: getTransports(),
    exitOnError: false,
});
/**
 * Generate correlation ID
 */
const generateCorrelationId = () => {
    return (0, uuid_1.v4)();
};
exports.generateCorrelationId = generateCorrelationId;
/**
 * Create child logger with correlation ID
 */
const createLoggerWithCorrelation = (correlationId) => {
    return exports.logger.child({ correlationId });
};
exports.createLoggerWithCorrelation = createLoggerWithCorrelation;
/**
 * Security event logger
 */
exports.securityLogger = {
    /**
     * Log authentication failures
     */
    authFailure(data) {
        exports.logger.warn('Authentication failure', {
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
        securityLogTransport.log(securityEntry, () => { });
    },
    /**
     * Log permission denials
     */
    permissionDenied(data) {
        exports.logger.warn('Permission denied', {
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
        }, () => { });
    },
    /**
     * Log rate limit hits
     */
    rateLimitHit(data) {
        exports.logger.warn('Rate limit exceeded', {
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
        }, () => { });
    },
    /**
     * Log invalid tokens
     */
    invalidToken(data) {
        exports.logger.warn('Invalid token', {
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
        }, () => { });
    },
    /**
     * Log CSRF violations
     */
    csrfViolation(data) {
        exports.logger.error('CSRF violation', {
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
        }, () => { });
    },
};
/**
 * Performance logger
 */
exports.perfLogger = {
    /**
     * Log slow database queries (>1 second)
     */
    slowQuery(data) {
        exports.logger.warn('Slow database query', {
            category: 'performance',
            type: 'slow_query',
            ...data,
            timestamp: new Date().toISOString(),
        });
    },
    /**
     * Log API endpoint latency
     */
    apiLatency(data) {
        const level = data.duration > 3000 ? 'warn' : 'http';
        exports.logger.log(level, 'API request completed', {
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
    dbPoolMetrics(data) {
        exports.logger.debug('Database pool metrics', {
            category: 'performance',
            type: 'db_pool',
            ...data,
            timestamp: new Date().toISOString(),
        });
    },
    /**
     * Log memory usage warnings
     */
    memoryWarning(data) {
        exports.logger.warn('High memory usage detected', {
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
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map