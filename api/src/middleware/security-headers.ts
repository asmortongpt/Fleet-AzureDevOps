/**
 * Security Headers Middleware
 *
 * Comprehensive security headers implementation with:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options (Clickjacking protection)
 * - X-Content-Type-Options
 * - X-XSS-Protection
 * - Referrer Policy
 * - Permissions Policy
 * - FedRAMP compliance
 *
 * @module middleware/security-headers
 */

import { Request, Response, NextFunction } from 'express'

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  /**
   * Content Security Policy directives
   */
  csp?: {
    directives?: Record<string, string[]>
    reportOnly?: boolean
    reportUri?: string
  }

  /**
   * HSTS configuration
   */
  hsts?: {
    maxAge?: number
    includeSubDomains?: boolean
    preload?: boolean
  }

  /**
   * Enable various security headers
   */
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string
  contentTypeOptions?: boolean
  xssProtection?: boolean
  referrerPolicy?: string
  permissionsPolicy?: Record<string, string[]>

  /**
   * Custom headers to add
   */
  customHeaders?: Record<string, string>
}

/**
 * Default CSP directives for a secure API
 */
const DEFAULT_CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'base-uri': ["'self'"],
  'font-src': ["'self'", 'https:', 'data:'],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'object-src': ["'none'"],
  'script-src': ["'self'"],
  'script-src-attr': ["'none'"],
  'style-src': ["'self'", 'https:', "'unsafe-inline'"],
  'upgrade-insecure-requests': []
}

/**
 * Default permissions policy (restrictive)
 */
const DEFAULT_PERMISSIONS_POLICY = {
  'accelerometer': [],
  'camera': [],
  'geolocation': ["'self'"], // Allow geolocation for fleet tracking
  'gyroscope': [],
  'magnetometer': [],
  'microphone': [],
  'payment': [],
  'usb': []
}

/**
 * Build CSP header value from directives
 */
function buildCSPHeader(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key
      }
      return '${key} ${values.join(' ')}`
    })
    .join('; ')
}

/**
 * Build Permissions-Policy header value
 */
function buildPermissionsPolicyHeader(policy: Record<string, string[]>): string {
  return Object.entries(policy)
    .map(([feature, allowlist]) => {
      if (allowlist.length === 0) {
        return `${feature}=()`
      }
      return '${feature}=(${allowlist.join(' ')})`
    })
    .join(', ')
}

/**
 * Comprehensive security headers middleware
 *
 * Usage:
 * ```typescript
 * import { securityHeaders } from './middleware/security-headers'
 *
 * // Use default security headers
 * app.use(securityHeaders())
 *
 * // Custom configuration
 * app.use(securityHeaders({
 *   csp: {
 *     directives: {
 *       'default-src': ["'self'"],
 *       'img-src': ["'self'", 'https://cdn.example.com']
 *     }
 *   },
 *   hsts: {
 *     maxAge: 31536000,
 *     includeSubDomains: true,
 *     preload: true
 *   }
 * }))
 * ```
 */
export function securityHeaders(config: SecurityHeadersConfig = {}) {
  const {
    csp = {},
    hsts = {},
    frameOptions = 'DENY',
    contentTypeOptions = true,
    xssProtection = true,
    referrerPolicy = 'strict-origin-when-cross-origin',
    permissionsPolicy = DEFAULT_PERMISSIONS_POLICY,
    customHeaders = {}
  } = config

  return (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    const cspDirectives = {
      ...DEFAULT_CSP_DIRECTIVES,
      ...(csp.directives || {})
    }

    const cspHeader = buildCSPHeader(cspDirectives)

    if (csp.reportOnly) {
      res.setHeader('Content-Security-Policy-Report-Only', cspHeader)
    } else {
      res.setHeader('Content-Security-Policy', cspHeader)
    }

    // CSP Reporting
    if (csp.reportUri) {
      res.setHeader('Content-Security-Policy-Report-Only',
        `${cspHeader}; report-uri ${csp.reportUri}`)
    }

    // HTTP Strict Transport Security (FedRAMP SC-8)
    if (process.env.NODE_ENV === 'production') {
      const hstsMaxAge = hsts.maxAge || 31536000 // 1 year default
      const hstsIncludeSubDomains = hsts.includeSubDomains !== false
      const hstsPreload = hsts.preload || false

      let hstsValue = `max-age=${hstsMaxAge}`
      if (hstsIncludeSubDomains) {
        hstsValue += '; includeSubDomains'
      }
      if (hstsPreload) {
        hstsValue += '; preload'
      }

      res.setHeader('Strict-Transport-Security', hstsValue)
    }

    // X-Frame-Options (Clickjacking protection - FedRAMP SC-7)
    if (frameOptions) {
      res.setHeader('X-Frame-Options', frameOptions)
    }

    // X-Content-Type-Options (MIME sniffing protection)
    if (contentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff')
    }

    // X-XSS-Protection (Legacy XSS protection)
    if (xssProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block')
    }

    // Referrer-Policy
    if (referrerPolicy) {
      res.setHeader('Referrer-Policy', referrerPolicy)
    }

    // Permissions-Policy (formerly Feature-Policy)
    if (permissionsPolicy) {
      const permissionsPolicyHeader = buildPermissionsPolicyHeader(permissionsPolicy)
      res.setHeader('Permissions-Policy', permissionsPolicyHeader)
    }

    // X-DNS-Prefetch-Control
    res.setHeader('X-DNS-Prefetch-Control', 'off')

    // X-Download-Options (IE8+ download protection)
    res.setHeader('X-Download-Options', 'noopen')

    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')

    // Cross-Origin-Embedder-Policy
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')

    // Cross-Origin-Opener-Policy
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')

    // Cross-Origin-Resource-Policy
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')

    // Custom headers
    Object.entries(customHeaders).forEach(([key, value]) => {
      res.setHeader(key, value)
    })

    // Remove potentially dangerous headers
    res.removeHeader('X-Powered-By')

    next()
  }
}

/**
 * Strict security headers for high-security endpoints
 */
export function strictSecurityHeaders() {
  return securityHeaders({
    csp: {
      directives: {
        'default-src': ["'none'"],
        'script-src': ["'none'"],
        'style-src': ["'none'"],
        'img-src': ["'none'"],
        'font-src': ["'none'"],
        'connect-src': ["'none'"],
        'media-src': ["'none'"],
        'object-src': ["'none'"],
        'frame-src': ["'none'"],
        'worker-src': ["'none'"],
        'form-action': ["'none'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'none'"]
      }
    },
    frameOptions: 'DENY',
    permissionsPolicy: {
      'accelerometer': [],
      'camera': [],
      'geolocation': [],
      'gyroscope': [],
      'magnetometer': [],
      'microphone': [],
      'payment': [],
      'usb': []
    }
  })
}

/**
 * API-specific security headers
 */
export function apiSecurityHeaders() {
  return securityHeaders({
    csp: {
      directives: {
        'default-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'none'"]
      }
    },
    frameOptions: 'DENY'
  })
}

/**
 * Security headers for file download endpoints
 */
export function downloadSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // Prevent downloads from being embedded
    res.setHeader('X-Frame-Options', 'DENY')

    // Force download (not inline display)
    if (!res.getHeader('Content-Disposition')) {
      res.setHeader('Content-Disposition', 'attachment')
    }

    next()
  }
}

/**
 * Export default security headers
 */
export default securityHeaders
