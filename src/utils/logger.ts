/**
 * SECURITY FIX P3 LOW-SEC-001: Centralized Logging with PII/Credential Redaction
 *
 * Provides environment-aware logging with automatic redaction of sensitive fields.
 *
 * Features:
 * - Environment-based log levels (debug only in dev)
 * - Automatic PII/credential redaction
 * - Structured logging with timestamps
 * - Zero production overhead for debug logs
 *
 * Usage:
 * ```typescript
 * import logger from '@/utils/logger'
 *
 * logger.debug('Vehicle data:', logger.redact(vehicleData))
 * logger.info('User logged in:', { userId: user.id })
 * logger.error('API call failed:', error)
 * ```
 */

// Environment detection
const isDevelopment = import.meta.env.MODE === 'development'
const DEBUG_ENABLED = typeof window !== 'undefined' &&
                     localStorage.getItem('debug_fleet_data') === 'true'

// Sensitive field patterns to redact
const SENSITIVE_PATTERNS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'ssn',
  'creditCard',
  'credit_card',
  'cvv',
  'pin',
  'authorization',
  'auth',
  'bearer',
  'session',
  'cookie'
]

// Email pattern for redaction
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

// Phone number pattern for redaction
const PHONE_REGEX = /\b(\d{3}[-.]?)?\d{3}[-.]?\d{4}\b/g

/**
 * Redact sensitive fields from objects, arrays, and strings
 */
function redactValue(value: any, depth = 0): any {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]'

  // Null/undefined
  if (value === null || value === undefined) return value

  // String redaction
  if (typeof value === 'string') {
    // Redact emails (keep first 3 chars)
    let redacted = value.replace(EMAIL_REGEX, (match) => {
      return match.substring(0, 3) + '***@***.***'
    })

    // Redact phone numbers
    redacted = redacted.replace(PHONE_REGEX, '***-***-****')

    // Redact long tokens/secrets (likely base64 or hex)
    if (redacted.length > 50 && /^[A-Za-z0-9+/=_-]+$/.test(redacted)) {
      return '[REDACTED_TOKEN]'
    }

    return redacted
  }

  // Array redaction
  if (Array.isArray(value)) {
    return value.map(item => redactValue(item, depth + 1))
  }

  // Object redaction
  if (typeof value === 'object') {
    const redacted: any = {}

    for (const [key, val] of Object.entries(value)) {
      const lowerKey = key.toLowerCase()

      // Check if key matches sensitive pattern
      const isSensitive = SENSITIVE_PATTERNS.some(pattern =>
        lowerKey.includes(pattern.toLowerCase())
      )

      if (isSensitive) {
        redacted[key] = '[REDACTED]'
      } else {
        redacted[key] = redactValue(val, depth + 1)
      }
    }

    return redacted
  }

  // Primitives (numbers, booleans)
  return value
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: string, ...args: any[]): any[] {
  const timestamp = new Date().toISOString()
  return [`[${timestamp}] [${level}]`, ...args]
}

/**
 * Centralized logger with redaction and environment awareness
 */
const logger = {
  /**
   * Debug logging - only in development or when explicitly enabled
   * NEVER logs in production by default
   */
  debug: (...args: any[]) => {
    if (isDevelopment || DEBUG_ENABLED) {
      console.log(...formatMessage('DEBUG', ...args))
    }
  },

  /**
   * Info logging - always logs
   * Use for important non-sensitive information
   */
  info: (...args: any[]) => {
    console.log(...formatMessage('INFO', ...args))
  },

  /**
   * Warning logging - always logs
   */
  warn: (...args: any[]) => {
    console.warn(...formatMessage('WARN', ...args))
  },

  /**
   * Error logging - always logs
   * Automatically redacts error messages
   */
  error: (...args: any[]) => {
    const redactedArgs = args.map(arg => {
      if (arg instanceof Error) {
        return {
          message: redactValue(arg.message),
          name: arg.name,
          // Only include stack trace in development
          ...(isDevelopment && { stack: arg.stack })
        }
      }
      return redactValue(arg)
    })
    console.error(...formatMessage('ERROR', ...redactedArgs))
  },

  /**
   * Redact sensitive fields from any value
   * Use before logging user data, API responses, etc.
   *
   * @example
   * logger.info('User data:', logger.redact(userData))
   */
  redact: (value: any): any => {
    return redactValue(value)
  },

  /**
   * Check if debug logging is enabled
   */
  isDebugEnabled: (): boolean => {
    return isDevelopment || DEBUG_ENABLED
  },

  /**
   * Group logs together (useful for complex operations)
   */
  group: (label: string) => {
    if (isDevelopment || DEBUG_ENABLED) {
      console.group(label)
    }
  },

  /**
   * End log group
   */
  groupEnd: () => {
    if (isDevelopment || DEBUG_ENABLED) {
      console.groupEnd()
    }
  }
}

// Export as default
export default logger

// Also export named for flexibility
export { logger }
