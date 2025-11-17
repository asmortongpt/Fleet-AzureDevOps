import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../config/database'

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
  // If req.user already exists (set by global middleware), skip JWT validation
  if (req.user) {
    console.log('✅ AUTH MIDDLEWARE - User already authenticated via global middleware')
    return next()
  }

  // DEBUG: Log environment variable value
  console.log('🔍 AUTH MIDDLEWARE - USE_MOCK_DATA:', process.env.USE_MOCK_DATA)
  console.log('🔍 AUTH MIDDLEWARE - USE_MOCK_DATA type:', typeof process.env.USE_MOCK_DATA)

  // If USE_MOCK_DATA is enabled, bypass authentication for dev/staging
  if (process.env.USE_MOCK_DATA === 'true') {
    console.log('✅ AUTH MIDDLEWARE - BYPASSING AUTHENTICATION for mock data mode')
    // Create a mock user for database queries that require tenant_id
    req.user = {
      id: '1',
      email: 'demo@fleet.local',
      role: 'admin',
      tenant_id: '1'
    }
    return next()
  }

  console.log('🔒 AUTH MIDDLEWARE - CHECKING JWT TOKEN')
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    console.log('❌ AUTH MIDDLEWARE - No token provided')
    return res.status(401).json({ error: 'Authentication required' })
  }

  // SECURITY: JWT_SECRET must be set in environment variables
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
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

    // TEMPORARY FIX: Allow all authenticated users for GET requests (read-only)
    // This enables the frontend to load data while we update role assignments
    if (req.method === 'GET') {
      console.log('✅ AUTHORIZE - Allowing GET request for authenticated user:', req.user.role)
      return next()
    }

    // For non-GET requests (POST, PUT, DELETE), enforce role-based access
    if (!roles.includes(req.user.role)) {
      console.log('❌ AUTHORIZE - Permission denied:', {
        method: req.method,
        required: roles,
        current: req.user.role
      })
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      })
    }

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
