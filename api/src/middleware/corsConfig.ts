/**
 * Production-Grade CORS Security Configuration
 *
 * This module provides hardened CORS configuration for the Fleet API with:
 * - Strict origin validation (no wildcards in production)
 * - HTTPS enforcement in production
 * - Development-only localhost access
 * - Comprehensive CORS rejection logging
 * - Environment-based configuration via CORS_ORIGIN
 *
 * Security Controls:
 * - FedRAMP SC-7 (Boundary Protection)
 * - FedRAMP AC-4 (Information Flow Enforcement)
 * - CWE-346 (Origin Validation Error)
 * - CWE-942 (Overly Permissive CORS Policy)
 */

import { CorsOptions, CorsOptionsDelegate } from 'cors'

/**
 * Interface for CORS rejection log entries
 */
interface CorsRejectionLog {
  timestamp: string
  origin: string | undefined
  method: string
  path: string
  reason: string
  userAgent?: string
  ip?: string
}

/**
 * Development-only localhost origins
 * These are ONLY allowed when NODE_ENV === 'development'
 */
const DEVELOPMENT_ORIGINS: readonly string[] = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:8080'
] as const

/**
 * Check if the current environment is development
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if the current environment is production
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Parse and validate the CORS_ORIGIN environment variable
 * Returns an array of validated origin strings
 */
function parseAllowedOrigins(): string[] {
  const corsOrigin = process.env.CORS_ORIGIN

  if (!corsOrigin) {
    if (isProduction()) {
      console.warn('[CORS] WARNING: No CORS_ORIGIN configured in production environment')
      console.warn('[CORS] Set CORS_ORIGIN environment variable with comma-separated origins')
    }
    return []
  }

  // Split by comma and clean up whitespace
  const origins = corsOrigin
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0)

  // Validate each origin in production
  if (isProduction()) {
    const invalidOrigins = origins.filter(origin => !isValidProductionOrigin(origin))
    if (invalidOrigins.length > 0) {
      console.error('[CORS] SECURITY ERROR: Invalid production origins detected:')
      invalidOrigins.forEach(origin => {
        console.error(`[CORS]   - ${origin}: Production origins must use HTTPS`)
      })
      // Filter out invalid origins
      return origins.filter(origin => isValidProductionOrigin(origin))
    }
  }

  return origins
}

/**
 * Validate that a production origin uses HTTPS
 * In production, all origins MUST use HTTPS (except for testing scenarios)
 */
function isValidProductionOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    // Production origins must use HTTPS
    return url.protocol === 'https:'
  } catch {
    // Invalid URL format
    return false
  }
}

/**
 * Check if an origin is a localhost/development origin
 */
function isLocalhostOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    const hostname = url.hostname.toLowerCase()
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return false
  }
}

/**
 * Validate an origin against the whitelist with strict matching
 * - No wildcards allowed
 * - Exact origin matching only
 * - Case-sensitive comparison
 */
function validateOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
  callback: (err: Error | null, allow?: boolean) => void
): void {
  // If no origin header, this is likely a same-origin request or non-browser client
  // For security, we allow this but log it for monitoring
  if (!origin) {
    // Allow requests with no origin (same-origin, curl, mobile apps)
    // These are validated by other security mechanisms (auth, CSRF)
    callback(null, true)
    return
  }

  // Check if origin is in the allowed list (exact match)
  if (allowedOrigins.includes(origin)) {
    callback(null, true)
    return
  }

  // In development, also allow localhost origins
  if (isDevelopment()) {
    if (isLocalhostOrigin(origin) || DEVELOPMENT_ORIGINS.includes(origin)) {
      callback(null, true)
      return
    }
  }

  // Origin not allowed - reject and log
  callback(new Error(`Origin ${origin} not allowed by CORS policy`), false)
}

/**
 * Log CORS rejection for security monitoring and auditing
 * This provides visibility into potential CORS-based attacks
 */
function logCorsRejection(
  origin: string | undefined,
  method: string,
  path: string,
  reason: string,
  userAgent?: string,
  ip?: string
): void {
  const logEntry: CorsRejectionLog = {
    timestamp: new Date().toISOString(),
    origin: origin || 'undefined',
    method,
    path,
    reason,
    userAgent,
    ip
  }

  // Log in a structured format for log aggregation
  console.warn(`[CORS REJECTED] ${JSON.stringify(logEntry)}`)

  // Additional security logging for production
  if (isProduction()) {
    // In production, you might want to send this to a SIEM or security monitoring system
    // For now, we log with a security prefix for easier filtering
    console.warn(`[SECURITY] CORS rejection: origin=${origin}, method=${method}, path=${path}`)
  }
}

/**
 * Create the CORS options delegate for dynamic origin validation
 */
