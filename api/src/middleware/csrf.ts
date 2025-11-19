/**
 * CSRF Protection Middleware
 *
 * Cross-Site Request Forgery (CSRF) protection with:
 * - Double-submit cookie pattern
 * - Synchronizer token pattern
 * - Origin/Referer validation
 * - SameSite cookie attribute
 * - Exemptions for safe methods (GET, HEAD, OPTIONS)
 * - Custom token generation
 *
 * @module middleware/csrf
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { AuthRequest } from './auth'
import { AppError } from './error-handler'
import { securityLogger } from '../utils/logger'

/**
 * CSRF token store (use Redis in production for distributed systems)
 */
class CSRFTokenStore {
  private tokens: Map<string, { token: string; expires: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired tokens every 10 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, value] of this.tokens.entries()) {
        if (value.expires < now) {
          this.tokens.delete(key)
        }
      }
    }, 10 * 60 * 1000)
  }

  /**
   * Generate and store a CSRF token
   */
  generate(identifier: string, ttl: number = 3600000): string {
    const token = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + ttl

    this.tokens.set(identifier, { token, expires })

    return token
  }

  /**
   * Validate a CSRF token
   */
  validate(identifier: string, token: string): boolean {
    const stored = this.tokens.get(identifier)

    if (!stored) {
      return false
    }

    if (stored.expires < Date.now()) {
      this.tokens.delete(identifier)
      return false
    }

    return stored.token === token
  }

  /**
   * Delete a token
   */
  delete(identifier: string): void {
    this.tokens.delete(identifier)
  }

  /**
   * Cleanup on shutdown
   */
  cleanup(): void {
    clearInterval(this.cleanupInterval)
  }
}

const tokenStore = new CSRFTokenStore()

/**
 * CSRF configuration
 */
interface CSRFConfig {
  /**
   * Cookie name for CSRF token
   */
  cookieName?: string

  /**
   * Header name for CSRF token
   */
  headerName?: string

  /**
   * Token lifetime in milliseconds
   */
  tokenLifetime?: number

  /**
   * Skip CSRF check for certain paths
   */
  skipPaths?: string[]

  /**
   * Enable origin validation
   */
  validateOrigin?: boolean

  /**
   * Allowed origins for CORS
   */
  allowedOrigins?: string[]
}

/**
 * Safe HTTP methods that don't require CSRF protection
 */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

/**
 * Generate CSRF token for a user session
 */
export function generateCSRFToken(req: AuthRequest): string {
  const identifier = req.user?.id || req.sessionID || req.ip || 'anonymous'
  return tokenStore.generate(identifier)
}

/**
 * CSRF protection middleware
 *
 * Usage:
 * ```typescript
 * import { csrfProtection, generateCSRFToken } from './middleware/csrf'
 *
 * // Apply to all routes
 * app.use(csrfProtection())
 *
 * // Get token in a route
 * app.get('/api/csrf-token', (req, res) => {
 *   const token = generateCSRFToken(req)
 *   res.json({ csrfToken: token })
 * })
 * ```
 */
