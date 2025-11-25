/**
 * Centralized Logging Utility
 *
 * Production-ready logging service using Winston with:
 * - Structured logging (JSON format)
 * - Multiple transports (console, file, external services)
 * - Log levels (error, warn, info, http, debug)
 * - Request correlation IDs
 * - Performance monitoring
 * - Security event logging
 * - Compliance audit trails
 *
 * @module utils/logger
 */

import winston from 'winston'
import path from 'path'
import fs from 'fs'

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

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
    security: 5
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
    security: 'cyan'
  }
}

winston.addColors(customLevels.colors)

/**
 * Custom format for development (readable)
 */
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info
    let output = `${timestamp} [${level}]: ${message}`

    if (Object.keys(meta).length > 0) {
      output += `\n${JSON.stringify(meta, null, 2)}`
    }

    return output
  })
)

/**
 * Custom format for production (JSON)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

/**
 * Create console transport
 */
const consoleTransport = new winston.transports.Console({
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat
})

/**
 * Create file transports
 */
const fileTransports = [
  // All logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: prodFormat
  }),

  // Error logs
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 10485760,
    maxFiles: 5,
    format: prodFormat
  }),

  // Security logs
  new winston.transports.File({
    filename: path.join(logsDir, 'security.log'),
    level: 'security',
    maxsize: 10485760,
    maxFiles: 10,
    format: prodFormat
  }),

  // HTTP access logs
  new winston.transports.File({
    filename: path.join(logsDir, 'access.log'),
    level: 'http',
    maxsize: 10485760,
    maxFiles: 5,
    format: prodFormat
  })
]

/**
 * Main logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: customLevels.levels,
  transports: process.env.NODE_ENV === 'production'
    ? [consoleTransport, ...fileTransports]
    : [consoleTransport],
  exitOnError: false
})

/**
 * Stream for Morgan HTTP logging middleware
 */
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim())
  }
}

/**
 * Security logger for audit trail
 */
export const securityLogger = {
  /**
   * Log authentication events
   */
  auth(event: 'login' | 'logout' | 'failed_login' | 'token_refresh', data: {
    userId?: string
    email?: string
    ip?: string
    userAgent?: string
    tenantId?: string
    reason?: string
  }) {
    logger.log('security', 'AUTH_${event.toUpperCase()}`, {
      category: 'authentication',
      event,
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  /**
   * Log authorization events (permission checks)
   */
  authz(granted: boolean, data: {
    userId: string
    tenantId: string
    permission: string
    resource?: string
    resourceId?: string
    reason?: string
    ip?: string
  }) {
    logger.log('security', 'AUTHZ_${granted ? 'GRANTED' : 'DENIED'}', {
      category: 'authorization',
      granted,
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  /**
   * Log data access events (PII, sensitive data)
   */
  dataAccess(action: 'read' | 'write' | 'delete', data: {
    userId: string
    tenantId: string
    resourceType: string
    resourceId?: string
    fields?: string[]
    ip?: string
    userAgent?: string
  }) {
    logger.log('security', 'DATA_${action.toUpperCase()}`, {
      category: 'data_access',
      action,
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  /**
   * Log security incidents
   */
  incident(type: 'rate_limit' | 'brute_force' | 'sql_injection' | 'xss_attempt' | 'csrf' | 'idor' | 'break_glass' | 'suspicious_activity', data: {
    userId?: string
    tenantId?: string
    ip?: string
    userAgent?: string
    details?: any
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }) {
    logger.log('security', 'INCIDENT_${type.toUpperCase()}`, {
      category: 'security_incident',
      type,
      severity: data.severity || 'medium',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  /**
   * Log configuration changes
   */
  configChange(data: {
    userId: string
    tenantId: string
    setting: string
    oldValue?: any
    newValue?: any
    ip?: string
  }) {
    logger.log('security', 'CONFIG_CHANGE', {
      category: 'configuration',
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  /**
   * Log break-glass access
   */
  breakGlass(data: {
    userId: string
    tenantId: string
    reason: string
    approver?: string
    action: string
    resourceType: string
    resourceId?: string
    ip?: string
  }) {
    logger.log('security', 'BREAK_GLASS_ACCESS', {
      category: 'break_glass',
      severity: 'high',
      ...data,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Performance logger for monitoring
 */
export const perfLogger = {
  /**
   * Log database query performance
   */
  query(data: {
    query: string
    duration: number
    rows?: number
    params?: any[]
    slow?: boolean
  }) {
    if (data.slow || data.duration > 1000) {
      logger.warn('Slow database query', {
        category: 'performance',
        type: 'database',
        ...data
      })
    } else if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Database query', {
        category: 'performance',
        type: 'database',
        ...data
      })
    }
  },

  /**
   * Log API endpoint performance
   */
  endpoint(data: {
    method: string
    path: string
    statusCode: number
    duration: number
    userId?: string
    tenantId?: string
  }) {
    const level = data.duration > 3000 ? 'warn' : 'http'
    logger.log(level, 'API Request', {
      category: 'performance',
      type: 'api',
      ...data
    })
  },

  /**
   * Log cache operations
   */
  cache(operation: 'hit' | 'miss' | 'set' | 'delete', data: {
    key: string
    duration?: number
    size?: number
  }) {
    logger.debug('Cache operation', {
      category: 'performance',
      type: 'cache',
      operation,
      ...data
    })
  },

  /**
   * Log external API calls
   */
  externalApi(data: {
    service: string
    endpoint: string
    method: string
    duration: number
    statusCode?: number
    error?: string
  }) {
    const level = data.error ? 'error' : (data.duration > 5000 ? 'warn' : 'info')
    logger.log(level, 'External API call', {
      category: 'performance',
      type: 'external_api',
      ...data
    })
  }
}

/**
 * Business logger for important business events
 */
export const businessLogger = {
  /**
   * Log critical business operations
   */
  event(event: string, data: {
    userId?: string
    tenantId?: string
    entityType?: string
    entityId?: string
    details?: any
  }) {
    logger.info(event, {
      category: 'business',
      event,
      ...data,
      timestamp: new Date().toISOString()
    })
  },

  /**
   * Log compliance-related events
   */
  compliance(event: string, data: {
    userId: string
    tenantId: string
    complianceType: 'OSHA' | 'DOT' | 'EPA' | 'GDPR' | 'SOC2' | 'FedRAMP'
    details?: any
  }) {
    logger.info(`COMPLIANCE: ${event}`, {
      category: 'compliance',
      event,
      ...data,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Middleware for request logging
 */
export function requestLogger() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now()

    // Capture response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime

      perfLogger.endpoint({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
      })
    })

    next()
  }
}

/**
 * Export default logger
 */
export default logger
