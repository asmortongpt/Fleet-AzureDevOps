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

const logSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  year: z.string().optional(),
  status: z.string().optional(),
})

// Root endpoint - returns available resources
router.get('/', async (req: AuthRequest, res: Response) => {
  res.json({
    message: 'OSHA Compliance API',
    endpoints: {
      '300_log': '/api/osha-compliance/300-log',
      safety_inspections: '/api/osha-compliance/safety-inspections',
      training_records: '/api/osha-compliance/training-records',
      accident_investigations: '/api/osha-compliance/accident-investigations',
      dashboard: '/api/osha-compliance/dashboard',
    },
  })
})

// GET /osha-compliance/300-log
router.get(
  '/300-log',
  requirePermission('osha:view:global'),
  auditLog({ action: 'READ', resourceType: 'osha_300_log' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validationResult = logSchema.safeParse(req.query)
      if (!validationResult.success) {
        return throw new ValidationError("Invalid request parameters")
      }

      const { page = 1, limit = 50, year, status } = validationResult.data
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT o.*,
               d.first_name || ' ' || d.last_name as employee_full_name,
               v.unit_number as vehicle_unit
        FROM osha_300_log o
        LEFT JOIN drivers d ON o.employee_id = d.id
        LEFT JOIN vehicles v ON o.vehicle_id = v.id
        WHERE d.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (year) {
        query += ` AND EXTRACT(YEAR FROM o.date_of_injury) = $${paramIndex}`
        params.push(year)
        paramIndex++
      }

      if (status) {
        query += ` AND o.case_status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      query += ` ORDER BY o.date_of_injury DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM osha_300_log o
        LEFT JOIN drivers d ON o.employee_id = d.id
        WHERE d.tenant_id = $1
      `
      const countResult = await pool.query(countQuery, [req.user!.tenant_id])

      res.json({
        data: result.rows.map(row => ({
          ...row,
          employee_full_name: serialize(row.employee_full_name),
          vehicle_unit: serialize(row.vehicle_unit),
        }),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(countResult.rows[0].count / Number(limit),
        },
      })
    } catch (error) {
      console.error(`Get OSHA 300 log error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
