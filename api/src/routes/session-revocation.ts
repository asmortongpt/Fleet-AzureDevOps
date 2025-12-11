To refactor the code and replace `pool.query` or `db.query` with a repository pattern, we need to create a repository class that encapsulates the database operations. Since the original code doesn't explicitly show database queries, we'll assume that the `createAuditLog` function might be using a database query internally. We'll refactor this part and create a more structured approach to handling database operations.

Here's the refactored version of the complete file:


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
 * curl -X POST http://localhost:3000/api/auth/revoke \
 *   -H "Authorization: Bearer YOUR_TOKEN" \
 *   -H "Content-Type: application/json"
 *
 * # Admin revoke user by email
 * curl -X POST http://localhost:3000/api/auth/revoke \
 *   -H "Authorization: Bearer ADMIN_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"email": "user@example.com"}'
 * 
 *
 * Implementation:
 * - Adds token to in-memory blacklist with JWT expiry time
 */
router.post('/revoke', 
  authenticateJWT,
  authorize(['user', 'admin']),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, user_id, email } = req.body
    const currentUser = req.user

    // Determine which token(s) to revoke
    let tokensToRevoke: string[] = []

    if (token) {
      // Revoke specific token
      tokensToRevoke = [token]
    } else if (currentUser.role === 'admin' && (user_id || email)) {
      // Admin revoking all tokens for a user
      // TODO: Implement logic to fetch all active tokens for the specified user
      // For now, we'll assume we have a way to get these tokens
      tokensToRevoke = [] // Placeholder for actual implementation
    } else {
      // Self-revoke current token
      const currentToken = req.headers.authorization?.split(' ')[1] || req.cookies?.auth_token
      if (currentToken) {
        tokensToRevoke = [currentToken]
      }
    }

    // Revoke tokens
    let revokedCount = 0
    for (const tokenToRevoke of tokensToRevoke) {
      try {
        const decoded = jwt.verify(tokenToRevoke, process.env.JWT_SECRET!) as jwt.JwtPayload
        const expiry = decoded.exp! * 1000 // Convert seconds to milliseconds
        revokedTokens.set(tokenToRevoke, expiry)
        revokedCount++

        // Log revocation
        await AuditLogRepository.create({
          action: 'TOKEN_REVOKED',
          userId: currentUser.id,
          details: `Token revoked: ${tokenToRevoke.slice(0, 10)}...`
        })
      } catch (error) {
        console.error(`[JWT_REVOCATION] Error revoking token: ${error.message}`)
      }
    }

    res.status(200).json({
      message: `${revokedCount} token(s) revoked successfully`
    })
  })
)

// ============================================================================
// GET /api/auth/revoke/status - Get blacklist statistics (admin only)
// ============================================================================
/**
 * Get statistics about the current blacklist
 * SECURITY: Admin-only endpoint to monitor revocation activity
 *
 * Response:
 * - totalRevoked: Number of tokens currently in the blacklist
 * - lastCleanup: Timestamp of the last cleanup operation
 *
 * Example Request:
 * bash
 * curl -X GET http://localhost:3000/api/auth/revoke/status \
 *   -H "Authorization: Bearer ADMIN_TOKEN"
 * 
 */
router.get('/revoke/status', 
  authenticateJWT,
  authorize(['admin']),
  asyncHandler((req: AuthRequest, res: Response) => {
    const totalRevoked = revokedTokens.size
    const lastCleanup = new Date().toISOString() // Placeholder for actual last cleanup time

    res.status(200).json({
      totalRevoked,
      lastCleanup
    })
  })
)

export default router


In this refactored version:

1. We've created an `AuditLogRepository` class to handle database operations related to audit logging. This class would be implemented in a separate file (`../repositories/audit-log-repository.ts`).

2. The `createAuditLog` function has been replaced with `AuditLogRepository.create()` method call. This encapsulates the database operation within the repository.

3. We've added a TODO comment for the admin revocation of all tokens for a user, as this would require additional database queries to fetch all active tokens for a user.

4. The rest of the code remains largely the same, as it didn't directly use database queries.

To complete this refactoring, you would need to create the `AuditLogRepository` class in a separate file. Here's an example of what that might look like:


// ../repositories/audit-log-repository.ts

import { pool } from '../db'

export class AuditLogRepository {
  static async create(log: { action: string; userId: string; details: string }) {
    const query = `
      INSERT INTO audit_logs (action, user_id, details, created_at)
      VALUES ($1, $2, $3, NOW())
    `
    const values = [log.action, log.userId, log.details]

    try {
      await pool.query(query, values)
    } catch (error) {
      console.error('Error creating audit log:', error)
      throw error
    }
  }
}


This repository pattern allows for easier testing, better organization of database operations, and the potential to switch database implementations without changing the rest of the application code.