import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PoolClient } from 'pg'

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
    // Session management
    sessionId?: string
    // Aliases for compatibility
    userId?: string
    tenantId?: string
    name?: string
    org_id?: string
  }
  dbClient?: PoolClient
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
    return res.status(401).json({
      error: 'Authentication required',
      errorCode: 'NO_TOKEN'
    })
  }

  // SECURITY: All auth must use FIPS-compliant RS256 verification
  // Try to validate token using both local and Azure AD methods
  try {
    logger.info('🔑 AUTH MIDDLEWARE - Attempting token validation')

    // First, try to decode token to identify its type
    const { FIPSJWTService } = await import('../services/fips-jwt.service')
    const decoded = FIPSJWTService.decode(token)

    // Check if token is from Azure AD (has 'tid' claim) or local (has 'type' claim)
    const isAzureADToken = decoded && decoded.tid && !decoded.type
    const isLocalToken = decoded && decoded.type === 'access'

    let validatedUser: any = null

    if (isAzureADToken) {
      // Azure AD token validation
      logger.info('🔵 AUTH MIDDLEWARE - Detected Azure AD token, validating...')
      const { default: AzureADTokenValidator } = await import('../services/azure-ad-token-validator')
      const { default: jwtConfig } = await import('../config/jwt-config')

      const validationResult = await AzureADTokenValidator.validateToken(token, {
        tenantId: jwtConfig.azureAD.tenantId,
        audience: jwtConfig.azureAD.clientId,
        allowedAlgorithms: jwtConfig.azureAD.allowedAlgorithms
      })

      if (!validationResult.valid) {
        logger.error('❌ AUTH MIDDLEWARE - Azure AD token validation failed:', {
          error: validationResult.error,
          errorCode: validationResult.errorCode
        })
        return res.status(403).json({
          error: validationResult.error || 'Invalid Azure AD token',
          errorCode: validationResult.errorCode || 'AZURE_AD_VALIDATION_FAILED'
        })
      }

      // Extract user info from Azure AD token
      const userInfo = AzureADTokenValidator.extractUserInfo(validationResult.payload!)

      // Map Azure AD user to our user object format
      validatedUser = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        role: 'viewer', // Default role for Azure AD users
        tenant_id: userInfo.tenantId,
        // Add compatibility aliases
        userId: userInfo.id,
        tenantId: userInfo.tenantId,
        azureAD: true // Flag to indicate this is an Azure AD user
      }

      logger.info('✅ AUTH MIDDLEWARE - Azure AD token validated successfully', {
        userId: userInfo.id,
        email: userInfo.email
      })
    } else if (isLocalToken) {
      // Local Fleet token validation
      logger.info('🟢 AUTH MIDDLEWARE - Detected local Fleet token, validating...')
      validatedUser = FIPSJWTService.verifyAccessToken(token)
      logger.info('✅ AUTH MIDDLEWARE - Local JWT token validated successfully via FIPS Service')
    } else {
      // Unknown token format
      logger.error('❌ AUTH MIDDLEWARE - Unknown token format', {
        hasType: !!decoded?.type,
        hasTid: !!decoded?.tid,
        hasIss: !!decoded?.iss
      })
      return res.status(403).json({
        error: 'Unknown token format',
        errorCode: 'INVALID_TOKEN_FORMAT'
      })
    }

    // Set user on request
    req.user = validatedUser

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
    logger.error('❌ AUTH MIDDLEWARE - Token validation error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })

    // Map error to specific error codes
    let errorCode = 'VALIDATION_FAILED'
    let statusCode = 403

    if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED'
      statusCode = 401
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_TOKEN'
    } else if (error.name === 'NotBeforeError') {
      errorCode = 'TOKEN_NOT_ACTIVE'
    }

    return res.status(statusCode).json({
      error: 'Invalid or expired token',
      message: error.message,
      errorCode
    })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (req.user.role === 'SuperAdmin') {
      return next()
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
