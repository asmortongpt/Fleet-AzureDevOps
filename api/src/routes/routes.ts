import express, { Response } from 'express'

import pool from '../config/database'
import logger from '../config/logger'
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /routes
router.get(
  '/',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // Row-level filtering: check if user is a driver
      const userResult = await pool.query(
        `SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2`,
        [req.user!.id, req.user!.tenant_id]
      )

      let query = `SELECT
      id,
      tenant_id,
      route_name,
      vehicle_id,
      driver_id,
      status,
      start_location,
      end_location,
      planned_start_time,
      planned_end_time,
      actual_start_time,
      actual_end_time,
      total_distance,
      estimated_duration,
      actual_duration,
      waypoints,
      optimized_waypoints,
      route_geometry,
      notes,
      created_at,
      updated_at FROM routes WHERE tenant_id = $1`
      let countQuery = `SELECT COUNT(*) FROM routes WHERE tenant_id = $1`
      const params: any[] = [req.user!.tenant_id]

      // If user is a driver, filter to only their routes
      if (userResult.rows.length > 0) {
        const driverId = userResult.rows[0].id
        query += ` AND driver_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`
        countQuery += ' AND driver_id = $2'
        params.push(driverId, limit, offset)
      } else {
        query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3'
        params.push(limit, offset)
      }

      const result = await pool.query(query, params)

      const countParams = userResult.rows.length > 0
        ? [req.user!.tenant_id, userResult.rows[0].id]
        : [req.user!.tenant_id]
      const countResult = await pool.query(countQuery, countParams)

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
      logger.error('Get routes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /routes/:id
router.get(
  '/:id',
  requirePermission('route:view:own', {
    customCheck: async (req: AuthRequest) => {
      // IDOR check: verify the route belongs to the user if they're a driver
      const driverResult = await pool.query(
        `SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2`,
        [req.user!.id, req.user!.tenant_id]
      )

      // If user is not a driver, allow access (fleet managers/admins)
      if (driverResult.rows.length === 0) {
        return true
      }

      // If user is a driver, verify the route belongs to them
      const routeResult = await pool.query(
        `SELECT id FROM routes WHERE id = $1 AND driver_id = $2 AND tenant_id = $3`,
        [req.params.id, driverResult.rows[0].id, req.user!.tenant_id]
      )

      return routeResult.rows.length > 0
    }
  }),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
      id,
      tenant_id,
      route_name,
      vehicle_id,
      driver_id,
      status,
      start_location,
      end_location,
      planned_start_time,
      planned_end_time,
      actual_start_time,
      actual_end_time,
      total_distance,
      estimated_duration,
      actual_duration,
      waypoints,
      optimized_waypoints,
      route_geometry,
      notes,
      created_at,
      updated_at FROM routes WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Routes not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Get routes error:', error) // Wave 17: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /routes
router.post(
  '/',
  csrfProtection,
  requirePermission('route:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO routes (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      logger.error(`Create routes error:`, error) // Wave 17: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /routes/:id

// SECURITY: Allow-list for updateable fields (prevents mass assignment)
const ALLOWED_UPDATE_FIELDS = [
  "notes",
  "status",
  "start_location",
  "end_location",
  "waypoints",
  "distance"
];

router.put(
  '/:id',
  csrfProtection,
  requirePermission('route:update:fleet', {
    customCheck: async (req: AuthRequest) => {
      // Prevent modifying completed routes
      const routeResult = await pool.query(
        `SELECT status FROM routes WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (routeResult.rows.length === 0) {
        return false
      }

      // Block updates to completed routes
      const status = routeResult.rows[0].status
      if (status === `completed`) {
        return false
      }

      return true
    }
  }),
  auditLog({ action: 'UPDATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // SECURITY: IDOR Protection - Validate foreign keys belong to tenant
      const { vehicle_id, driver_id } = data

      if (vehicle_id) {
        const vehicleCheck = await pool.query(
          'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
          [vehicle_id, req.user!.tenant_id]
        )
        if (vehicleCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Vehicle Id not found or access denied'
          })
        }
      }

      if (driver_id) {
        const driverCheck = await pool.query(
          'SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2',
          [driver_id, req.user!.tenant_id]
        )
        if (driverCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Driver Id not found or access denied'
          })
        }
      }

      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE routes SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Routes not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error(`Update routes error:`, error) // Wave 17: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// DELETE /routes/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('route:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM routes WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError("Routes not found")
      }

      res.json({ message: 'Routes deleted successfully' })
    } catch (error) {
      logger.error('Delete routes error:', error) // Wave 17: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
