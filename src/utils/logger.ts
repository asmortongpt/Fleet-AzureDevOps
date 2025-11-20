/**
 * Frontend Logging Utility
 *
 * Structured logging for the frontend with:
 * - Log level filtering based on environment
 * - Sensitive data sanitization (PII, tokens, passwords)
 * - Context enrichment
 * - Production-ready error reporting
 *
 * @module utils/logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

interface LogConfig {
  minLevel: LogLevel
  enableConsole: boolean
  enableRemote: boolean
  remoteEndpoint?: string
}

/**
 * List of sensitive field names to sanitize
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'auth',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'sessionId',
  'session_id',
  'creditCard',
  'credit_card',
  'ssn',
  'social_security',
  'bankAccount',
  'bank_account',
  'privateKey',
  'private_key',
]

/**
 * Logger class for frontend logging
 */
class Logger {
  private config: LogConfig
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  constructor() {
    // Determine log level from environment
    const envLevel = import.meta.env.VITE_LOG_LEVEL || 'info'
    const isDev = import.meta.env.MODE === 'development'

    this.config = {
      minLevel: isDev ? 'debug' : (envLevel as LogLevel),
      enableConsole: true,
      enableRemote: import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true',
      remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT,
    }
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.minLevel]
  }

  /**
   * Sanitize sensitive data from objects
   */
  private sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data
    }

    // Handle primitive types
    if (typeof data !== 'object') {
      return data
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item))
    }

    // Handle Error objects
    if (data instanceof Error) {
      return {
        message: data.message,
        name: data.name,
        stack: data.stack,
      }
    }

    // Handle regular objects
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()

      // Check if key is sensitive
      if (SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey.toLowerCase()))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * Format log message with timestamp and metadata
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(this.sanitize(context))}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
  }

  /**
   * Send log to remote endpoint (if configured)
   */
  private async sendToRemote(level: LogLevel, message: string, context?: LogContext): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) {
      return
    }

    try {
      const payload = {
        level,
        message,
        context: this.sanitize(context),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      // Use sendBeacon for better reliability, fallback to fetch
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
        navigator.sendBeacon(this.config.remoteEndpoint, blob)
      } else {
        fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {
          // Silently fail remote logging
        })
      }
    } catch (error) {
      // Don't log errors from the logger itself
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return

    const formattedMessage = this.formatMessage('debug', message, context)

    if (this.config.enableConsole) {
      console.debug(formattedMessage)
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return

    const formattedMessage = this.formatMessage('info', message, context)

    if (this.config.enableConsole) {
      console.info(formattedMessage)
    }

    this.sendToRemote('info', message, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return

    const formattedMessage = this.formatMessage('warn', message, context)

    if (this.config.enableConsole) {
      console.warn(formattedMessage)
    }

    this.sendToRemote('warn', message, context)
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    if (!this.shouldLog('error')) return

    const formattedMessage = this.formatMessage('error', message, context)

    if (this.config.enableConsole) {
      console.error(formattedMessage)
    }

    // Always send errors to remote endpoint
    this.sendToRemote('error', message, context)
  }

  /**
   * Log unhandled errors
   */
  logError(error: Error, context?: LogContext): void {
    this.error(error.message, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    const originalDebug = childLogger.debug.bind(childLogger)
    const originalInfo = childLogger.info.bind(childLogger)
    const originalWarn = childLogger.warn.bind(childLogger)
    const originalError = childLogger.error.bind(childLogger)

    childLogger.debug = (message: string, ctx?: LogContext) =>
      originalDebug(message, { ...context, ...ctx })
    childLogger.info = (message: string, ctx?: LogContext) => originalInfo(message, { ...context, ...ctx })
    childLogger.warn = (message: string, ctx?: LogContext) => originalWarn(message, { ...context, ...ctx })
    childLogger.error = (message: string, ctx?: LogContext) =>
      originalError(message, { ...context, ...ctx })

    return childLogger
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

/**
 * Global logger instance
 */
const logger = new Logger()

/**
 * Setup global error handlers
 */
if (typeof window !== 'undefined') {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logger.error('Unhandled error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    })
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason,
      promise: event.promise,
    })
  })
}

export default logger
export { logger, Logger }
export type { LogLevel, LogContext, LogConfig }
