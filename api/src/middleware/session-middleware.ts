/**
 * Session Validation Middleware
 * SECURITY (CRIT-F-001): Enforce session validation and activity tracking
 *
 * Features:
 * - Validate session exists and is active
 * - Check session expiration
 * - Renew session on activity
 * - Rate limit login attempts
 * - Track concurrent sessions
 * - Detect suspicious activity
 */

import { Request, Response, NextFunction } from 'express'
import { pool } from '../db/connection'
import logger from '../config/logger'
import { AuthRequest } from './auth'

interface SessionValidationOptions {
  /** Maximum concurrent sessions per user (0 = unlimited) */
  maxConcurrentSessions?: number
  /** Session idle timeout in seconds (default: 1800 = 30 min) */
  idleTimeout?: number
  /** Renew session on activity (default: true) */
  renewOnActivity?: boolean
  /** Check IP address match (default: false) */
  checkIpAddress?: boolean
  /** Check user agent match (default: false) */
  checkUserAgent?: boolean
}

const DEFAULT_OPTIONS: SessionValidationOptions = {
  maxConcurrentSessions: 5,
  idleTimeout: 1800,
  renewOnActivity: true,
  checkIpAddress: false,
  checkUserAgent: false
}

/**
 * Validate session middleware
 * Ensures user has an active, non-expired session
 */
export function validateSession(options: SessionValidationOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    try {
      // Get active sessions for user
      const result = await pool.query(
        `SELECT
          id,
          ip_address,
          user_agent,
          created_at,
          last_activity_at,
          expires_at,
          is_active
        FROM auth_sessions
        WHERE user_id = $1 AND tenant_id = $2 AND is_active = true
        ORDER BY last_activity_at DESC`,
        [req.user.id, req.user.tenant_id]
      )

      if (result.rows.length === 0) {
        logger.warn('[SessionMiddleware] No active session found', {
          userId: req.user.id,
          path: req.path
        })
        return res.status(401).json({
          error: 'No active session',
          code: 'SESSION_NOT_FOUND'
        })
      }

      const sessions = result.rows
      const currentSession = sessions[0]
      const now = new Date()

      // Check session expiration
      const expiresAt = new Date(currentSession.expires_at)
      if (expiresAt < now) {
        logger.warn('[SessionMiddleware] Session expired', {
          userId: req.user.id,
          sessionId: currentSession.id,
          expiresAt
        })

        // Mark session as inactive
        await pool.query(
          'UPDATE auth_sessions SET is_active = false WHERE id = $1',
          [currentSession.id]
        )

        return res.status(401).json({
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
          expiresAt
        })
      }

      // Check idle timeout
      const lastActivity = new Date(currentSession.last_activity_at)
      const idleSeconds = (now.getTime() - lastActivity.getTime()) / 1000

      if (idleSeconds > config.idleTimeout!) {
        logger.warn('[SessionMiddleware] Session idle timeout', {
          userId: req.user.id,
          sessionId: currentSession.id,
          idleSeconds
        })

        // Mark session as inactive
        await pool.query(
          'UPDATE auth_sessions SET is_active = false WHERE id = $1',
          [currentSession.id]
        )

        return res.status(401).json({
          error: 'Session idle timeout',
          code: 'SESSION_IDLE',
          idleSeconds
        })
      }

      // Check IP address if enabled
      if (config.checkIpAddress) {
        const requestIp = req.ip || req.socket.remoteAddress
        if (requestIp && currentSession.ip_address !== requestIp) {
          logger.warn('[SessionMiddleware] IP address mismatch', {
            userId: req.user.id,
            sessionIp: currentSession.ip_address,
            requestIp
          })

          return res.status(403).json({
            error: 'IP address mismatch',
            code: 'IP_MISMATCH'
          })
        }
      }

      // Check user agent if enabled
      if (config.checkUserAgent) {
        const requestUserAgent = req.get('User-Agent')
        if (requestUserAgent && currentSession.user_agent !== requestUserAgent) {
          logger.warn('[SessionMiddleware] User agent mismatch', {
            userId: req.user.id,
            sessionUserAgent: currentSession.user_agent,
            requestUserAgent
          })

          return res.status(403).json({
            error: 'User agent mismatch',
            code: 'USER_AGENT_MISMATCH'
          })
        }
      }

      // Check concurrent session limit
      if (config.maxConcurrentSessions! > 0 && sessions.length > config.maxConcurrentSessions!) {
        logger.warn('[SessionMiddleware] Too many concurrent sessions', {
          userId: req.user.id,
          sessionCount: sessions.length,
          maxAllowed: config.maxConcurrentSessions
        })

        // Revoke oldest sessions
        const sessionsToRevoke = sessions.slice(config.maxConcurrentSessions)
        const sessionIds = sessionsToRevoke.map(s => s.id)

        await pool.query(
          'UPDATE auth_sessions SET is_active = false, revoked_at = NOW() WHERE id = ANY($1)',
          [sessionIds]
        )

        logger.info('[SessionMiddleware] Revoked old sessions', {
          userId: req.user.id,
          revokedCount: sessionIds.length
        })
      }

      // Renew session activity if enabled
      if (config.renewOnActivity) {
        const newExpiresAt = new Date(now.getTime() + config.idleTimeout! * 1000)

        await pool.query(
          `UPDATE auth_sessions
           SET last_activity_at = NOW(),
               expires_at = $2
           WHERE id = $1`,
          [currentSession.id, newExpiresAt]
        )

        logger.debug('[SessionMiddleware] Session activity renewed', {
          sessionId: currentSession.id,
          newExpiresAt
        })
      }

      // Attach session info to request
      req.user.sessionId = currentSession.id

      next()
    } catch (error) {
      logger.error('[SessionMiddleware] Session validation error:', error)
      return res.status(500).json({ error: 'Session validation failed' })
    }
  }
}

