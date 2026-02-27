/**
 * Jobs Routes (Operations Hub)
 *
 * Frontend OperationsHubDrilldowns calls /api/jobs and /api/jobs?filter=...
 * Maps to the `dispatches` table which stores fleet operation dispatch records.
 */

import express, { Response } from 'express'

import { pool } from '../config/database'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /jobs — list operations jobs (backed by dispatches table)
router.get(
  '/',
  requirePermission('vehicle:view:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { filter } = req.query
      const tenantId = req.user!.tenant_id

      const conditions: string[] = ['d.tenant_id = $1']
      const params: any[] = [tenantId]
      let paramIndex = 2

      if (filter && typeof filter === 'string' && filter.trim()) {
        conditions.push(`(d.type ILIKE $${paramIndex} OR d.notes ILIKE $${paramIndex} OR d.status::text ILIKE $${paramIndex})`)
        params.push(`%${filter.trim()}%`)
        paramIndex++
      }

      const whereClause = conditions.join(' AND ')

      const result = await pool.query(
        `SELECT
          d.id,
          d.type as title,
          COALESCE(d.notes, '') as description,
          d.status,
          d.priority,
          d.driver_id as "assignedToId",
          COALESCE(dr.first_name || ' ' || dr.last_name, '') as "assignedToName",
          d.dispatched_at as "createdDate",
          d.completed_at as "completedDate",
          COALESCE(d.dispatched_at, d.created_at) as "dueDate",
          d.vehicle_id as "vehicleId",
          v.unit_number as "vehicleNumber",
          d.origin,
          d.destination
        FROM dispatches d
        LEFT JOIN drivers dr ON d.driver_id = dr.id
        LEFT JOIN vehicles v ON d.vehicle_id = v.id
        WHERE ${whereClause}
        ORDER BY d.dispatched_at DESC
        LIMIT 200`,
        params
      )

      res.json(result.rows)
    } catch (error) {
      logger.error('Get jobs error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

// GET /jobs/:id — single job detail
router.get(
  '/:id',
  requirePermission('vehicle:view:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          d.id,
          d.type as title,
          COALESCE(d.notes, '') as description,
          d.status,
          d.priority,
          d.driver_id as "assignedToId",
          COALESCE(dr.first_name || ' ' || dr.last_name, '') as "assignedToName",
          d.dispatched_at as "createdDate",
          d.completed_at as "completedDate",
          COALESCE(d.dispatched_at, d.created_at) as "dueDate",
          d.vehicle_id as "vehicleId",
          v.unit_number as "vehicleNumber",
          d.origin,
          d.destination,
          d.origin_lat as "originLat",
          d.origin_lng as "originLng",
          d.destination_lat as "destinationLat",
          d.destination_lng as "destinationLng"
        FROM dispatches d
        LEFT JOIN drivers dr ON d.driver_id = dr.id
        LEFT JOIN vehicles v ON d.vehicle_id = v.id
        WHERE d.id = $1 AND d.tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Job not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Get job detail error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

export default router
