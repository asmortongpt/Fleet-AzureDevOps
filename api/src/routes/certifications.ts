import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// GET /certifications
router.get(
  '/',
  requirePermission('safety_training:view:global'),
  auditLog({ action: 'READ', resourceType: 'certifications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, driver_id } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const conditions: string[] = ['tenant_id = $1']
      const params: any[] = [req.user!.tenant_id]
      let idx = 2

      if (driver_id) {
        conditions.push(`driver_id = $${idx++}`)
        params.push(driver_id)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const result = await pool.query(
        `SELECT id, tenant_id, driver_id, type, number, issuing_authority,
                issued_date, expiry_date, status, document_url, created_at, updated_at
         FROM certifications
         ${whereClause}
         ORDER BY expiry_date ASC NULLS LAST
         LIMIT $2 OFFSET $3`,
        [...params, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM certifications ${whereClause}`,
        params
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit))
        }
      })
    } catch (error) {
      logger.error('Get certifications error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
