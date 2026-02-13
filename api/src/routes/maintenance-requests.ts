/**
 * Maintenance Requests Routes
 *
 * Provides read access to maintenance request records with tenant isolation.
 */

import express, { Response } from 'express'

import logger from '../config/logger'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac'
import { setTenantContext } from '../middleware/tenant-context'

const router = express.Router()

// SECURITY: Require auth and tenant context for all routes
router.use(authenticateJWT)
router.use(setTenantContext)

/**
 * GET /maintenance-requests
 *
 * Lists maintenance requests for the authenticated tenant.
 */
router.get(
  '/',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.MAINTENANCE_TECH, Role.USER, Role.VIEWER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'maintenance_requests'
  }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, priority } = req.query
      const offset = (Number(page) - 1) * Number(limit)
      const isDevelopment = process.env.NODE_ENV === 'development'

      const client = req.dbClient
      if (!client) {
        logger.error('maintenance-requests: dbClient not available')
        return res.status(500).json({ error: 'Internal server error' })
      }

      let whereClause = ''
      const params: unknown[] = []

      if (isDevelopment && req.user?.tenant_id) {
        whereClause = 'WHERE tenant_id = $1'
        params.push(req.user.tenant_id)
      }

      if (status) {
        params.push(status)
        whereClause += (whereClause ? ' AND' : 'WHERE') + ` status = $${params.length}`
      }
      if (priority) {
        params.push(priority)
        whereClause += (whereClause ? ' AND' : 'WHERE') + ` priority = $${params.length}`
      }

      const dataResult = await client.query(
        `SELECT id, tenant_id, request_number, request_type, priority, vehicle_id, asset_id,
                title, description, issue_category, requested_by, driver_id, requested_date,
                scheduled_date, completed_date, assigned_to, facility_id, status, total_cost,
                created_at, updated_at
         FROM maintenance_requests
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, Number(limit), offset]
      )

      const countResult = await client.query(
        `SELECT COUNT(*)::integer as count FROM maintenance_requests ${whereClause}`,
        params
      )

      return res.json({
        data: dataResult.rows,
        meta: {
          total: countResult.rows[0]?.count || 0,
          page: Number(page),
          limit: Number(limit),
        },
      })
    } catch (error) {
      logger.error('maintenance-requests: failed to fetch', { error })
      return res.status(500).json({ error: 'Failed to fetch maintenance requests' })
    }
  }
)

export default router
