import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { rateLimit } from '../middleware/rateLimit'
import { validateInput } from '../middleware/validateInput'

const router = express.Router()
router.use(authenticateJWT)
router.use(rateLimit({ windowMs: 60 * 1000, max: 100 })) // 100 requests per minute

const routeQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

const idParamSchema = z.object({
  id: z.string(),
})

// GET /routes
router.get(
  '/',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  validateInput(routeQuerySchema, 'query'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const userResult = await pool.query(
        'SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2',
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

      if (userResult.rows.length > 0) {
        const driverId = userResult.rows[0].id
        query += ` AND driver_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`
        countQuery += ' AND driver_id = $2'
        params.push(driverId, Number(limit), offset)
      } else {
        query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3'
        params.push(Number(limit), offset)
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
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit))
        }
      })
    } catch (error) {
      console.error('Get routes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /routes/:id
router.get(
  '/:id',
  requirePermission('route:view:own', {
    customCheck: async (req: AuthRequest) => {
      const validatedParams = validateInput(idParamSchema, 'params', req)
      const driverResult = await pool.query(
        'SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2',
        [req.user!.id, req.user!.tenant_id]
      )
      if (driverResult.rows.length > 0) {
        const routeResult = await pool.query(
          'SELECT id FROM routes WHERE id = $1 AND driver_id = $2',
          [validatedParams.id, driverResult.rows[0].id]
        )
        return routeResult.rows.length > 0
      }
      return false
    }
  }),
  auditLog({ action: 'READ', resourceType: 'route', resourceIdParam: 'id' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const result = await pool.query(
        'SELECT * FROM routes WHERE id = $1 AND tenant_id = $2',
        [id, req.user!.tenant_id]
      )
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Route not found' })
      }
      res.json(result.rows[0])
    } catch (error) {
      console.error('Get route by ID error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router