export function csrfProtection(config: CSRFConfig = {}) {
  const {
    cookieName = 'XSRF-TOKEN',
    headerName = 'X-CSRF-Token',
    tokenLifetime = 3600000, // 1 hour
    skipPaths = [],
    validateOrigin = true,
    allowedOrigins = []
  } = config

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Skip CSRF check for safe methods
    if (SAFE_METHODS.includes(req.method)) {
      return next()
    }

    // Skip CSRF check for configured paths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next()
    }

    // Skip for webhook endpoints (they have their own validation)
    if (req.path.includes('/webhooks/')) {
      return next()
    }

    // Skip in development if explicitly disabled
    if (process.env.CSRF_DISABLED === 'true' && process.env.NODE_ENV === 'development') {
      return next()
    }

    try {
      // Get identifier
      const identifier = req.user?.id || req.sessionID || req.ip || 'anonymous'

      // Get token from header or body
      const token = req.headers[headerName.toLowerCase()] as string ||
                   req.body?._csrf ||
                   req.query?._csrf as string

      if (!token) {
        securityLogger.incident('csrf', {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          userId: req.user?.id,
          tenantId: req.user?.tenant_id,
          details: {
            endpoint: req.path,
            method: req.method,
            reason: 'Missing CSRF token'
          },
          severity: 'medium'
        })

        throw new AppError(
          'CSRF token missing. Please refresh the page and try again.',
          403,
          'CSRF_TOKEN_MISSING'
        )
      }

      // Validate token
      if (!tokenStore.validate(identifier, token)) {
        securityLogger.incident('csrf', {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          userId: req.user?.id,
          tenantId: req.user?.tenant_id,
          details: {
            endpoint: req.path,
            method: req.method,
            reason: 'Invalid CSRF token'
          },
          severity: 'high'
        })

        throw new AppError(
          'Invalid CSRF token. Please refresh the page and try again.',
          403,
          'CSRF_TOKEN_INVALID'
        )
      }

      // Validate origin/referer if configured
      if (validateOrigin) {
        const origin = req.get('origin') || req.get('referer')

        if (origin) {
          const originUrl = new URL(origin)
          const isAllowed = allowedOrigins.some(allowed =>
            originUrl.origin === allowed || origin.startsWith(allowed)
          )

          if (!isAllowed && process.env.NODE_ENV === 'production') {
            securityLogger.incident('csrf', {
              ip: req.ip,
              userAgent: req.get('user-agent'),
              userId: req.user?.id,
              tenantId: req.user?.tenant_id,
              details: {
                endpoint: req.path,
                method: req.method,
                origin,
                reason: 'Invalid origin'
              },
              severity: 'high'
            })

            throw new AppError(
              'Request origin not allowed',
              403,
              'INVALID_ORIGIN'
            )
          }
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware to attach CSRF token to response
 *
 * Usage:
 * ```typescript
 * app.use(attachCSRFToken())
 * ```
 */
export function attachCSRFToken(config: CSRFConfig = {}) {
  const {
    cookieName = 'XSRF-TOKEN',
    tokenLifetime = 3600000
  } = config

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Generate token
    const token = generateCSRFToken(req)

    // Set token in cookie
    res.cookie(cookieName, token, {
      httpOnly: false, // Must be accessible to JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokenLifetime
    })

    // Attach token to response locals for template rendering
    res.locals.csrfToken = token

    next()
  }
}

/**
 * Get CSRF token endpoint
 *
 * Usage:
 * ```typescript
 * app.get('/api/csrf-token', getCSRFTokenEndpoint)
 * ```
 */
export function getCSRFTokenEndpoint(req: AuthRequest, res: Response) {
  const token = generateCSRFToken(req)
  res.json({ csrfToken: token })
}

/**
 * Double-submit cookie CSRF protection
 * (Alternative implementation that doesn't require server-side storage)
 */
export function doubleSubmitCookieCSRF(config: CSRFConfig = {}) {
  const {
    cookieName = 'XSRF-TOKEN',
    headerName = 'X-CSRF-Token',
    skipPaths = []
  } = config

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF check for safe methods
    if (SAFE_METHODS.includes(req.method)) {
      // Generate and set cookie for safe methods
      const token = crypto.randomBytes(32).toString('hex')
      res.cookie(cookieName, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      return next()
    }

    // Skip CSRF check for configured paths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next()
    }

    try {
      // Get token from cookie
      const cookieToken = req.cookies?.[cookieName]

      // Get token from header
      const headerToken = req.headers[headerName.toLowerCase()] as string

      // Both must exist and match
      if (!cookieToken || !headerToken) {
        throw new AppError(
          'CSRF token missing',
          403,
          'CSRF_TOKEN_MISSING'
        )
      }

      if (cookieToken !== headerToken) {
        throw new AppError(
          'CSRF token mismatch',
          403,
          'CSRF_TOKEN_MISMATCH'
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Export token store for testing
 */
export { tokenStore }

/**
 * Cleanup function (call on server shutdown)
 */
export function cleanup(): void {
  tokenStore.cleanup()
}
