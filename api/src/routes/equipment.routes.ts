/**
 * Equipment Routes (Asset Hub)
 *
 * Frontend AssetHubDrilldowns calls /api/equipment and /api/equipment/:id.
 * The underlying data may live in the heavy_equipment table.
 * This route queries the table if it exists and returns empty arrays
 * gracefully if it doesn't.
 */

import express, { Response } from 'express'

import { pool } from '../config/database'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /equipment — list equipment
router.get(
  '/',
  requirePermission('vehicle:view:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { category } = req.query
      const tenantId = req.user!.tenant_id

      let query = `
        SELECT
          he.id,
          COALESCE(v.make || ' ' || v.model, he.equipment_type) as name,
          CASE
            WHEN he.equipment_type IN ('excavator', 'bulldozer', 'crane', 'loader', 'backhoe') THEN 'heavy'
            WHEN he.equipment_type IN ('forklift', 'scissor_lift', 'pallet_jack') THEN 'light'
            WHEN he.equipment_type IN ('generator', 'compressor', 'welder') THEN 'specialized'
            ELSE 'tools'
          END as category,
          COALESCE(v.status, 'active') as status,
          he.equipment_type as type,
          v.make as manufacturer,
          v.model,
          v.vin as serial_number,
          he.engine_hours as operating_hours
        FROM heavy_equipment he
        LEFT JOIN assets a ON he.asset_id = a.id
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        WHERE he.tenant_id = $1
      `
      const params: unknown[] = [tenantId]
      let paramIndex = 2

      if (category) {
        query += ` AND CASE
          WHEN he.equipment_type IN ('excavator', 'bulldozer', 'crane', 'loader', 'backhoe') THEN 'heavy'
          WHEN he.equipment_type IN ('forklift', 'scissor_lift', 'pallet_jack') THEN 'light'
          WHEN he.equipment_type IN ('generator', 'compressor', 'welder') THEN 'specialized'
          ELSE 'tools'
        END = $${paramIndex}`
        params.push(category)
        paramIndex++
      }

      query += ` ORDER BY he.created_at DESC LIMIT 100`

      const result = await pool.query(query, params)
      res.json(result.rows)
    } catch (error) {
      // Table may not exist — return empty array
      logger.warn('Equipment query failed (table may not exist):', error)
      res.json([])
    }
  }
)

// GET /equipment/:id — single equipment detail
router.get(
  '/:id',
  requirePermission('vehicle:view:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          he.id,
          COALESCE(v.make || ' ' || v.model, he.equipment_type) as name,
          CASE
            WHEN he.equipment_type IN ('excavator', 'bulldozer', 'crane', 'loader', 'backhoe') THEN 'heavy'
            WHEN he.equipment_type IN ('forklift', 'scissor_lift', 'pallet_jack') THEN 'light'
            WHEN he.equipment_type IN ('generator', 'compressor', 'welder') THEN 'specialized'
            ELSE 'tools'
          END as category,
          COALESCE(v.status, 'active') as status,
          he.equipment_type as type,
          v.make as manufacturer,
          v.model,
          v.vin as serial_number,
          he.engine_hours as operating_hours
        FROM heavy_equipment he
        LEFT JOIN assets a ON he.asset_id = a.id
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        WHERE he.id = $1`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Equipment not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.warn('Equipment detail query failed:', error)
      res.status(404).json({ success: false, error: 'Equipment not found' })
    }
  }
)

export default router
