import express, { Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { Pool } from 'pg'
import { z } from 'zod'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { getErrorMessage } from '../utils/error-handler'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import { check, validationResult } from 'express-validator'

const router = express.Router()
router.use(helmet())
router.use(express.json())

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

router.use(apiLimiter)

let pool: Pool

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool
}

// =====================================================
// Validation Schemas
// =====================================================

const createOnCallPeriodSchema = z.object({
  driver_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  start_datetime: z.string().datetime(),
  end_datetime: z.string().datetime(),
  schedule_type: z.string().optional(),
  schedule_notes: z.string().optional(),
  on_call_vehicle_assignment_id: z.string().uuid().optional(),
  geographic_region: z.string().optional(),
  commuting_constraints: z.record(z.any()).optional(),
})

const updateOnCallPeriodSchema = createOnCallPeriodSchema.partial()

const acknowledgeOnCallSchema = z.object({
  acknowledged: z.boolean(),
})

const createCallbackTripSchema = z.object({
  on_call_period_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  trip_start_time: z.string().datetime().optional(),
  trip_end_time: z.string().datetime().optional(),
  miles_driven: z.number().positive(),
  includes_commute_trip: z.boolean().default(false),
  commute_miles: z.number().nonnegative().optional(),
  used_assigned_vehicle: z.boolean().default(false),
  used_private_vehicle: z.boolean().default(false),
  vehicle_id: z.string().uuid().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  reimbursement_requested: z.boolean().default(false),
  reimbursement_amount: z.number().nonnegative().optional(),
})

// =====================================================
// Route Handlers
// =====================================================

// Example: GET /on-call-periods
router.get(
  '/',
  authenticateJWT,
  requirePermission('on_call:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = '1',
        limit = '50',
        driver_id,
        department_id,
        is_active,
        start_date,
        end_date,
      } = req.query

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
      const tenant_id = req.user!.tenant_id

      let whereConditions = ['ocp.tenant_id = $1']
      let params: any[] = [tenant_id]
      let paramIndex = 2

      if (driver_id) {
        whereConditions.push(`ocp.driver_id = $${paramIndex++}`)
        params.push(driver_id)
      }

      if (department_id) {
        whereConditions.push(`ocp.department_id = $${paramIndex++}`)
        params.push(department_id)
      }

      if (is_active) {
        whereConditions.push(`ocp.end_datetime > NOW()`)
      }

      if (start_date && end_date) {
        whereConditions.push(
          `ocp.start_datetime >= $${paramIndex} AND ocp.end_datetime <= $${paramIndex + 1}`
        )
        params.push(start_date, end_date)
        paramIndex += 2
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

      const query = `
        SELECT * FROM on_call_periods ocp
        ${whereClause}
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `

      const result = await pool.query(query, [...params, parseInt(limit as string), offset])
      res.json(result.rows)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: getErrorMessage(error) })
    }
  }
)

// Add more route handlers here following the same security and validation patterns

export default router
