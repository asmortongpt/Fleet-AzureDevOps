import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { createUserSchema, updateUserSchema } from '../validation/schemas'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import csurf from 'csurf'

const router = express.Router()

router.use(helmet())
router.use(authenticateJWT)
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}))

const csrfProtection = csurf({ cookie: true })

// Enhanced with CSRF protection on mutations
router.post('/', csrfProtection)
router.put('/:id', csrfProtection)
router.delete('/:id', csrfProtection)

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
      const userResult = await pool.query(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      let scopeParams: any[] = [req.user!.tenant_id]

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

      const result = await pool.query(
        'SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at FROM users WHERE tenant_id = $1 ' + scopeFilter + ' ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [...scopeParams, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM users WHERE tenant_id = $1 ' + scopeFilter,
        scopeParams
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
      const result = await pool.query(
        'SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at FROM users WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Driver not found` })
      }

      // IDOR protection: Check if user has access to this driver
      const userResult = await pool.query(
        'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
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