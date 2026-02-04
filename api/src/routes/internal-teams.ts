import { Router, Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

router.use(authenticateJWT)

router.get(
  '/',
  requirePermission('user:view:global'),
  auditLog({ action: 'READ', resourceType: 'internal_teams' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id

      const result = await pool.query(
        `
        SELECT
          t.id,
          t.name,
          t.description,
          t.team_type,
          t.location,
          t.shift_start,
          t.shift_end,
          t.timezone,
          t.is_active,
          u.first_name || ' ' || u.last_name AS team_lead_name,
          COUNT(tm.id) FILTER (WHERE tm.is_active = true) AS member_count
        FROM teams t
        LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.is_active = true
        LEFT JOIN users u ON u.id = t.team_lead_id
        WHERE t.tenant_id = $1 AND t.is_active = true
        GROUP BY t.id, u.first_name, u.last_name
        ORDER BY t.name
        `,
        [tenantId]
      )

      res.json({
        data: result.rows,
        total: result.rows.length
      })
    } catch (error) {
      logger.error('Error fetching internal teams:', error)
      res.status(500).json({ error: 'Failed to fetch teams' })
    }
  }
)

export default router
