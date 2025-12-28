/**
 * Security Event Logging - Phase 2 Security Hardening
 * Enhanced logging for security events with PII sanitization
 *
 * SECURITY: SEC-PHASE2-011, SEC-PHASE2-012
 * Priority: HIGH
 * CWE: CWE-778 (Insufficient Logging)
 */

import { logger as baseLogger } from './logger';

/**
 * Security event types
 */
export enum SecurityEventType {
  // Authentication events
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTH_LOCKOUT = 'AUTH_LOCKOUT',
  TOKEN_VALIDATION_FAILED = 'TOKEN_VALIDATION_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Authorization events
  AUTHZ_FAILURE = 'AUTHZ_FAILURE',
  PRIVILEGE_ESCALATION_ATTEMPT = 'PRIVILEGE_ESCALATION_ATTEMPT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  API_RATE_LIMIT_EXCEEDED = 'API_RATE_LIMIT_EXCEEDED',

  // Data access
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETION = 'DATA_DELETION',

  // Input validation
  VALIDATION_FAILURE = 'VALIDATION_FAILURE',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',

  // Suspicious activity
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',

  // Admin actions
  ADMIN_ACTION = 'ADMIN_ACTION',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
}

/**
 * Security event severity levels
 */
export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  event: SecurityEventType | string;
  severity?: Severity;
  userId?: number | string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  timestamp?: string;
  details?: Record<string, any>;
  [key: string]: any;
}

/**
 * PII fields that should be sanitized in logs
 */
const PII_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'ssn',
  'socialSecurityNumber',
  'creditCard',
  'cardNumber',
  'cvv',
  'email', // Mask email (keep domain)
  'phone',
  'phoneNumber',
  'driverLicense',
  'passport',
  'apiKey',
  'secret',
  'privateKey',
];

/**
 * Sanitize PII from data before logging
 */
function sanitizePII(data: any, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';

  if (data === null || data === undefined) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizePII(item, depth + 1));
  }

  // Handle objects
  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Check if key contains PII
      const isPII = PII_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));

      if (isPII) {
        // Special handling for email - keep domain
        if (lowerKey.includes('email') && typeof value === 'string' && value.includes('@')) {
          const [, domain] = value.split('@');
          sanitized[key] = `***@${domain}`;
        }
        // Special handling for phone - keep last 4 digits
        else if (lowerKey.includes('phone') && typeof value === 'string') {
          sanitized[key] = `***-***-${value.slice(-4)}`;
        }
        // Default: redact completely
        else {
          sanitized[key] = '[REDACTED]';
        }
      } else {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizePII(value, depth + 1);
      }
    }

    return sanitized;
  }

  // Return primitives as-is
  return data;
}

/**
 * Log security event with PII sanitization
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const sanitizedEvent = sanitizePII(event);

  // Add timestamp if not provided
  if (!sanitizedEvent.timestamp) {
    sanitizedEvent.timestamp = new Date().toISOString();
  }

  // Determine log level based on severity
  const severity = sanitizedEvent.severity || Severity.MEDIUM;

  switch (severity) {
    case Severity.CRITICAL:
      baseLogger.error('SECURITY_EVENT', sanitizedEvent);
      // TODO: Send alert to security team
      break;
    case Severity.HIGH:
      baseLogger.warn('SECURITY_EVENT', sanitizedEvent);
      break;
    case Severity.MEDIUM:
    case Severity.LOW:
    default:
      baseLogger.info('SECURITY_EVENT', sanitizedEvent);
      break;
  }

  // If this is a critical event, also log to security-specific log file
  if (severity === Severity.CRITICAL) {
    // TODO: Implement separate security log file or SIEM integration
    console.error('[CRITICAL_SECURITY_EVENT]', JSON.stringify(sanitizedEvent));
  }
}

/**
 * Log authentication success
 */
export function logAuthSuccess(userId: number | string, ip: string, userAgent?: string): void {
  logSecurityEvent({
    event: SecurityEventType.AUTH_SUCCESS,
    severity: Severity.LOW,
    userId,
    ip,
    userAgent,
  });
}

/**
 * Log authentication failure
 */
export function logAuthFailure(attemptedUser: string, ip: string, reason: string, userAgent?: string): void {
  logSecurityEvent({
    event: SecurityEventType.AUTH_FAILURE,
    severity: Severity.MEDIUM,
    attemptedUser: sanitizePII({ email: attemptedUser }).email, // Sanitize email
    ip,
    reason,
    userAgent,
  });
}

/**
 * Log authorization failure
 */
export function logAuthzFailure(userId: number | string, resource: string, action: string, ip: string): void {
  logSecurityEvent({
    event: SecurityEventType.AUTHZ_FAILURE,
    severity: Severity.HIGH,
    userId,
    resource,
    action,
    ip,
  });
}

/**
 * Log sensitive data access
 */
export function logDataAccess(
  userId: number | string,
  resource: string,
  action: 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT',
  recordIds: number[] | string[]
): void {
  logSecurityEvent({
    event: SecurityEventType.SENSITIVE_DATA_ACCESS,
    severity: action === 'DELETE' || action === 'EXPORT' ? Severity.HIGH : Severity.MEDIUM,
    userId,
    resource,
    action,
    recordCount: recordIds.length,
    // Don't log actual record IDs for privacy
  });
}

/**
 * Log admin action
 */
export function logAdminAction(
  adminId: number | string,
  action: string,
  target?: string,
  details?: Record<string, any>
): void {
  logSecurityEvent({
    event: SecurityEventType.ADMIN_ACTION,
    severity: Severity.HIGH,
    userId: adminId,
    action,
    target,
    details: sanitizePII(details),
  });
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
  description: string,
  ip: string,
  userId?: number | string,
  details?: Record<string, any>
): void {
  logSecurityEvent({
    event: SecurityEventType.SUSPICIOUS_ACTIVITY,
    severity: Severity.CRITICAL,
    description,
    ip,
    userId,
    details: sanitizePII(details),
  });
}

// Extend base logger with security logging
declare module './logger' {
  interface Logger {
    securityEvent(event: SecurityEvent): void;
  }
}

// Add security event method to base logger
(baseLogger as any).securityEvent = logSecurityEvent;

export { baseLogger as logger };
