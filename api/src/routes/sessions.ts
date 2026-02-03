/**
 * Session Management API
 * SECURITY (CRIT-F-001): Comprehensive session tracking and management
 *
 * Endpoints:
 * - POST /sessions - Create new session
 * - GET /sessions - List all sessions (admin)
 * - GET /sessions/current - Get current session info
 * - DELETE /sessions/:id - Revoke session
 * - DELETE /sessions/current - End current session (logout)
 *
 * Features:
 * - Session activity tracking
 * - Device fingerprinting
 * - Session expiration
 * - Rate limiting login attempts
 * - Comprehensive audit logging
 */

import express, { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()

// POST /sessions - Create new session (called during login)
router.post(
  '/',
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId, tenantId, deviceType, expiresIn = 1800 } = req.body

      if (!userId || !tenantId) {
        return res.status(400).json({ error: 'userId and tenantId required' })
      }

      const sessionId = uuidv4()
      const ipAddress = req.ip || req.socket.remoteAddress || null
      const userAgent = req.get('User-Agent') || null
      const expiresAt = new Date(Date.now() + expiresIn * 1000)

      // Create session record
      const result = await pool.query(
        `INSERT INTO auth_sessions (
          id, user_id, tenant_id, device_type, ip_address, user_agent,
          created_at, last_activity_at, expires_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, true)
        RETURNING id, created_at, last_activity_at, expires_at`,
        [sessionId, userId, tenantId, deviceType || 'web', ipAddress, userAgent, expiresAt]
      )

      logger.info('[Sessions] New session created', {
        sessionId,
        userId,
        tenantId,
        ipAddress
      })

      res.json({
        success: true,
        session: {
          id: result.rows[0].id,
          createdAt: result.rows[0].created_at,
          lastActivity: result.rows[0].last_activity_at,
          expiresAt: result.rows[0].expires_at
        }
      })
    } catch (error) {
      logger.error('[Sessions] Create session error:', error)
      res.status(500).json({ error: 'Failed to create session' })
    }
  }
)

// GET /sessions/current - Get current session info
router.get(
  '/current',
  authenticateJWT,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const result = await pool.query(
        `SELECT
          s.id,
          s.device_type,
          s.ip_address,
          s.user_agent,
          s.created_at,
          s.last_activity_at,
          s.expires_at,
          s.is_active
        FROM auth_sessions s
        WHERE s.user_id = $1 AND s.tenant_id = $2 AND s.is_active = true
        ORDER BY s.last_activity_at DESC
        LIMIT 1`,
        [req.user.id, req.user.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No active session found' })
      }

      const session = result.rows[0]
      const now = Date.now()
      const expiresAt = new Date(session.expires_at).getTime()

      res.json({
        session: {
          id: session.id,
          deviceType: session.device_type,
          ipAddress: session.ip_address,
          userAgent: session.user_agent || '',
          createdAt: session.created_at,
          lastActivity: session.last_activity_at,
          expiresAt: session.expires_at,
          status: expiresAt > now ? 'active' : 'expired',
          timeRemaining: Math.max(0, Math.floor((expiresAt - now) / 1000))
        }
      })
    } catch (error) {
      logger.error('[Sessions] Get current session error:', error)
      res.status(500).json({ error: 'Failed to get session' })
    }
  }
)

// DELETE /sessions/current - End current session (logout)
router.delete(
  '/current',
  authenticateJWT,
  csrfProtection,
  auditLog({ action: 'DELETE', resourceType: 'auth_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      // Mark all user sessions as inactive
      await pool.query(
        `UPDATE auth_sessions
         SET is_active = false,
             revoked_at = NOW(),
             revoked_by = $2
         WHERE user_id = $1 AND tenant_id = $3 AND is_active = true`,
        [req.user.id, req.user.id, req.user.tenant_id]
      )

      logger.info('[Sessions] User sessions ended', {
        userId: req.user.id,
        tenantId: req.user.tenant_id
      })

      res.json({ success: true, message: 'Session ended successfully' })
    } catch (error) {
      logger.error('[Sessions] End session error:', error)
      res.status(500).json({ error: 'Failed to end session' })
    }
  }
)

// GET /sessions - list auth sessions (admin only)
router.get(
  '/',
  authenticateJWT,
  requirePermission('session:view:global'),
  auditLog({ action: 'READ', resourceType: 'auth_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 100 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT
          s.id,
          s.user_id,
          s.device_type,
          s.ip_address,
          s.user_agent,
          s.created_at,
          s.last_activity_at,
          s.expires_at,
          s.is_active,
          u.first_name,
          u.last_name
         FROM auth_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.tenant_id = $1
         ORDER BY s.last_activity_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM auth_sessions WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      const now = Date.now()
      const data = result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        userName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
        startTime: row.created_at,
        lastActivity: row.last_activity_at,
        ipAddress: row.ip_address,
        userAgent: row.user_agent || '',
        status: row.is_active && new Date(row.expires_at).getTime() > now ? 'active' : 'expired',
      }))

      res.json({
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit)),
        },
      })
    } catch (error) {
      logger.error('Get sessions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /sessions/:id - revoke session
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('session:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'auth_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE auth_sessions
         SET is_active = false,
             revoked_at = NOW(),
             revoked_by = $3
         WHERE id = $1 AND tenant_id = $2
         RETURNING id`,
        [req.params.id, req.user!.tenant_id, req.user!.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' })
      }

      res.json({ success: true })
    } catch (error) {
      logger.error('Revoke session error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
