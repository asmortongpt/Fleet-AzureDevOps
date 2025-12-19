/**
 * Azure AD JWT Validation Middleware
 *
 * Validates JWT tokens issued by Azure AD with MFA enforcement
 *
 * Features:
 * - Azure AD token signature verification
 * - MFA claim validation
 * - Token expiration checking
 * - Audience and issuer validation
 * - Rate limit integration
 * - Comprehensive logging
 *
 * Security Standards:
 * - OAuth 2.0 RFC 6749
 * - OpenID Connect Core 1.0
 * - JWT RFC 7519
 * - NIST SP 800-63B
 */

import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

import logger from '../utils/logger'

import { AuthRequest } from './auth'

// Azure AD Configuration
const AZURE_AD_TENANT_ID = process.env.AZURE_TENANT_ID || '0ec14b81-7b82-45ee-8f3d-cbc31ced5347'
const AZURE_AD_CLIENT_ID = process.env.AZURE_CLIENT_ID || 'baae0851-0c24-4214-8587-e3fabc46bd4a'
const AZURE_AD_ISSUER = `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/v2.0`
const AZURE_AD_JWKS_URI = `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/discovery/v2.0/keys`

// JWKS Client for retrieving Azure AD signing keys
const jwksClientInstance = jwksClient({
  jwksUri: AZURE_AD_JWKS_URI,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10
})

/**
 * Get signing key from Azure AD JWKS endpoint
 */
const getSigningKey = (kid: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwksClientInstance.getSigningKey(kid, (err, key) => {
      if (err) {
        logger.error('Failed to get signing key:', { error: err, kid })
        return reject(err)
      }

      const signingKey = key.getPublicKey()
      resolve(signingKey)
    })
  })
}

/**
 * Verify Azure AD JWT token
 *
 * @param token - JWT token from Authorization header
 * @returns Decoded token payload
 */
const verifyAzureAdToken = async (token: string): Promise<any> => {
  try {
    // Decode header to get kid (key ID)
    const decodedHeader = jwt.decode(token, { complete: true })
    if (!decodedHeader || !decodedHeader.header.kid) {
      throw new Error('Invalid token: missing kid')
    }

    const kid = decodedHeader.header.kid

    // Get signing key from Azure AD
    const signingKey = await getSigningKey(kid)

    // Verify token signature and claims
    const decoded = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      audience: AZURE_AD_CLIENT_ID,
      issuer: AZURE_AD_ISSUER,
    })

    return decoded
  } catch (error) {
    logger.error('Token verification failed:', { error })
    throw error
  }
}

/**
 * Validate MFA claim in token
 *
 * Checks if user authenticated with MFA (Multi-Factor Authentication)
 * Required for Fortune-5 enterprise security
 */
const validateMFA = (payload: any): boolean => {
  // Check AMR (Authentication Methods Reference) claim
  const amr = payload.amr || []

  // Valid MFA methods
  const mfaMethods = ['mfa', 'totp', 'sms', 'oath', 'rsa', 'ngcmfa']

  const mfaUsed = amr.some((method: string) =>
    mfaMethods.includes(method.toLowerCase())
  )

  if (!mfaUsed) {
    logger.warn('MFA not used for authentication', {
      userId: payload.oid || payload.sub,
      amr: amr
    })
  }

  return mfaUsed
}

/**
 * Extract user information from Azure AD token
 */
const extractUserInfo = (payload: any): {
  id: string
  email: string
  name: string
  roles: string[]
  tenantId: string
  mfaUsed: boolean
} => {
  return {
    id: payload.oid || payload.sub, // Object ID (unique user ID)
    email: payload.email || payload.preferred_username || payload.upn,
    name: payload.name || payload.given_name + ' ' + payload.family_name,
    roles: payload.roles || [],
    tenantId: payload.tid, // Tenant ID
    mfaUsed: validateMFA(payload)
  }
}

/**
 * Azure AD JWT Authentication Middleware
 *
 * Validates Azure AD tokens and attaches user information to request
 */
export const authenticateAzureAdJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  logger.info('🔒 AZURE AD AUTH - Validating token')

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('❌ AZURE AD AUTH - Missing or invalid authorization header')
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token with Azure AD
    const payload = await verifyAzureAdToken(token)

    // Extract user information
    const userInfo = extractUserInfo(payload)

    // SECURITY CHECK: Enforce MFA for production
    if (process.env.NODE_ENV === 'production' && !userInfo.mfaUsed) {
      logger.error('❌ AZURE AD AUTH - MFA not used (BLOCKED in production)', {
        userId: userInfo.id,
        email: userInfo.email
      })
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Multi-Factor Authentication required for access'
      })
    }

    // Attach user to request
    req.user = {
      id: userInfo.id,
      email: userInfo.email,
      role: userInfo.roles[0] || 'user', // Use first role or default
      tenant_id: userInfo.tenantId
    }

    logger.info('✅ AZURE AD AUTH - Token validated successfully', {
      userId: userInfo.id,
      email: userInfo.email,
      roles: userInfo.roles,
      mfaUsed: userInfo.mfaUsed
    })

    next()
  } catch (error: any) {
    logger.error('❌ AZURE AD AUTH - Validation failed:', { error: error.message })

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired'
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      })
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed'
    })
  }
}

/**
 * Optional Azure AD JWT Middleware
 *
 * Validates token if present, but doesn't require it
 * Useful for endpoints that have both public and authenticated access
 */
export const optionalAzureAdJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    return next()
  }

  // Token provided, validate it
  return authenticateAzureAdJWT(req, res, next)
}

/**
 * Check if token is about to expire (within 5 minutes)
 * Useful for proactive token refresh warnings
 */
export const checkTokenExpiry = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.substring(7)
  const decoded = jwt.decode(token) as any

  if (decoded && decoded.exp) {
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)
    if (expiresIn < 300) { // Less than 5 minutes
      logger.warn('Token expiring soon', {
        userId: decoded.oid || decoded.sub,
        expiresIn: expiresIn
      })
      // Add header to inform client to refresh token
      res.setHeader('X-Token-Expiring', 'true')
      res.setHeader('X-Token-Expires-In', expiresIn.toString())
    }
  }

  next()
}

export default authenticateAzureAdJWT
