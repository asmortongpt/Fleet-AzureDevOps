import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import { cacheMiddleware, invalidateOnWrite, CacheStrategies } from '../middleware/cache'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { serialize } from 'node-html-encoder'

const router = express.Router()

router.use(helmet()
router.use(authenticateJWT)
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  })
)

const communicationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  communication_type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
})

// GET /communications (CACHED: 5 minutes, vary by tenant and query params)
router.get(
  '/',
  requirePermission('communication:view:global'),
  cacheMiddleware({ ttl: 300000, varyByTenant: true, varyByQuery: true }),
  auditLog({ action: 'READ', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validationResult = communicationQuerySchema.safeParse(req.query)
      if (!validationResult.success) {
        return throw new ValidationError("Invalid query parameters")
      }

      const {
        page = '1',
        limit = '50',
        communication_type,
        category,
        priority,
        status,
        search,
      } = validationResult.data

      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT c.*,
               from_user.first_name || ' ' || from_user.last_name as from_user_name,
               COUNT(DISTINCT cel.id) as linked_entities_count
        FROM communications c
        LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
        LEFT JOIN communication_entity_links cel ON c.id = cel.communication_id
        WHERE (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
      `
      const params: (string | number)[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (communication_type) {
        query += ` AND c.communication_type = $${paramIndex}`
        params.push(communication_type)
        paramIndex++
      }

      if (category) {
        query += ` AND (c.ai_detected_category = $${paramIndex} OR c.manual_category = $${paramIndex})`
        params.push(category)
        paramIndex++
      }

      if (priority) {
        query += ` AND (c.ai_detected_priority = $${paramIndex} OR c.manual_priority = $${paramIndex})`
        params.push(priority)
        paramIndex++
      }

      if (status) {
        query += ` AND c.status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      if (search) {
        query += ` AND (
          c.subject ILIKE $${paramIndex} OR
          c.body ILIKE $${paramIndex} OR
          c.from_contact_name ILIKE $${paramIndex}
        )`
        params.push(`%${search}%`)
        paramIndex++
      }

      query += ` GROUP BY c.id, from_user.first_name, from_user.last_name`
      query += ` ORDER BY c.communication_datetime DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)
      res.json(
        result.rows.map(row => ({
          ...row,
          from_user_name: serialize(row.from_user_name),
        })
      )
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
