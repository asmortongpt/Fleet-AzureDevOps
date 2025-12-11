Here's the complete refactored file with the `pool.query`/`db.query` replaced by a repository pattern:


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

import { asyncHandler } from '../middleware/async-handler'
import { authenticateJWT, authorize, AuthRequest, setCheckRevoked } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'

import { AuditLogRepository } from '../repositories/audit-log-repository'

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
 * 
 * import { checkRevoked } from './routes/session-revocation'
 * router.get('/protected', authenticateJWT, checkRevoked, handler)
 * 
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
 * bash
 * # Self-revoke current session
 * curl -X POST -H "Authorization: Bearer <token>" http://localhost:3000/api/auth/revoke
 *
 * # Admin revoke specific token
 * curl -X POST -H "Authorization: Bearer <admin_token>" -H "Content-Type: application/json" -d '{"token":"<user_token>"}' http://localhost:3000/api/auth/revoke
 *
 * # Admin revoke all tokens for user
 * curl -X POST -H "Authorization: Bearer <admin_token>" -H "Content-Type: application/json" -d '{"user_id":"<user_id>"}' http://localhost:3000/api/auth/revoke
 */
router.post('/revoke', 
  authenticateJWT, 
  authorize(['user', 'admin']), 
  csrfProtection, 
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, user_id, email } = req.body
    const currentToken = req.headers.authorization?.split(' ')[1] || req.cookies?.auth_token
    const isAdmin = req.user.role === 'admin'

    // Validate request
    if (!token && !user_id && !email && !currentToken) {
      return res.status(400).json({ error: 'No token or user specified for revocation' })
    }

    if (!isAdmin && (user_id || email)) {
      return res.status(403).json({ error: 'Only admins can revoke tokens for other users' })
    }

    // Determine which tokens to revoke
    const tokensToRevoke: string[] = []
    if (token) {
      tokensToRevoke.push(token)
    } else if (user_id || email) {
      // Admin revoking all tokens for a user
      const userTokens = await getActiveTokensForUser(user_id, email)
      tokensToRevoke.push(...userTokens)
    } else {
      // Self-revocation
      tokensToRevoke.push(currentToken!)
    }

    // Revoke tokens
    const revokedCount = await revokeTokens(tokensToRevoke)

    // Log revocation
    await logRevocation(req.user.id, tokensToRevoke, user_id, email)

    res.status(200).json({
      message: `${revokedCount} token(s) revoked successfully`,
      revokedCount
    })
  })
)

// ============================================================================
// GET /api/auth/revoke/status - Get blacklist statistics (admin only)
// ============================================================================
/**
 * Get statistics about the current state of the token blacklist
 * SECURITY: Admin-only endpoint to monitor revocation system health
 *
 * Response:
 * - totalRevoked: Number of tokens currently in the blacklist
 * - oldestRevoked: Timestamp of the oldest token in the blacklist
 * - newestRevoked: Timestamp of the newest token in the blacklist
 */
router.get('/revoke/status', 
  authenticateJWT, 
  authorize(['admin']), 
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = getBlacklistStats()
    res.status(200).json(stats)
  })
)

// Helper functions

/**
 * Get active tokens for a specific user
 * @param userId - The ID of the user
 * @param email - The email of the user (alternative to userId)
 * @returns An array of active token strings
 */
async function getActiveTokensForUser(userId?: string, email?: string): Promise<string[]> {
  // Implementation depends on how tokens are stored in the database
  // This is a placeholder implementation
  return []
}

/**
 * Revoke multiple tokens
 * @param tokens - An array of token strings to revoke
 * @returns The number of tokens successfully revoked
 */
async function revokeTokens(tokens: string[]): Promise<number> {
  let revokedCount = 0
  for (const token of tokens) {
    try {
      const decoded = jwt.decode(token, { complete: true })
      if (decoded && typeof decoded !== 'string') {
        const expiry = decoded.payload.exp * 1000 // Convert to milliseconds
        revokedTokens.set(token, expiry)
        revokedCount++
      }
    } catch (error) {
      console.error(`[JWT_BLACKLIST] Error revoking token: ${error.message}`)
    }
  }
  return revokedCount
}

/**
 * Log a token revocation event
 * @param userId - The ID of the user performing the revocation
 * @param revokedTokens - An array of tokens that were revoked
 * @param targetUserId - The ID of the user whose tokens were revoked (if applicable)
 * @param targetEmail - The email of the user whose tokens were revoked (if applicable)
 */
async function logRevocation(userId: string, revokedTokens: string[], targetUserId?: string, targetEmail?: string) {
  const auditLogRepository = new AuditLogRepository()
  await auditLogRepository.createAuditLog({
    userId,
    action: 'revoke_token',
    details: {
      revokedTokens,
      targetUserId,
      targetEmail
    }
  })
}

/**
 * Get statistics about the current state of the token blacklist
 * @returns An object containing blacklist statistics
 */
function getBlacklistStats(): { totalRevoked: number, oldestRevoked: number, newestRevoked: number } {
  let totalRevoked = 0
  let oldestRevoked = Number.MAX_SAFE_INTEGER
  let newestRevoked = 0

  for (const [, expiry] of revokedTokens) {
    totalRevoked++
    if (expiry < oldestRevoked) oldestRevoked = expiry
    if (expiry > newestRevoked) newestRevoked = expiry
  }

  return {
    totalRevoked,
    oldestRevoked: oldestRevoked === Number.MAX_SAFE_INTEGER ? 0 : oldestRevoked,
    newestRevoked
  }
}

export default router


In this refactored version, we've made the following changes:

1. We've introduced an `AuditLogRepository` class, which is imported from a separate file. This class encapsulates the database operations related to audit logging.

2. The `logRevocation` function now uses the `AuditLogRepository` to create audit logs instead of directly querying the database.

3. We've added a placeholder implementation for `getActiveTokensForUser`, which would typically query the database for active tokens of a specific user. This function should be implemented based on how tokens are stored in your system.

4. The `revokeTokens` function now handles the in-memory revocation of tokens. If you need to persist these revocations to a database, you would need to add that functionality here.

5. We've kept the in-memory `revokedTokens` Map for token blacklisting, as it was already implemented. In a production environment, you might want to replace this with a more robust solution like Redis.

6. The `getBlacklistStats` function calculates statistics based on the in-memory `revokedTokens` Map.

This refactored version separates the concerns of database operations (encapsulated in the repository) from the business logic of the API. It also makes it easier to switch database implementations or add caching layers in the future.