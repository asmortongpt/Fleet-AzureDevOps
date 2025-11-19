/**
 * Request Sanitization Middleware
 *
 * Input sanitization to prevent:
 * - XSS (Cross-Site Scripting)
 * - NoSQL injection
 * - Path traversal
 * - Command injection
 * - LDAP injection
 * - XML injection
 *
 * @module middleware/sanitization
 */

import { Request, Response, NextFunction } from 'express'
import { securityLogger } from '../utils/logger'

/**
 * Dangerous patterns that should be sanitized
 */
const DANGEROUS_PATTERNS = {
  // XSS patterns
  script: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  onEvent: /\son\w+\s*=\s*["'][^"']*["']/gi,
  javascript: /javascript:/gi,

  // NoSQL injection patterns
  noSqlOperators: /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex)/gi,

  // Path traversal
  pathTraversal: /\.\.[\/\\]/g,
  absolutePath: /^[\/\\]|^[a-zA-Z]:[\/\\]/,

  // Command injection
  commandChars: /[;&|`$()]/g,

  // SQL injection (basic patterns)
  sqlComments: /(--|#|\/\*|\*\/)/g,
  sqlKeywords: /\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b/gi,

  // LDAP injection
  ldapChars: /[()&|!=<>]/g,

  // XML injection
  xmlTags: /<\/?[^>]+(>|$)/g
}

/**
 * Sanitization configuration
 */
interface SanitizationConfig {
  /**
   * Fields to skip sanitization
   */
  skipFields?: string[]

  /**
   * Enable different sanitization modes
   */
  modes?: {
    xss?: boolean
    sql?: boolean
    noSql?: boolean
    pathTraversal?: boolean
    commandInjection?: boolean
    ldap?: boolean
    xml?: boolean
  }

  /**
   * Strict mode (removes all potentially dangerous characters)
   */
  strict?: boolean

  /**
   * Log sanitization events
   */
  logSanitization?: boolean
}

/**
 * Default sanitization config
 */
const DEFAULT_CONFIG: SanitizationConfig = {
  skipFields: ['password', 'token'], // Don't sanitize these (they should be hashed anyway)
  modes: {
    xss: true,
    sql: true,
    noSql: true,
    pathTraversal: true,
    commandInjection: true,
    ldap: false,
    xml: false
  },
  strict: false,
  logSanitization: true
}

/**
 * Sanitize a string value
 */
function sanitizeString(value: string, config: SanitizationConfig, fieldName?: string): string {
  let sanitized = value
  let modified = false

  const modes = { ...DEFAULT_CONFIG.modes, ...config.modes }

  // XSS protection
  if (modes.xss) {
    const originalLength = sanitized.length

    // Remove script tags
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.script, '')

    // Remove event handlers
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.onEvent, '')

    // Remove javascript: protocol
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.javascript, '')

    // Encode HTML entities
    if (config.strict) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    }

    if (sanitized.length !== originalLength) {
      modified = true
    }
  }

  // NoSQL injection protection
  if (modes.noSql) {
    const originalLength = sanitized.length
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.noSqlOperators, '')
    if (sanitized.length !== originalLength) {
      modified = true
    }
  }

  // SQL injection protection (basic)
  if (modes.sql) {
    const originalLength = sanitized.length

    // Remove SQL comments
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.sqlComments, '')

    // In strict mode, remove SQL keywords
    if (config.strict) {
      sanitized = sanitized.replace(DANGEROUS_PATTERNS.sqlKeywords, '')
    }

    if (sanitized.length !== originalLength) {
      modified = true
    }
  }

  // Path traversal protection
  if (modes.pathTraversal) {
    const originalLength = sanitized.length

    // Remove path traversal sequences
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.pathTraversal, '')

    // Remove absolute paths in strict mode
    if (config.strict) {
      sanitized = sanitized.replace(DANGEROUS_PATTERNS.absolutePath, '')
    }

    if (sanitized.length !== originalLength) {
      modified = true
    }
  }

  // Command injection protection
  if (modes.commandInjection) {
    const originalLength = sanitized.length
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.commandChars, '')
    if (sanitized.length !== originalLength) {
      modified = true
    }
  }

  // LDAP injection protection
  if (modes.ldap) {
    const originalLength = sanitized.length
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.ldapChars, '')
    if (sanitized.length !== originalLength) {
      modified = true
    }
  }

  // XML injection protection
  if (modes.xml) {
    const originalLength = sanitized.length
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.xmlTags, '')
    if (sanitized.length !== originalLength) {
      modified = true
    }
  }

  // Trim whitespace
  sanitized = sanitized.trim()

  // Log if modified
  if (modified && config.logSanitization) {
    securityLogger.incident('xss_attempt', {
      details: {
        field: fieldName,
        original: value.substring(0, 100),
        sanitized: sanitized.substring(0, 100)
      },
      severity: 'low'
    })
  }

  return sanitized
}

/**
 * Sanitize any value recursively
 */
function sanitizeValue(value: any, config: SanitizationConfig, fieldName?: string): any {
  if (typeof value === 'string') {
    // Skip if in skip fields
    if (fieldName && config.skipFields?.includes(fieldName)) {
      return value
    }

    return sanitizeString(value, config, fieldName)
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeValue(item, config, `${fieldName}[${index}]`)
    )
  }

  if (value && typeof value === 'object' && value.constructor === Object) {
    const sanitized: any = {}

    for (const [key, val] of Object.entries(value)) {
      const newFieldName = fieldName ? `${fieldName}.${key}` : key

      // Sanitize the key itself
      const sanitizedKey = sanitizeString(key, config)

      // Sanitize the value
      sanitized[sanitizedKey] = sanitizeValue(val, config, newFieldName)
    }

    return sanitized
  }

  return value
}

/**
 * Request sanitization middleware
 *
 * Usage:
 * ```typescript
 * import { sanitizeRequest } from './middleware/sanitization'
 *
 * // Sanitize all requests
 * app.use(sanitizeRequest())
 *
 * // Custom config
 * app.use(sanitizeRequest({
 *   strict: true,
 *   modes: {
 *     xss: true,
 *     sql: true,
 *     noSql: true
 *   }
 * }))
 * ```
 */
export function sanitizeRequest(config: SanitizationConfig = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize request body
      if (req.body) {
        req.body = sanitizeValue(req.body, fullConfig, 'body')
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = sanitizeValue(req.query, fullConfig, 'query')
      }

      // Sanitize URL parameters
      if (req.params) {
        req.params = sanitizeValue(req.params, fullConfig, 'params')
      }

      next()
    } catch (error) {
      securityLogger.incident('suspicious_activity', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        details: {
          error: (error as Error).message,
          endpoint: req.path
        },
        severity: 'high'
      })

      next(error)
    }
  }
}

/**
 * Strict sanitization for high-security endpoints
 */
export function strictSanitization() {
  return sanitizeRequest({
    strict: true,
    modes: {
      xss: true,
      sql: true,
      noSql: true,
      pathTraversal: true,
      commandInjection: true,
      ldap: true,
      xml: true
    }
  })
}

/**
 * Sanitize specific fields in a route
 */
export function sanitizeFields(...fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const config: SanitizationConfig = {
      ...DEFAULT_CONFIG,
      skipFields: []
    }

    for (const field of fields) {
      if (req.body && req.body[field] !== undefined) {
        req.body[field] = sanitizeValue(req.body[field], config, field)
      }

      if (req.query && req.query[field] !== undefined) {
        req.query[field] = sanitizeValue(req.query[field], config, field)
      }

      if (req.params && req.params[field] !== undefined) {
        req.params[field] = sanitizeValue(req.params[field], config, field)
      }
    }

    next()
  }
}

/**
 * Export sanitization utilities
 */
export const sanitizationUtils = {
  /**
   * Manually sanitize a value
   */
  sanitize: (value: any, config?: SanitizationConfig) =>
    sanitizeValue(value, { ...DEFAULT_CONFIG, ...config }),

  /**
   * Check if value contains dangerous patterns
   */
  isDangerous: (value: string): boolean => {
    if (typeof value !== 'string') return false

    return Object.values(DANGEROUS_PATTERNS).some(pattern =>
      pattern.test(value)
    )
  },

  /**
   * Get list of dangerous patterns found
   */
  findDangerousPatterns: (value: string): string[] => {
    if (typeof value !== 'string') return []

    const found: string[] = []

    Object.entries(DANGEROUS_PATTERNS).forEach(([name, pattern]) => {
      if (pattern.test(value)) {
        found.push(name)
      }
    })

    return found
  }
}

/**
 * Export default sanitization
 */
export default sanitizeRequest
