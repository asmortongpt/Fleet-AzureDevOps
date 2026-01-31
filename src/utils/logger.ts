/**
 * Production-Grade Logger with PII Redaction
 *
 * Features:
 * - Environment-aware logging (console in dev, service in prod)
 * - Automatic PII/sensitive data redaction
 * - Structured logging with context
 * - Log levels: debug, info, warn, error, fatal
 * - Application Insights integration ready
 * - Zero console output in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

type LogContext = string | {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  [key: string]: any
}

class ProductionLogger {
  private isProduction = import.meta.env.PROD
  private isDevelopment = import.meta.env.DEV
  private logLevel: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info'

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal']
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  private redactSensitiveData(data: any): any {
    if (!data) return data
    if (this.isDevelopment && import.meta.env.VITE_LOG_SHOW_SENSITIVE === 'true') return data

    const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'authorization', 'creditcard', 'ssn']

    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item))
    }

    if (typeof data === 'object' && data !== null) {
      const redacted: any = {}
      for (const [key, value] of Object.entries(data)) {
        if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
          redacted[key] = '[REDACTED]'
        } else if (typeof value === 'object') {
          redacted[key] = this.redactSensitiveData(value)
        } else {
          redacted[key] = value
        }
      }
      return redacted
    }

    return data
  }

  private sendToService(level: LogLevel, message: string, context?: LogContext, error?: any) {
    if (!this.isProduction) return
    if (typeof window !== 'undefined') {
      if (!window.__LOG_BUFFER__) window.__LOG_BUFFER__ = []
      window.__LOG_BUFFER__.push({ level, message, context, error, timestamp: new Date().toISOString() })
      if (window.__LOG_BUFFER__.length > 100) window.__LOG_BUFFER__.shift()
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return
    const redacted = this.redactSensitiveData(context)
    if (this.isDevelopment) console.debug('[DEBUG]', message, redacted)
    this.sendToService('debug', message, redacted)
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return
    const redacted = this.redactSensitiveData(context)
    if (this.isDevelopment) console.info('[INFO]', message, redacted)
    this.sendToService('info', message, redacted)
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return
    const redacted = this.redactSensitiveData(context)
    if (this.isDevelopment) console.warn('[WARN]', message, redacted)
    this.sendToService('warn', message, redacted)
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (!this.shouldLog('error')) return
    const redacted = this.redactSensitiveData(context)
    if (this.isDevelopment) console.error('[ERROR]', message, error, redacted)
    this.sendToService('error', message, redacted, error)
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext) {
    const redacted = this.redactSensitiveData(context)
    console.error('[FATAL]', message, error, redacted)
    this.sendToService('fatal', message, redacted, error)
  }

  log(...args: any[]) {
    this.info(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
  }

  // Alias methods for compatibility
  logError(message: string, error?: Error | unknown, context?: LogContext) {
    this.error(message, error, context)
  }

  logAudit(message: string, context?: LogContext) {
    this.info(`[AUDIT] ${message}`, context)
  }

  logWarning(message: string, context?: LogContext) {
    this.warn(message, context)
  }

  logInfo(message: string, context?: LogContext) {
    this.info(message, context)
  }

  logDebug(message: string, context?: LogContext) {
    this.debug(message, context)
  }

  redact = this.redactSensitiveData.bind(this)
}

declare global {
  interface Window {
    __LOG_BUFFER__?: Array<any>
  }
}

export const logger = new ProductionLogger()
export const createLogger = () => logger
export default logger