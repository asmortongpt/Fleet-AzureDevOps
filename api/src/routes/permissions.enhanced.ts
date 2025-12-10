import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { getUserPermissions } from '../middleware/permissions'
import { z } from 'zod'
import { csrfProtection } from '../middleware/csrf'
import { PermissionRepository } from '../repositories/PermissionRepository'
import { TYPES } from '../types'


const router = express.Router()
router.use(authenticateJWT)

const permissionParamSchema = z.object({
  permission: z.string(),
})

/**
 * GET /api/permissions/me
 * Get current user's permissions and roles for frontend RBAC
 */
router.get('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  // Get repository from DI container
  const permissionRepo = container.get<PermissionRepository>(TYPES.PermissionRepository)

  // Get user roles with tenant filtering
  const roles = await permissionRepo.getUserRoles(req.user.id, req.user.tenant_id)

  // Get user permissions via existing middleware helper
  const permissions = await getUserPermissions(req.user.id)

  // Get user scope configuration
  const userScope = await permissionRepo.getUserScope(req.user.id, req.user.tenant_id)

  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      tenant_id: req.user.tenant_id,
    },
    roles: roles.map(role => ({
      name: role.role_name,
      display_name: role.display_name,
      description: role.description,
    })),
    permissions: Array.from(permissions),
    scope: {
      level: userScope?.scope_level || 'team',
      facility_ids: userScope?.facility_ids || [],
      team_driver_ids: userScope?.team_driver_ids || [],
      team_vehicle_ids: userScope?.team_vehicle_ids || [],
      approval_limit: userScope?.approval_limit || 0,
    },
  })
}))

/**
 * GET /api/permissions/check/:permission
 * Check if current user has a specific permission
 */
router.get('/check/:permission', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const { permission } = permissionParamSchema.parse(req.params)

  // Use existing middleware helper for consistent permission checking
  const permissions = await getUserPermissions(req.user.id)
  const hasPermission = permissions.has(permission)

  res.json({
    permission,
    granted: hasPermission,
  })
}))

/**
 * GET /api/permissions/roles
 * List all available roles (admin only)
 */
router.get('/roles', asyncHandler(async (req: AuthRequest, res: Response) => {
  const permissions = await getUserPermissions(req.user!.id)
  if (!permissions.has('role:manage:global')) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  // Get repository from DI container
  const permissionRepo = container.get<PermissionRepository>(TYPES.PermissionRepository)

  // Get all roles with statistics (user count, permission count)
  const rolesWithStats = await permissionRepo.getAllRolesWithStats(req.user!.tenant_id)

  res.json({ data: rolesWithStats })
}))

export default router
