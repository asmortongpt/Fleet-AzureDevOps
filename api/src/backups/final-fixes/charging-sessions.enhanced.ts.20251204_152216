import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { serialize } from 'node-html-encoder'

const router = express.Router()

router.use(authenticateJWT)
router.use(helmet()
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  })
)

const chargingSessionSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  id: z.string().optional(),
})

// GET /charging-sessions
router.get(
  '/',
  requirePermission('charging_session:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validation = chargingSessionSchema.safeParse(req.query)
      if (!validation.success) {
        return throw new ValidationError("Invalid request parameters")
      }
      const { page = '1', limit = '50' } = validation.data
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT 
          id,
          transaction_id,
          station_id,
          connector_id,
          vehicle_id,
          driver_id,
          start_time,
          end_time,
          duration_minutes,
          start_soc_percent,
          end_soc_percent,
          energy_delivered_kwh,
          max_power_kw,
          avg_power_kw,
          energy_cost,
          idle_fee,
          total_cost,
          session_status,
          stop_reason,
          scheduled_start_time,
          scheduled_end_time,
          charging_profile,
          is_smart_charging,
          target_soc_percent,
          reservation_id,
          rfid_tag,
          authorization_method,
          meter_start,
          meter_stop,
          raw_ocpp_data,
          created_at,
          updated_at 
        FROM charging_sessions 
        WHERE tenant_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM charging_sessions WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      res.json({
        data: result.rows.map(row => {
          Object.keys(row).forEach(key => {
            row[key] = serialize(row[key])
          })
          return row
        }),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit),
        },
      })
    } catch (error) {
      console.error(`Get charging-sessions error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /charging-sessions/:id
router.get(
  '/:id',
  requirePermission('charging_session:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_sessions' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const idValidation = chargingSessionSchema.pick({ id: true }).safeParse(req.params)
      if (!idValidation.success) {
        return throw new ValidationError("Invalid ID parameter")
      }
      const { id } = idValidation.data

      const result = await pool.query(
        `SELECT 
          id, 
          transaction_id, 
          station_id, 
          connector_id, 
          vehicle_id, 
          driver_id, 
          start_time, 
          end_time, 
          duration_minutes, 
          start_soc_percent, 
          end_soc_percent, 
          energy_delivered_kwh, 
          max_power_kw, 
          avg_power_kw, 
          energy_cost, 
          idle_fee, 
          total_cost, 
          session_status, 
          stop_reason, 
          scheduled_start_time, 
          scheduled_end_time, 
          charging_profile, 
          is_smart_charging, 
          target_soc_percent, 
          reservation_id, 
          rfid_tag, 
          authorization_method, 
          meter_start, 
          meter_stop, 
          raw_ocpp_data, 
          created_at, 
          updated_at 
        FROM charging_sessions 
        WHERE id = $1 AND tenant_id = $2`,
        [id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return throw new NotFoundError("Charging session not found")
      }

      const sanitizedData = Object.keys(result.rows[0]).reduce((acc, key) => {
        acc[key] = serialize(result.rows[0][key])
        return acc
      }, {})

      res.json(sanitizedData)
    } catch (error) {
      console.error(`Get charging-session by ID error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