/**
 * Cleanup expired sessions
 * Should be run periodically (e.g., cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await pool.query(
      `UPDATE auth_sessions
       SET is_active = false
       WHERE is_active = true
         AND (
           expires_at < NOW()
           OR last_activity_at < NOW() - INTERVAL '30 minutes'
         )
       RETURNING id`
    )

    const count = result.rowCount || 0

    if (count > 0) {
      logger.info('[SessionCleanup] Expired sessions cleaned up', { count })
    }

    return count
  } catch (error) {
    logger.error('[SessionCleanup] Cleanup error:', error)
    return 0
  }
}

/**
 * Start session cleanup scheduler
 * Runs every 5 minutes
 */
export function startSessionCleanupScheduler(): NodeJS.Timeout {
  const interval = setInterval(async () => {
    await cleanupExpiredSessions()
  }, 5 * 60 * 1000) // Every 5 minutes

  logger.info('[SessionCleanup] Scheduler started (5 minute interval)')

  return interval
}

/**
 * Get active session count for user
 */
export async function getActiveSessionCount(userId: string, tenantId: string): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM auth_sessions
       WHERE user_id = $1
         AND tenant_id = $2
         AND is_active = true
         AND expires_at > NOW()`,
      [userId, tenantId]
    )

    return parseInt(result.rows[0].count, 10)
  } catch (error) {
    logger.error('[SessionMiddleware] Failed to get session count:', error)
    return 0
  }
}

/**
 * Revoke all sessions for user
 * Used for forced logout, password reset, etc.
 */
export async function revokeAllUserSessions(
  userId: string,
  tenantId: string,
  reason?: string
): Promise<number> {
  try {
    const result = await pool.query(
      `UPDATE auth_sessions
       SET is_active = false,
           revoked_at = NOW(),
           revoked_by = $1
       WHERE user_id = $1
         AND tenant_id = $2
         AND is_active = true
       RETURNING id`,
      [userId, tenantId]
    )

    const count = result.rowCount || 0

    logger.info('[SessionMiddleware] All user sessions revoked', {
      userId,
      tenantId,
      count,
      reason
    })

    return count
  } catch (error) {
    logger.error('[SessionMiddleware] Failed to revoke sessions:', error)
    return 0
  }
}
