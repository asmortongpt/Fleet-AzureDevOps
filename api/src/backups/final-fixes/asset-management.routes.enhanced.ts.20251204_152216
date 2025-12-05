import { Router } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { z } from 'zod'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

const AssetQuerySchema = z.object({
  type: z.enum(['vehicle', 'equipment', 'tool', 'trailer', 'other']).optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired', 'disposed']).optional(),
  location: z.string().optional(),
  assigned_to: z.string().optional(),
  search: z.string().optional(),
})

router.get('/', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const queryValidation = AssetQuerySchema.safeParse(req.query)
    if (!queryValidation.success) {
      return throw new ValidationError("Invalid query parameters")
    }

    const { type, status, location, assigned_to, search } = queryValidation.data
    const tenantId = req.user?.tenant_id

    let query = `
      SELECT
        a.*,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        COUNT(DISTINCT ah.id) as history_count,
        MAX(m.scheduled_date) as next_maintenance
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      LEFT JOIN asset_history ah ON a.id = ah.asset_id
      LEFT JOIN maintenance_schedules m ON a.id = m.asset_id AND m.status = 'scheduled'
      WHERE a.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (type) {
      paramCount++
      query += ` AND a.asset_type = $${paramCount}`
      params.push(type)
    }

    if (status) {
      paramCount++
      query += ` AND a.status = $${paramCount}`
      params.push(status)
    }

    if (location) {
      paramCount++
      query += ` AND a.location = $${paramCount}`
      params.push(location)
    }

    if (assigned_to) {
      paramCount++
      query += ` AND a.assigned_to = $${paramCount}`
      params.push(assigned_to)
    }

    if (search) {
      paramCount++
      query += ` AND (
        a.asset_name ILIKE $${paramCount} OR
        a.asset_tag ILIKE $${paramCount} OR
        a.serial_number ILIKE $${paramCount} OR
        a.description ILIKE $${paramCount}
      )`
      params.push(`%${search}%`)
    }

    query += ` GROUP BY a.id, u.first_name, u.last_name ORDER BY a.created_at DESC`

    const result = await pool.query(query, params)

    res.json({
      assets: result.rows,
      total: result.rows.length,
    })
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
