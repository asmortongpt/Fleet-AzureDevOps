import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../config/database'
import { JWTPayload } from '../types'

// JWT Secret validation helper
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not configured')
  }
  if (secret.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters long')
  }
  return secret
}

// Startup check - verify JWT_SECRET is configured at module load time
try {
  getJwtSecret()
  console.log('✅ JWT_SECRET validation passed')
} catch (error) {
  console.error('❌ JWT_SECRET validation failed:', (error as Error).message)
  throw error
}

export interface AuthRequest extends Request {
  user?: JWTPayload
}

export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('🔒 AUTH MIDDLEWARE - CHECKING JWT TOKEN')
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    console.log('❌ AUTH MIDDLEWARE - No token provided')
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Enforce RBAC for ALL HTTP methods (GET, POST, PUT, DELETE)
    if (!roles.includes(req.user.role)) {
      console.log(`❌ AUTHORIZE - Access denied. User role: ${req.user.role}, Required: ${roles.join(', ')}`)
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      })
    }

    console.log(`✅ AUTHORIZE - Access granted. User: ${req.user.email}, Role: ${req.user.role}`)
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
    console.error('Account lock check error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
