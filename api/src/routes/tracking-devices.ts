import express, { Response } from 'express'

import { pool } from '../db/connection'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/tracking-devices
router.get(
  '/',
  requirePermission('fleet:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tracking_devices')`
      )
      if (!tableCheck.rows[0].exists) {
        return res.json({
          data: [],
          pagination: { page: 1, limit: 50, total: 0, pages: 0 }
        })
      }

      const { page = 1, limit = 50, status, device_type } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT id, tenant_id, device_type, manufacturer, model_number,
                          serial_number, hardware_version, firmware_version,
                          purchase_date, warranty_expiry_date, unit_cost,
                          status, notes, created_at, updated_at
                   FROM tracking_devices
                   WHERE tenant_id = $1`
      const params: unknown[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (status) {
        query += ` AND status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      if (device_type) {
        query += ` AND device_type = $${paramIndex}`
        params.push(device_type)
        paramIndex++
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM tracking_devices WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      logger.error('Get tracking devices error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/tracking-devices/:id
router.get(
  '/:id',
  requirePermission('fleet:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tracking_devices')`
      )
      if (!tableCheck.rows[0].exists) {
        return res.status(404).json({ error: 'Tracking device not found' })
      }

      const result = await pool.query(
        `SELECT id, tenant_id, device_type, manufacturer, model_number,
                serial_number, hardware_version, firmware_version,
                purchase_date, warranty_expiry_date, unit_cost,
                status, notes, created_at, updated_at
         FROM tracking_devices
         WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Tracking device not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get tracking device error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
