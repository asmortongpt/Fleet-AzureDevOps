import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import pool from '../config/database'

/**
 * Permission middleware for fine-grained RBAC
 * Replaces simple role-based authorization with permission checks
 */

export interface PermissionContext {
  resource?: string
  resourceId?: string
  scope?: 'own' | 'team' | 'fleet' | 'global'
  conditions?: Record<string, any>
}

// Cache for user permissions (in production, use Redis)
const permissionCache = new Map<string, Set<string>>()
const CACHE_TTL = 300000 // 5 minutes

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const cacheKey = `user:${userId}`
  const cached = permissionCache.get(cacheKey)

  if (cached) {
    return cached
  }

  try {
    const result = await pool.query(`
      SELECT DISTINCT p.name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    `, [userId])

    const permissions = new Set(result.rows.map(row => row.name))

    // Cache the permissions
    permissionCache.set(cacheKey, permissions)
    setTimeout(() => permissionCache.delete(cacheKey), CACHE_TTL)

    return permissions
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return new Set()
  }
}

/**
 * Clear permission cache for a user (call when roles change)
 */
export function clearPermissionCache(userId: string) {
  permissionCache.delete(`user:${userId}`)
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions.has(permission)
}

/**
 * Middleware to require a specific permission
 *
 * @param permission - Permission name in format "resource:verb:scope"
 * @param options - Optional context for row-level policy checks
 *
 * @example
 * router.post('/work-orders', requirePermission('work_order:create:team'), handler)
 */
export function requirePermission(
  permission: string,
  options?: {
    validateScope?: (req: AuthRequest) => Promise<boolean>
    customCheck?: (req: AuthRequest) => Promise<boolean>
  }
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    try {
      // Check if user has the permission
      const hasAccess = await hasPermission(req.user.id, permission)

      if (!hasAccess) {
        // Log failed permission check
        await logPermissionCheck({
          userId: req.user.id,
          tenantId: req.user.tenant_id,
          permission,
          granted: false,
          reason: 'Permission not granted to user role',
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || ''
        })

        return res.status(403).json({
          error: 'Insufficient permissions',
          required: permission
        })
      }

      // Run custom validation if provided
      if (options?.customCheck) {
        const customValid = await options.customCheck(req)
        if (!customValid) {
          await logPermissionCheck({
            userId: req.user.id,
            tenantId: req.user.tenant_id,
            permission,
            granted: false,
            reason: 'Custom validation failed',
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || ''
          })

          return res.status(403).json({
            error: 'Permission denied by custom validation'
          })
        }
      }

      // Run scope validation if provided
      if (options?.validateScope) {
        const scopeValid = await options.validateScope(req)
        if (!scopeValid) {
          await logPermissionCheck({
            userId: req.user.id,
            tenantId: req.user.tenant_id,
            permission,
            granted: false,
            reason: 'Scope validation failed',
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || ''
          })

          return res.status(403).json({
            error: 'Access denied: resource outside your scope'
          })
        }
      }

      // Log successful permission check
      await logPermissionCheck({
        userId: req.user.id,
        tenantId: req.user.tenant_id,
        permission,
        granted: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || ''
      })

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

/**
 * Check if resource is within user's scope
 */
export async function validateResourceScope(
  userId: string,
  resourceType: 'vehicle' | 'driver' | 'work_order' | 'route',
  resourceId: string
): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT facility_ids, team_driver_ids, team_vehicle_ids, scope_level FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return false
    }

    const user = result.rows[0]

    // Global scope can access everything (within tenant)
    if (user.scope_level === 'global') {
      return true
    }

    // Check resource-specific scope
    switch (resourceType) {
      case 'vehicle':
        if (user.scope_level === 'fleet') return true
        if (user.team_vehicle_ids && user.team_vehicle_ids.includes(resourceId)) return true
        break

      case 'driver':
        if (user.scope_level === 'fleet') return true
        if (user.team_driver_ids && user.team_driver_ids.includes(resourceId)) return true
        break

      case 'work_order':
        const woResult = await pool.query(
          'SELECT facility_id FROM work_orders WHERE id = $1',
          [resourceId]
        )
        if (woResult.rows.length > 0) {
          const facilityId = woResult.rows[0].facility_id
          if (user.facility_ids && user.facility_ids.includes(facilityId)) return true
        }
        break

      case 'route':
        const routeResult = await pool.query(
          'SELECT driver_id FROM routes WHERE id = $1',
          [resourceId]
        )
        if (routeResult.rows.length > 0) {
          const driverId = routeResult.rows[0].driver_id
          if (user.team_driver_ids && user.team_driver_ids.includes(driverId)) return true
        }
        break
    }

    return false
  } catch (error) {
    console.error('Scope validation error:', error)
    return false
  }
}

