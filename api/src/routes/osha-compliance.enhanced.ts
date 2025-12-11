the code's maintainability and testability. The `Osha300LogRepository` class encapsulates the database operations related to OSHA 300 logs, making it easier to manage and test these operations independently of the route handlers.

Here's the complete refactored `osha-compliance.enhanced.ts` file:


import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { serialize } from 'node-html-encoder'
import { csrfProtection } from '../middleware/csrf'

// Import the new repository
import { Osha300LogRepository } from '../repositories/Osha300LogRepository'

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
        throw new ValidationError("Invalid request parameters")
      }

      const { page = 1, limit = 50, year, status } = validationResult.data
      const offset = (Number(page) - 1) * Number(limit)

      // Create an instance of the repository
      const osha300LogRepository = container.resolve(Osha300LogRepository)

      // Use repository methods instead of pool.query
      const result = await osha300LogRepository.getOsha300Logs(
        req.user!.tenant_id,
        year,
        status,
        Number(limit),
        offset
      )

      const totalCount = await osha300LogRepository.getOsha300LogCount(req.user!.tenant_id)

      res.json({
        data: result.map(row => ({
          ...row,
          employee_full_name: serialize(row.employee_full_name),
          vehicle_unit: serialize(row.vehicle_unit),
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit)),
        },
      })
    } catch (error) {
      console.error(`Get OSHA 300 log error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router


And here's the complete `Osha300LogRepository.ts` file that should be created in the `repositories` directory:


import { injectable } from 'inversify'
import { pool } from '../db'

@injectable()
export class Osha300LogRepository {
  async getOsha300Logs(tenantId: number, year?: string, status?: string, limit: number, offset: number) {
    let query = `
      SELECT o.*,
             d.first_name || ' ' || d.last_name as employee_full_name,
             v.unit_number as vehicle_unit
      FROM osha_300_log o
      LEFT JOIN drivers d ON o.employee_id = d.id
      LEFT JOIN vehicles v ON o.vehicle_id = v.id
      WHERE d.tenant_id = $1
    `
    const params: any[] = [tenantId]
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
    return result.rows
  }

  async getOsha300LogCount(tenantId: number) {
    const query = `
      SELECT COUNT(*)
      FROM osha_300_log o
      LEFT JOIN drivers d ON o.employee_id = d.id
      WHERE d.tenant_id = $1
    `
    const result = await pool.query(query, [tenantId])
    return parseInt(result.rows[0].count, 10)
  }
}


This refactoring improves the code structure by:

1. Encapsulating database operations in a separate repository class.
2. Making the route handler more focused on business logic rather than database queries.
3. Improving testability by allowing easier mocking of database operations.
4. Enhancing maintainability by centralizing database-related code in one place.

To fully implement this refactoring, you'll need to:

1. Create the `Osha300LogRepository.ts` file in the `repositories` directory.
2. Ensure that the `container` is properly set up to resolve the `Osha300LogRepository` class.
3. Update any other parts of the application that might be using `pool.query` or `db.query` for OSHA 300 log operations to use the new repository methods.

This refactoring sets a good foundation for further improvements and extensions to the OSHA compliance system.