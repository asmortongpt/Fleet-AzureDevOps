import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// Shared handler for fetching security events
const getSecurityEvents = [
  requirePermission('security:view:global'),
  auditLog({ action: 'READ', resourceType: 'security_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { limit = 50 } = req.query

      const result = await pool.query(
        `SELECT id, tenant_id, event_type, severity, message, metadata, created_at
         FROM security_events
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [req.user!.tenant_id, limit]
      )

      res.json({ data: result.rows })
    } catch (error) {
      logger.error('Get security events error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
]

// GET / — handles /api/security-events
router.get('/', ...getSecurityEvents)

// GET /events — handles /api/security/events and /api/security-events/events
router.get('/events', ...getSecurityEvents)

export default router
