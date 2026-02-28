/**
 * Licenses Routes
 *
 * License/certification management endpoints.
 * Frontend expects: GET /api/licenses returning License[]
 * Maps to `certifications` table, grouped by certification type.
 */

import express, { Response } from 'express'

import { pool } from '../config/database'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /licenses — list certifications grouped by type
router.get(
  '/',
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id

      // Check if table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certifications')`
      )
      if (!tableCheck.rows[0].exists) {
        return res.json({ success: true, data: [] })
      }

      const result = await pool.query(
        `SELECT
          c.type as id,
          c.type as name,
          COUNT(*) FILTER (WHERE c.status = 'active') as "seatsUsed",
          COUNT(*) as "totalSeats",
          MIN(c.expiry_date) FILTER (WHERE c.status = 'active') as "renewalDate"
        FROM certifications c
        WHERE c.tenant_id = $1
        GROUP BY c.type
        ORDER BY c.type`,
        [tenantId]
      )

      res.json({
        success: true,
        data: result.rows.map(row => ({
          ...row,
          seatsUsed: Number(row.seatsUsed) || 0,
          totalSeats: Number(row.totalSeats) || 0,
        }))
      })
    } catch (error) {
      logger.error('Get licenses error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

// GET /licenses/:id — get single certification detail (by type name or UUID)
router.get(
  '/:id',
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id
      const idParam = req.params.id

      // Check if table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certifications')`
      )
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ success: false, error: 'License not found' })
      }

      // Try lookup by UUID first, then by type name
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam)

      if (isUuid) {
        const result = await pool.query(
          `SELECT
            c.id,
            c.type as name,
            c.number,
            c.issuing_authority,
            c.issued_date,
            c.expiry_date,
            c.status,
            c.driver_id,
            d.first_name || ' ' || d.last_name as driver_name
          FROM certifications c
          LEFT JOIN drivers d ON c.driver_id = d.id
          WHERE c.id = $1 AND c.tenant_id = $2`,
          [idParam, tenantId]
        )

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'License not found' })
        }

        return res.json({ success: true, data: result.rows[0] })
      }

      // Lookup by type name — return all certifications of that type
      const result = await pool.query(
        `SELECT
          c.id,
          c.type as name,
          c.number,
          c.issuing_authority,
          c.issued_date,
          c.expiry_date,
          c.status,
          c.driver_id,
          d.first_name || ' ' || d.last_name as driver_name
        FROM certifications c
        LEFT JOIN drivers d ON c.driver_id = d.id
        WHERE c.type = $1 AND c.tenant_id = $2
        ORDER BY c.expiry_date ASC`,
        [idParam, tenantId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'License not found' })
      }

      res.json({ success: true, data: result.rows })
    } catch (error) {
      logger.error('Get license error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

export default router
