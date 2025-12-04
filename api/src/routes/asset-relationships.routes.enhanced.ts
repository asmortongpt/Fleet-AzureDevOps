import { Router } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

// Zod schema for query validation
const querySchema = z.object({
  parent_asset_id: z.string().optional(),
  child_asset_id: z.string().optional(),
  relationship_type: z.enum(['TOWS', 'ATTACHED', 'CARRIES', 'POWERS', 'CONTAINS']).optional(),
  active_only: z.boolean().default(true),
})

router.get(
  '/',
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'asset_relationships' }),
  async (req: AuthRequest, res) => {
    try {
      // Validate query parameters
      const validatedQuery = querySchema.parse(req.query)

      let query = `
        SELECT
          ar.*,
          vp.make || ' ' || vp.model || ' (' || vp.vin || ')' as parent_asset_name,
          vp.asset_type as parent_asset_type,
          vc.make || ' ' || vc.model || ' (' || vc.vin || ')' as child_asset_name,
          vc.asset_type as child_asset_type,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM asset_relationships ar
        LEFT JOIN vehicles vp ON ar.parent_asset_id = vp.id
        LEFT JOIN vehicles vc ON ar.child_asset_id = vc.id
        LEFT JOIN users u ON ar.created_by = u.id
        WHERE vp.tenant_id = $1
      `

      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (validatedQuery.parent_asset_id) {
        query += ` AND ar.parent_asset_id = $${paramIndex++}`
        params.push(validatedQuery.parent_asset_id)
      }

      if (validatedQuery.child_asset_id) {
        query += ` AND ar.child_asset_id = $${paramIndex++}`
        params.push(validatedQuery.child_asset_id)
      }

      if (validatedQuery.relationship_type) {
        query += ` AND ar.relationship_type = $${paramIndex++}`
        params.push(validatedQuery.relationship_type)
      }

      if (validatedQuery.active_only) {
        query += ` AND (ar.effective_to IS NULL OR ar.effective_to > NOW())`
      }

      query += ` ORDER BY ar.effective_from DESC`

      const { rows } = await pool.query(query, params)
      res.json(rows)
    } catch (error) {
      console.error('Failed to get asset relationships:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  }
)

export default router
