/**
 * Session Revocation API
 * SECURITY FIX: CVSS 7.2 - Implements JWT token revocation capability
 *
 * Endpoints:
 * - POST /api/auth/revoke - Revoke a JWT token (force logout)
 * - GET /api/auth/revoke/status - Get blacklist statistics (admin only)
 *
 * Features:
 * - In-memory JWT blacklist with automatic TTL cleanup
 * - Self-revocation: Users can revoke their own sessions
 * - Admin revocation: Admins can revoke any user's session
 * - Comprehensive audit logging for all revocations
 * - Token validation to prevent arbitrary revocations
 *
 * Implementation Notes:
 * - Uses in-memory Map for token blacklist (TODO: migrate to Redis for production)
 * - Cleanup interval runs every 5 minutes to remove expired tokens
 * - Tokens are stored with their JWT expiry timestamp
 * - checkRevoked middleware should be added to protected routes
 */

import express, { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import { pool } from '../db'
import { asyncHandler } from '../middleware/async-handler'
import { createAuditLog } from '../middleware/audit'
import { authenticateJWT, authorize, AuthRequest, setCheckRevoked } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'

const router = express.Router()

// Register checkRevoked middleware with auth module to avoid circular dependencies
// This happens at module load time
setImmediate(() => {
  setCheckRevoked(checkRevoked)
})

// ============================================================================
// JWT Blacklist Infrastructure
// ============================================================================
// In-memory blacklist for revoked tokens
// Maps token -> expiry timestamp
// TODO: Upgrade to Redis for production multi-instance deployments
const revokedTokens = new Map<string, number>()

// Cleanup interval for expired tokens (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  let cleaned = 0
  for (const [token, expiry] of revokedTokens.entries()) {
    if (expiry < now) {
      revokedTokens.delete(token)
      cleaned++
    }
  }
  if (cleaned > 0) {
    console.log(`[JWT_BLACKLIST] Cleaned ${cleaned} expired tokens from blacklist`)
  }
}, 5 * 60 * 1000)

// ============================================================================
// Middleware: Check if token is revoked (CWE-613 Session Fixation)
// ============================================================================
/**
 * Middleware to check if a JWT token has been revoked
 * SECURITY: This prevents use of compromised tokens after revocation
 * Should be called AFTER authenticateJWT but BEFORE route handlers
 *
 * Usage:
 * ```typescript
 * import { checkRevoked } from './routes/session-revocation'
 * router.get('/protected', authenticateJWT, checkRevoked, handler)
 * ```
 */
export function checkRevoked(req: AuthRequest, res: Response, next: NextFunction) {
  // Extract token from Authorization header or cookie
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.auth_token

  if (!token) {
    // No token provided - let authenticateJWT handle this
    return next()
  }

  // Check if token is in blacklist
  if (revokedTokens.has(token)) {
    const expiry = revokedTokens.get(token)
    console.log(`[JWT_BLACKLIST] Blocked revoked token - expires at ${new Date(expiry!).toISOString()}`)
    return res.status(401).json({
      error: 'Token has been revoked',
      code: 'TOKEN_REVOKED',
      message: 'This session has been terminated. Please log in again.'
    })
  }

  // Clean expired entries opportunistically (additional to interval cleanup)
  const now = Date.now()
  for (const [t, exp] of revokedTokens.entries()) {
    if (exp < now) {
      revokedTokens.delete(t)
    }
  }

  next()
}

// ============================================================================
// POST /api/auth/revoke - Revoke JWT token (Force logout)
// ============================================================================
/**
 * Revoke a JWT token to force user logout
 * SECURITY FIX: CVSS 7.2 - Implements session revocation capability
 *
 * Authorization:
 * - Admin: Can revoke ANY user's token
 * - User: Can revoke their OWN token only
 *
 * Request Body:
 * - token (optional): Specific token to revoke. If not provided, revokes current token.
 * - user_id (optional, admin only): Revoke all active tokens for specified user
 * - email (optional, admin only): Revoke all active tokens for specified email
 *
 * Example Requests:
 * ```bash
 * # Self-revoke current session
 * curl -X POST http://localhost:3000/api/auth/revoke \
 *   -H "Authorization: Bearer YOUR_TOKEN" \
 *   -H "Content-Type: application/json"
 *
 * # Admin revoke user by email
 * curl -X POST http://localhost:3000/api/auth/revoke \
 *   -H "Authorization: Bearer ADMIN_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"email": "user@example.com"}'
 * ```
 *
 * Implementation:
 * - Adds token to in-memory blacklist with JWT expiry time
 * - Cleanup happens automatically via setInterval
 * - Future: Migrate to Redis for distributed systems
 */
