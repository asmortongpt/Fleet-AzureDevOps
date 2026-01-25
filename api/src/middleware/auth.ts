import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import pool from '../config/database'
import logger from '../config/logger'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role?: string
    tenant_id?: string
    scope_level?: string
    team_driver_ids?: string[]
    // Aliases for compatibility
    userId?: string
    tenantId?: string
    name?: string
    org_id?: string
  }
}

// Import checkRevoked from session-revocation module
// This will be available after the module is loaded
let checkRevokedFn: ((req: AuthRequest, res: Response, next: NextFunction) => void) | null = null

/**
 * Set the checkRevoked function from session-revocation module
 * This is called during application initialization to avoid circular dependencies
 */
export function setCheckRevoked(fn: (req: AuthRequest, res: Response, next: NextFunction) => void) {
  checkRevokedFn = fn
  logger.info('✅ Session revocation middleware registered')
}

export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // If req.user already exists (set by development-only global middleware with strict
  // environment validation), skip JWT validation
  if (req.user) {
    logger.info('✅ AUTH MIDDLEWARE - User already authenticated via development mode')
    return next()
  }

  logger.info('🔒 AUTH MIDDLEWARE - CHECKING JWT TOKEN')
  // Check Authorization header first, then fall back to cookie
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.auth_token

  if (!token) {
    logger.info('❌ AUTH MIDDLEWARE - No token provided (checked header and cookie)')
    return res.status(401).json({ error: 'Authentication required' })
  }

  // SECURITY: All auth must use FIPS-compliant RS256 verification
  try {
    const { FIPSJWTService } = await import('../services/fips-jwt.service')
    const decoded = FIPSJWTService.verifyAccessToken(token)
    req.user = decoded
    logger.info('✅ AUTH MIDDLEWARE - JWT token validated successfully via FIPS Service')

    // SECURITY FIX: Check if token has been revoked (CVSS 7.2)
    // Call checkRevoked if it has been registered
    if (checkRevokedFn) {
      return (checkRevokedFn as any)(req, res, next)
    } else {
      // Fallback if revocation middleware not loaded yet
      logger.warn('⚠️ Session revocation middleware not registered - skipping revocation check')
      return next()
    }
  } catch (error: any) {
    logger.error('❌ AUTH MIDDLEWARE - Invalid or expired token:', error.message)
    return res.status(403).json({ error: 'Invalid or expired token', message: error.message })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // SECURITY FIX: Enforce RBAC for ALL HTTP methods (CWE-862)
    // Previously, GET requests bypassed authorization checks, allowing any authenticated
    // user to read sensitive data regardless of their role/permissions.
    //
    // This violated the principle of least privilege and could expose:
    // - Confidential fleet data
    // - Personal driver information
    // - Financial records
    // - Maintenance schedules
    // - Location data
    //
    // Now ALL requests (including GET) must have the proper role authorization
    if (!req.user.role || !roles.includes(req.user.role)) {
      logger.warn('AUTHORIZE - Permission denied', {
        method: req.method,
        path: req.path,
        required: roles,
        current: req.user.role
      })
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      })
    }

    logger.info('AUTHORIZE - Access granted', {
      method: req.method,
      path: req.path,
      role: req.user.role
    })

    return next()
  }
}

// Check if user account is locked (FedRAMP AC-7)
export const checkAccountLock = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next()
  }

  try {
    const result = await pool.query(
      'SELECT account_locked_until FROM users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const lockedUntil = result.rows[0].account_locked_until
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      return res.status(423).json({
        error: 'Account locked due to multiple failed login attempts',
        locked_until: lockedUntil
      })
    }

    return next()
  } catch (error) {
    logger.error('Account lock check error:', { error: error })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Export alias for backwards compatibility with routes importing from jwt.middleware
export const checkJwt = authenticateJWT
