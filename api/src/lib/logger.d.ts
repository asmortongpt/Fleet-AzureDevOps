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
import winston from 'winston';
/**
 * PII Redaction Utility
 * Masks sensitive data in logs to comply with privacy regulations
 */
export declare const redactPII: (data: any) => any;
/**
 * Main logger instance
 */
export declare const logger: winston.Logger;
/**
 * Generate correlation ID
 */
export declare const generateCorrelationId: () => string;
/**
 * Create child logger with correlation ID
 */
export declare const createLoggerWithCorrelation: (correlationId: string) => winston.Logger;
/**
 * Security event logger
 */
export declare const securityLogger: {
    /**
     * Log authentication failures
     */
    authFailure(data: {
        email?: string;
        ip: string;
        userAgent: string;
        reason: string;
        tenantId?: string;
    }): void;
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
    }): void;
    /**
     * Log rate limit hits
     */
    rateLimitHit(data: {
        ip: string;
        route: string;
        threshold: number;
        userAgent: string;
        userId?: string;
    }): void;
    /**
     * Log invalid tokens
     */
    invalidToken(data: {
        ip: string;
        userAgent: string;
        tokenType: "jwt" | "api_key" | "oauth";
        reason: string;
        userId?: string;
    }): void;
    /**
     * Log CSRF violations
     */
    csrfViolation(data: {
        ip: string;
        userAgent: string;
        path: string;
        method: string;
        userId?: string;
    }): void;
};
/**
 * Performance logger
 */
export declare const perfLogger: {
    /**
     * Log slow database queries (>1 second)
     */
    slowQuery(data: {
        query: string;
        duration: number;
        rows?: number;
        params?: any[];
        correlationId?: string;
    }): void;
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
    }): void;
    /**
     * Log database connection pool metrics
     */
    dbPoolMetrics(data: {
        total: number;
        idle: number;
        waiting: number;
    }): void;
    /**
     * Log memory usage warnings
     */
    memoryWarning(data: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
        threshold: number;
    }): void;
};
/**
 * Export default logger
 */
export default logger;
//# sourceMappingURL=logger.d.ts.map