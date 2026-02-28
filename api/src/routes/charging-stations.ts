import express, { Response } from 'express'
import { z } from 'zod'

import { pool } from '../db/connection'
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../utils/logger'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const chargingStationSchema = z.object({
  station_name: z.string().min(1).max(200),
  station_type: z.string().max(100).optional(),
  location: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  number_of_ports: z.number().int().min(1).max(100).optional(),
  power_output_kw: z.number().min(0).max(1000).optional(),
  cost_per_kwh: z.number().min(0).optional(),
  is_public: z.boolean().optional(),
  is_operational: z.boolean().optional(),
  notes: z.string().max(2000).optional()
}).passthrough()


const router = express.Router()
router.use(authenticateJWT)

// GET /charging-stations
router.get(
  '/',
  requirePermission('charging_station:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT
          id,
          tenant_id,
          station_name,
          station_type,
          location,
          latitude,
          longitude,
          number_of_ports,
          power_output_kw,
          cost_per_kwh,
          is_public,
          is_operational,
          notes,
          created_at,
          updated_at
         FROM charging_stations
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM charging_stations WHERE tenant_id = $1`,
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
      logger.error(`Get charging-stations error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /charging-stations/:id
router.get(
  '/:id',
  requirePermission('charging_station:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          id,
          tenant_id,
          station_name,
          station_type,
          location,
          latitude,
          longitude,
          number_of_ports,
          power_output_kw,
          cost_per_kwh,
          is_public,
          is_operational,
          notes,
          created_at,
          updated_at
         FROM charging_stations
         WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `ChargingStations not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Get charging-stations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /charging-stations
router.post(
  '/',
  csrfProtection, requirePermission('charging_station:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = chargingStationSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
      }
      const data = parsed.data
      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        [`tenant_id`],
        1
      )

      const result = await pool.query(
        `INSERT INTO charging_stations (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      logger.error(`Create charging-stations error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /charging-stations/:id
router.put(
  `/:id`,
  csrfProtection, requirePermission('charging_station:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = chargingStationSchema.partial().safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
      }
      const data = parsed.data
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE charging_stations SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `ChargingStations not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      logger.error(`Update charging-stations error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// DELETE /charging-stations/:id
router.delete(
  '/:id',
  csrfProtection, requirePermission('charging_station:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM charging_stations WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError("ChargingStations not found")
      }

      res.json({ success: true, message: 'ChargingStations deleted successfully' })
    } catch (error) {
      logger.error('Delete charging-stations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