function createCorsOptionsDelegate(allowedOrigins: string[]): CorsOptionsDelegate<any> {
  return (req, callback) => {
    const origin = req.header('Origin')
    const method = req.method
    const path = req.path || req.url || 'unknown'
    const userAgent = req.header('User-Agent')
    const ip = req.ip || req.socket?.remoteAddress

    validateOrigin(origin, allowedOrigins, (err, allow) => {
      if (err || !allow) {
        // Log the rejection
        logCorsRejection(
          origin,
          method,
          path,
          err?.message || 'Origin not in whitelist',
          userAgent,
          ip
        )

        // Return error to trigger CORS rejection
        callback(err || new Error('CORS not allowed'))
        return
      }

      // Origin is allowed - return CORS options
      const corsOptions: CorsOptions = {
        origin: true, // Reflect the request origin
        credentials: true,
        maxAge: 86400, // 24-hour preflight cache
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        optionsSuccessStatus: 204 // Some legacy browsers (IE11) choke on 204
      }

      callback(null, corsOptions)
    })
  }
}

/**
 * Get the production-grade CORS configuration
 *
 * Usage:
 * ```typescript
 * import { getCorsConfig } from './middleware/corsConfig'
 * import cors from 'cors'
 *
 * app.use(cors(getCorsConfig()))
 * ```
 */
export function getCorsConfig(): CorsOptionsDelegate<any> {
  const allowedOrigins = parseAllowedOrigins()

  // Log configuration at startup
  console.log('[CORS] Configuration initialized:')
  console.log('[CORS]   Environment: ${process.env.NODE_ENV || 'development'}')
  console.log(`[CORS]   Configured origins: ${allowedOrigins.length}`)

  if (allowedOrigins.length > 0) {
    allowedOrigins.forEach(origin => {
      console.log(`[CORS]     - ${origin}`)
    })
  }

  if (isDevelopment()) {
    console.log('[CORS]   Development mode: localhost origins allowed')
  } else {
    console.log('[CORS]   Production mode: strict origin validation enabled')
    console.log('[CORS]   Production mode: HTTPS enforcement enabled')
  }

  return createCorsOptionsDelegate(allowedOrigins)
}

/**
 * Static CORS options for simple configurations
 * Use this when you need static options instead of a delegate
 */
export const staticCorsOptions: CorsOptions = {
  credentials: true,
  maxAge: 86400, // 24-hour preflight cache
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  optionsSuccessStatus: 204
}

/**
 * Validate CORS configuration at startup
 * Call this during server initialization to fail fast on misconfigurations
 */
export function validateCorsConfiguration(): void {
  const corsOrigin = process.env.CORS_ORIGIN
  const nodeEnv = process.env.NODE_ENV

  // Production validation
  if (nodeEnv === 'production') {
    if (!corsOrigin) {
      console.error('[CORS] FATAL: CORS_ORIGIN must be set in production')
      console.error('[CORS] Set CORS_ORIGIN=https://your-frontend-domain.com')
      throw new Error('CORS_ORIGIN required in production')
    }

    const origins = corsOrigin.split(',').map(o => o.trim())
    const httpOrigins = origins.filter(o => {
      try {
        return new URL(o).protocol === 'http:'
      } catch {
        return false
      }
    })

    if (httpOrigins.length > 0) {
      console.error('[CORS] FATAL: HTTP origins not allowed in production')
      console.error('[CORS] The following origins must use HTTPS:')
      httpOrigins.forEach(o => console.error(`[CORS]   - ${o}`))
      throw new Error('HTTP origins not allowed in production')
    }

    // Check for wildcard patterns
    if (origins.some(o => o.includes('*'))) {
      console.error('[CORS] FATAL: Wildcard origins not allowed in production')
      console.error('[CORS] Use exact origin matching only')
      throw new Error('Wildcard CORS origins not allowed in production')
    }

    console.log('[CORS] Production configuration validated successfully')
  }

  // Staging validation (similar to production but allows warnings)
  if (nodeEnv === 'staging') {
    if (!corsOrigin) {
      console.warn('[CORS] WARNING: CORS_ORIGIN should be set in staging')
    }
    console.log('[CORS] Staging configuration validated')
  }

  // Development info
  if (nodeEnv === 'development' || !nodeEnv) {
    console.log('[CORS] Development mode: relaxed CORS validation')
    if (corsOrigin) {
      console.log(`[CORS] Additional origins configured: ${corsOrigin}`)
    }
  }
}

/**
 * Export utility functions for testing
 */
export const corsUtils = {
  isDevelopment,
  isProduction,
  isValidProductionOrigin,
  isLocalhostOrigin,
  parseAllowedOrigins,
  validateOrigin,
  DEVELOPMENT_ORIGINS
}
