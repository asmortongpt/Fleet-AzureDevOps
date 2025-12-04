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
import csurf from 'csurf'

const router = express.Router()
router.use(helmet()
router.use(express.json()
router.use(csurf({ cookie: true })

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
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

const createReauthCycleSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  cycle_name: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deadline_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
})

const createReauthDecisionSchema = z.object({
  reauthorization_cycle_id: z.string().uuid(),
  vehicle_assignment_id: z.string().uuid(),
  decision: z.enum(['reauthorize', 'modify', 'terminate']),
  modification_notes: z.string().optional(),
  new_vehicle_id: z.string().uuid().optional(),
  new_driver_id: z.string().uuid().optional(),
  parameter_changes: z.record(z.any().optional(), // Consider refining this schema for better validation
  termination_reason: z.string().optional(),
  termination_effective_date: z
    .string()
    .regex(/^\d{4}-\\d{2}-\\d{2}$/)
    .optional(),
  director_notes: z.string().optional(),
})

// =====================================================
// GET /annual-reauthorization-cycles
// List reauthorization cycles
// =====================================================

router.get(
  '/',
  authenticateJWT,
  requirePermission('reauthorization:view:team'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = '1', limit = '50', year, status } = req.query
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string)
      const tenant_id = req.user!.tenant_id

      let whereConditions = [`arc.tenant_id = $1`]
      let params: any[] = [tenant_id]
      let paramIndex = 2

      if (year) {
        whereConditions.push(`arc.year = $${paramIndex++}`)
        params.push(parseInt(year as string)
      }
      if (status) {
        whereConditions.push(`arc.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = whereConditions.join(` AND `)

      const query = `
        SELECT
          arc.*,
          u.first_name AS submitted_by_first_name,
          u.last_name AS submitted_by_last_name
        FROM annual_reauthorization_cycles arc
        LEFT JOIN users u ON arc.submitted_by_user_id = u.id
        WHERE ${whereClause}
        ORDER BY arc.year DESC, arc.start_date DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `
      params.push(parseInt(limit as string), offset)

      const result = await pool.query(query, params)
      res.json(result.rows)
    } catch (error) {
      console.error('Error listing reauthorization cycles:', error)
      res.status(500).json({ error: getErrorMessage(error) })
    }
  }
)

// Add more routes here following the same security and validation patterns

export default router