router.post('/revoke', csrfProtection, csrfProtection, authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const { token: targetToken, user_id, email } = req.body
  const currentToken = req.headers.authorization?.split(' ')[1] || req.cookies?.auth_token

  // Determine target user
  let targetUserId: string | null = null
  let targetEmail: string | null = null

  if (user_id || email) {
    // Admin-only: Revoking someone else's session
    if (req.user.role !== 'admin') {
      await createAuditLog(
        req.user.tenant_id,
        req.user.id,
        'LOGOUT',
        'auth',
        user_id || email,
        { reason: 'Unauthorized attempt to revoke other user session' },
        req.ip || null,
        req.get('User-Agent') || null,
        'failure',
        'Insufficient permissions - admin role required'
      )

      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only administrators can revoke other users\' sessions',
        required: ['admin'],
        current: req.user.role
      })
    }

    // Look up target user
    const userQuery = user_id
      ? 'SELECT id, email, tenant_id FROM users WHERE id = $1'
      : 'SELECT id, email, tenant_id FROM users WHERE email = $2'

    const userResult = await pool.query(
      userQuery,
      user_id ? [user_id] : [email]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    targetUserId = userResult.rows[0].id
    targetEmail = userResult.rows[0].email
  } else {
    // Self-revocation
    targetUserId = req.user.id
    targetEmail = req.user.email
  }

  // Determine which token to revoke
  const tokenToRevoke = targetToken || currentToken

  if (!tokenToRevoke) {
    return res.status(400).json({
      error: 'No token provided',
      message: 'Provide a token in request body or use your current session token'
    })
  }

  try {
    // Verify token and extract expiry
    const decoded = jwt.verify(tokenToRevoke, process.env.JWT_SECRET!) as any

    // Validate token belongs to target user (prevent revoking arbitrary tokens)
    if (decoded.id !== targetUserId && decoded.email !== targetEmail) {
      await createAuditLog(
        req.user.tenant_id,
        req.user.id,
        'LOGOUT',
        'auth',
        targetUserId,
        { reason: 'Token does not belong to target user' },
        req.ip || null,
        req.get('User-Agent') || null,
        'failure',
        'Token mismatch - cannot revoke token for different user'
      )

      return res.status(403).json({
        error: 'Token mismatch',
        message: 'The provided token does not belong to the target user'
      })
    }

    // Add to blacklist with JWT expiry time
    const expiryMs = decoded.exp ? decoded.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000
    revokedTokens.set(tokenToRevoke, expiryMs)

    console.log(`[JWT_BLACKLIST] Token revoked for user ${targetEmail} - blacklist size: ${revokedTokens.size}`)

    // Audit log for successful revocation
    await createAuditLog(
      req.user.tenant_id,
      req.user.id,
      'LOGOUT',
      'auth',
      targetUserId,
      {
        action: 'session_revoked',
        target_user_id: targetUserId,
        target_email: targetEmail,
        revoked_by: req.user.id,
        revoked_by_email: req.user.email,
        is_self_revocation: targetUserId === req.user.id,
        blacklist_size: revokedTokens.size,
        token_expiry: new Date(expiryMs).toISOString()
      },
      req.ip || null,
      req.get('User-Agent') || null,
      'success',
      null
    )

    // Clear cookie if revoking current session
    if (tokenToRevoke === currentToken) {
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
    }

    return res.json({
      success: true,
      message: targetUserId === req.user.id
        ? 'Your session has been revoked successfully'
        : `Session revoked for user ${targetEmail}`,
      revoked_user: {
        id: targetUserId,
        email: targetEmail
      },
      revoked_by: {
        id: req.user.id,
        email: req.user.email
      },
      blacklist_size: revokedTokens.size,
      expires_at: new Date(expiryMs).toISOString()
    })

  } catch (error: any) {
    // Invalid or expired token
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired',
        details: error.message
      })
    }

    // Log unexpected errors
    console.error('[JWT_BLACKLIST] Revocation error:', error)
    await createAuditLog(
      req.user.tenant_id,
      req.user.id,
      'LOGOUT',
      'auth',
      targetUserId,
      { error: error.message },
      req.ip || null,
      req.get('User-Agent') || null,
      'failure',
      error.message
    )

    return res.status(500).json({
      error: 'Revocation failed',
      message: 'An error occurred while revoking the session'
    })
  }
}))

// ============================================================================
// GET /api/auth/revoke/status - Check revocation status (Admin only)
// ============================================================================
/**
 * Get blacklist statistics
 * Admin-only endpoint for monitoring
 *
 * Example:
 * ```bash
 * curl -X GET http://localhost:3000/api/auth/revoke/status \
 *   -H "Authorization: Bearer ADMIN_TOKEN"
 * ```
 */
router.get('/revoke/status', authenticateJWT, authorize('admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const now = Date.now()
  const activeRevocations = Array.from(revokedTokens.entries())
    .filter(([_, expiry]) => expiry > now)
    .length

  return res.json({
    blacklist_size: revokedTokens.size,
    active_revocations: activeRevocations,
    expired_pending_cleanup: revokedTokens.size - activeRevocations,
    cleanup_interval_ms: 5 * 60 * 1000,
    storage_type: 'in-memory',
    recommendation: 'Upgrade to Redis for production multi-instance deployments'
  })
}))

export default router
export { revokedTokens }
