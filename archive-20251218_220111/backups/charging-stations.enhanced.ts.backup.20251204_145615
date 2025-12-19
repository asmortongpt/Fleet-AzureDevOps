import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import csurf from 'csurf'

const router = express.Router()

router.use(authenticateJWT)
router.use(helmet())
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  })
)
router.use(csurf())

const chargingStationSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  charger_type: z.string().min(1),
  power_output: z.number(),
  status: z.string().min(1),
  is_active: z.boolean(),
})

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
          name,
          location,
          latitude,
          longitude,
          charger_type,
          power_output,
          status,
          is_active,
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
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(countResult.rows[0].count / Number(limit)),
        },
      })
    } catch (error) {
      console.error(`Get charging-stations error:`, error)
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
          name,
          location,
          latitude,
          longitude,
          charger_type,
          power_output,
          status,
          is_active,
          created_at,
          updated_at 
        FROM charging_stations 
        WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Charging station not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get charging-stations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /charging-stations
router.post(
  '/',
  requirePermission('charging_station:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validationResult = chargingStationSchema.safeParse(req.body)
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error })
      }

      const data = validationResult.data
      const { columnNames, placeholders, values } = buildInsertClause(data, ['tenant_id'], 1)

      const result = await pool.query(
        `INSERT INTO charging_stations (${columnNames.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Post charging-stations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
