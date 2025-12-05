import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { getUserPermissions } from '../middleware/permissions'
import { z } from 'zod'

const router = express.Router()
router.use(authenticateJWT)

const permissionParamSchema = z.object({
  permission: z.string(),
})

/**
 * GET /api/permissions/me
 * Get current user's permissions and roles for frontend RBAC
 */
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const rolesResult = await pool.query(
      'SELECT r.name, r.display_name, r.description FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1 AND ur.is_active = true AND (ur.expires_at IS NULL OR ur.expires_at > NOW())',
      [req.user.id]
    )

    const permissions = await getUserPermissions(req.user.id)

    const userResult = await pool.query(
      'SELECT facility_ids, team_driver_ids, team_vehicle_ids, scope_level, approval_limit FROM users WHERE id = $1',
      [req.user.id]
    )

    const userScope = userResult.rows[0] || {}

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        tenant_id: req.user.tenant_id,
      },
      roles: rolesResult.rows,
      permissions: Array.from(permissions),
      scope: {
        level: userScope.scope_level || 'team',
        facility_ids: userScope.facility_ids || [],
        team_driver_ids: userScope.team_driver_ids || [],
        team_vehicle_ids: userScope.team_vehicle_ids || [],
        approval_limit: userScope.approval_limit || 0,
      },
    })
  } catch (error) {
    console.error('Get user permissions error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/permissions/check/:permission
 * Check if current user has a specific permission
 */
router.get('/check/:permission', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { permission } = permissionParamSchema.parse(req.params)

    const permissions = await getUserPermissions(req.user.id)
    const hasPermission = permissions.has(permission)

    res.json({
      permission,
      granted: hasPermission,
    })
  } catch (error) {
    console.error('Check permission error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/permissions/roles
 * List all available roles (admin only)
 */
router.get('/roles', async (req: AuthRequest, res: Response) => {
  try {
    const permissions = await getUserPermissions(req.user!.id)
    if (!permissions.has('role:manage:global')) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const result = await pool.query(
      'SELECT r.*, COUNT(DISTINCT ur.user_id) as user_count, COUNT(DISTINCT rp.permission_id) as permission_count FROM roles r LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true LEFT JOIN role_permissions rp ON r.id = rp.role_id GROUP BY r.id ORDER BY r.name'
    )

    res.json({ data: result.rows })
  } catch (error) {
    console.error(`List roles error:`, error)
    res.status(500).json({ error: `Internal server error` })
  }
})

export default router