/**
 * Prevent self-approval for SoD enforcement
 */
export function preventSelfApproval(createdByField: string = 'created_by') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    try {
      const resourceId = req.params.id

      // Determine table based on URL path
      let table = ''
      if (req.path.includes('work-orders')) table = 'work_orders'
      else if (req.path.includes('purchase-orders')) table = 'purchase_orders'
      else if (req.path.includes('safety-incidents')) table = 'safety_incidents'
      else {
        return next() // Skip check if table not recognized
      }

      const result = await pool.query(
        `SELECT ${createdByField} FROM ${table} WHERE id = $1`,
        [resourceId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Resource not found' })
      }

      const createdBy = result.rows[0][createdByField]

      if (createdBy === req.user.id) {
        await logPermissionCheck({
          userId: req.user.id,
          tenantId: req.user.tenant_id,
          permission: `${table}:approve`,
          granted: false,
          reason: 'Separation of Duties: Cannot approve own record',
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || '',
          resourceId
        })

        return res.status(403).json({
          error: 'Separation of Duties violation: You cannot approve records you created'
        })
      }

      next()
    } catch (error) {
      console.error('Self-approval check error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

/**
 * Check approval limit for purchase orders
 */
export function checkApprovalLimit() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    try {
      const poId = req.params.id

      const [userResult, poResult] = await Promise.all([
        pool.query('SELECT approval_limit FROM users WHERE id = $1', [req.user.id]),
        pool.query('SELECT total FROM purchase_orders WHERE id = $1', [poId])
      ])

      if (userResult.rows.length === 0 || poResult.rows.length === 0) {
        return res.status(404).json({ error: 'Resource not found' })
      }

      const approvalLimit = parseFloat(userResult.rows[0].approval_limit) || 0
      const poTotal = parseFloat(poResult.rows[0].total) || 0

      if (poTotal > approvalLimit) {
        await logPermissionCheck({
          userId: req.user.id,
          tenantId: req.user.tenant_id,
          permission: 'purchase_order:approve',
          granted: false,
          reason: `PO total $${poTotal} exceeds approval limit $${approvalLimit}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || '',
          resourceId: poId
        })

        return res.status(403).json({
          error: `Purchase order total ($${poTotal}) exceeds your approval limit ($${approvalLimit})`,
          requires_escalation: true
        })
      }

      next()
    } catch (error) {
      console.error('Approval limit check error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

/**
 * Log permission checks for audit trail
 */
async function logPermissionCheck(entry: {
  userId: string
  tenantId: string
  permission: string
  granted: boolean
  reason?: string
  ipAddress?: string
  userAgent?: string
  resourceId?: string
}) {
  try {
    await pool.query(
      `INSERT INTO permission_check_logs
       (user_id, tenant_id, permission_name, granted, reason, ip_address, user_agent, resource_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.userId,
        entry.tenantId,
        entry.permission,
        entry.granted,
        entry.reason || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.resourceId || null
      ]
    )
  } catch (error) {
    console.error('Failed to log permission check:', error)
    // Don't throw - logging failure shouldn't block the request
  }
}

/**
 * Middleware to validate vehicle status for certain operations
 */
export function requireVehicleStatus(...allowedStatuses: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const vehicleId = req.params.id || req.body.vehicle_id

      if (!vehicleId) {
        return next() // Skip if no vehicle ID
      }

      const result = await pool.query(
        'SELECT status FROM vehicles WHERE id = $1',
        [vehicleId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' })
      }

      const status = result.rows[0].status

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: `Operation not allowed for vehicle status '${status}'`,
          allowed_statuses: allowedStatuses
        })
      }

      next()
    } catch (error) {
      console.error('Vehicle status check error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

/**
 * Rate limiting for sensitive operations (e.g., GPS tracking, video access)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const key = `${req.user.id}:${req.path}`
    const now = Date.now()
    const limit = rateLimitStore.get(key)

    if (limit && limit.resetAt > now) {
      if (limit.count >= maxRequests) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retry_after: Math.ceil((limit.resetAt - now) / 1000)
        })
      }
      limit.count++
    } else {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs
      })
    }

    next()
  }
}
