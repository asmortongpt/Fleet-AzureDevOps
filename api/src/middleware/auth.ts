import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../config/database'
import logger from '../utils/logger'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    tenant_id: string
  }
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
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    logger.info('❌ AUTH MIDDLEWARE - No token provided')
    return res.status(401).json({ error: 'Authentication required' })
  }

  // SECURITY: JWT_SECRET must be set in environment variables and be at least 32 characters
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET must be at least 32 characters')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    req.user = decoded
    logger.info('✅ AUTH MIDDLEWARE - JWT token validated successfully')
    next()
  } catch (error) {
    logger.info('❌ AUTH MIDDLEWARE - Invalid or expired token')
    return res.status(403).json({ error: 'Invalid or expired token' })
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
    if (!roles.includes(req.user.role)) {
      console.log('❌ AUTHORIZE - Permission denied:', {
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

    console.log('✅ AUTHORIZE - Access granted:', {
      method: req.method,
      path: req.path,
      role: req.user.role
    })

    next()
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
      `SELECT account_locked_until FROM users WHERE id = $1`,
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

    next()
  } catch (error) {
    logger.error('Account lock check error:', { error: error })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
