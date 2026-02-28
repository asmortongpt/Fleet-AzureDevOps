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

/**
 * GET /maintenance-requests/:id
 *
 * Returns a single maintenance request by ID with related vehicle, driver, and facility details.
 */
router.get(
  '/:id',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.MAINTENANCE_TECH, Role.USER, Role.VIEWER, Role.GUEST],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true,
    resourceType: 'maintenance_requests'
  }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const isDevelopment = process.env.NODE_ENV === 'development'

      const client = req.dbClient
      if (!client) {
        logger.error('maintenance-requests: dbClient not available')
        return res.status(500).json({ error: 'Internal server error' })
      }

      const params: unknown[] = [id]
      let tenantFilter = ''

      if (isDevelopment && req.user?.tenant_id) {
        params.push(req.user.tenant_id)
        tenantFilter = `AND mr.tenant_id = $${params.length}`
      }

      const result = await client.query(
        `SELECT mr.id, mr.tenant_id, mr.request_number, mr.request_type, mr.priority,
                mr.vehicle_id, mr.asset_id, mr.title, mr.description, mr.issue_category,
                mr.requested_by, mr.driver_id, mr.requested_date, mr.scheduled_date,
                mr.completed_date, mr.assigned_to, mr.facility_id, mr.status,
                mr.work_performed, mr.parts_used, mr.labor_hours, mr.total_cost,
                mr.metadata, mr.created_at, mr.updated_at,
                CONCAT(v.year, ' ', v.make, ' ', v.model) AS vehicle_name,
                CONCAT(du.first_name, ' ', du.last_name) AS driver_name,
                f.name AS facility_name,
                CONCAT(au.first_name, ' ', au.last_name) AS assigned_to_name,
                CONCAT(ru.first_name, ' ', ru.last_name) AS requested_by_name
         FROM maintenance_requests mr
         LEFT JOIN vehicles v ON v.id = mr.vehicle_id
         LEFT JOIN drivers d ON d.id = mr.driver_id
         LEFT JOIN users du ON du.id = d.user_id
         LEFT JOIN facilities f ON f.id = mr.facility_id
         LEFT JOIN users au ON au.id = mr.assigned_to
         LEFT JOIN users ru ON ru.id = mr.requested_by
         WHERE mr.id = $1 ${tenantFilter}`,
        params
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Maintenance request not found' })
      }

      return res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('maintenance-requests: failed to fetch by id', { error })
      return res.status(500).json({ error: 'Failed to fetch maintenance request' })
    }
  }
)

export default router
