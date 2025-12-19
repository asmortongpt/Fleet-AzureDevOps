import csurf from 'csurf'
import express, { Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { tenantSafeQuery } from '../utils/dbHelpers'
import { applyFieldMasking } from '../utils/fieldMasking'


const router = express.Router()

router.use(helmet())
router.use(authenticateJWT)
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}))

const csrfProtection = csurf({ cookie: true })

// Enhanced with CSRF protection on mutations
router.post('/', csrfProtection, csrfProtection)
router.put('/:id', csrfProtection, csrfProtection)
router.delete('/:id', csrfProtection, csrfProtection)

// GET /drivers
router.get(
  '/',
  requirePermission('driver:view:team'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // Get user scope for row-level filtering
      const userResult = await tenantSafeQuery(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1 AND tenant_id = $2',
        [req.user!.id, req.user!.tenant_id],
        req.user!.tenant_id
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      const scopeParams: any[] = [req.user!.tenant_id]

      if (user.scope_level === `own` && user.driver_id) {
        // Drivers only see themselves
        scopeFilter = 'AND id = $2'
        scopeParams.push(user.driver_id)
      } else if (user.scope_level === 'team' && user.team_driver_ids && user.team_driver_ids.length > 0) {
        // Supervisors see drivers in their team
        scopeFilter = 'AND id = ANY($2::uuid[])'
        scopeParams.push(user.team_driver_ids)
      }
      // fleet/global scope sees all

      const result = await tenantSafeQuery(
        'SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at FROM users WHERE tenant_id = $1 ' + scopeFilter + ' ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [...scopeParams, limit, offset],
        req.user!.tenant_id
      )

      const countResult = await tenantSafeQuery(
        'SELECT COUNT(*) FROM users WHERE tenant_id = $1 ' + scopeFilter,
        scopeParams,
        req.user!.tenant_id
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
      console.error(`Get drivers error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// GET /drivers/:id
router.get(
  '/:id',
  requirePermission('driver:view:own'),
  applyFieldMasking('driver'),
  auditLog({ action: 'READ', resourceType: 'users' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await tenantSafeQuery(
        'SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at FROM users WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id],
        req.user!.tenant_id
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Driver not found` })
      }

      // IDOR protection: Check if user has access to this driver
      const userResult = await tenantSafeQuery(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1 AND tenant_id = $2',
        [req.user!.id, req.user!.tenant_id],
        req.user!.tenant_id
      )
      const user = userResult.rows[0]
      const driverId = req.params.id

      if (user.scope_level === `own` && user.driver_id !== driverId) {
        return res.status(403).json({ error: `Forbidden` })
      } else if (user.scope_level === 'team' && !user.team_driver_ids.includes(driverId)) {
        return res.status(403).json({ error: `Forbidden` })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error(`Get driver error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

export default router
