To refactor the given code and replace `pool.query` with a repository pattern, we'll need to create a new repository class and update the existing code to use it. Here's the complete refactored file:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { getUserPermissions } from '../middleware/permissions';
import { csrfProtection } from '../middleware/csrf';

// Import the new repository
import { PermissionsRepository } from '../repositories/permissions-repository';

const router = express.Router();
router.use(authenticateJWT);

// Create an instance of the repository
const permissionsRepository = new PermissionsRepository();

/**
 * GET /api/permissions/me
 * Get current user's permissions and roles for frontend RBAC
 */
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's roles
    const roles = await permissionsRepository.getUserRoles(req.user.id);

    // Get user's permissions
    const permissions = await getUserPermissions(req.user.id);

    // Get user's scope information
    const userScope = await permissionsRepository.getUserScope(req.user.id);

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        tenant_id: req.user.tenant_id
      },
      roles,
      permissions: Array.from(permissions),
      scope: {
        level: userScope.scope_level || 'team',
        facility_ids: userScope.facility_ids || [],
        team_driver_ids: userScope.team_driver_ids || [],
        team_vehicle_ids: userScope.team_vehicle_ids || [],
        approval_limit: userScope.approval_limit || 0
      }
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/permissions/check/:permission
 * Check if current user has a specific permission
 */
router.get('/check/:permission', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const permissions = await getUserPermissions(req.user.id);
    const hasPermission = permissions.has(req.params.permission);

    res.json({
      permission: req.params.permission,
      granted: hasPermission
    });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/permissions/roles
 * List all available roles (admin only)
 */
router.get('/roles', async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has permission to view roles
    const permissions = await getUserPermissions(req.user!.id);
    if (!permissions.has('role:manage:global')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const roles = await permissionsRepository.getAllRoles();

    res.json({ data: roles });
  } catch (error) {
    console.error('List roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/permissions/roles/:roleId/permissions
 * Get all permissions for a specific role (admin only)
 */
router.get('/roles/:roleId/permissions', async (req: AuthRequest, res: Response) => {
  try {
    const permissions = await getUserPermissions(req.user!.id);
    if (!permissions.has('role:manage:global')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const rolePermissions = await permissionsRepository.getRolePermissions(req.params.roleId);

    res.json({ data: rolePermissions });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


Now, we need to create the `PermissionsRepository` class. Here's an example implementation:


// File: src/repositories/permissions-repository.ts

import { pool } from '../database';

export class PermissionsRepository {
  async getUserRoles(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT r.name, r.display_name, r.description
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1
       AND ur.is_active = true
       AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
      [userId]
    );
    return result.rows;
  }

  async getUserScope(userId: number): Promise<any> {
    const result = await pool.query(
      `SELECT facility_ids, team_driver_ids, team_vehicle_ids, scope_level, approval_limit
       FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0] || {};
  }

  async getAllRoles(): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         r.*,
         COUNT(DISTINCT ur.user_id) as user_count,
         COUNT(DISTINCT rp.permission_id) as permission_count
       FROM roles r
       LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       GROUP BY r.id
       ORDER BY r.name`
    );
    return result.rows;
  }

  async getRolePermissions(roleId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT p.*, rp.conditions
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.resource, p.verb, p.scope`,
      [roleId]
    );
    return result.rows;
  }
}


This refactored version replaces all `pool.query` calls with methods from the `PermissionsRepository` class. The repository encapsulates the database operations, making the code more modular and easier to maintain. 

Note that you'll need to create the `permissions-repository.ts` file in the `src/repositories` directory (or adjust the import path as needed) and ensure that the `pool` import is correctly set up in that file.

Also, make sure to update any dependency injection or container configuration if you're using those in your project to include the new `PermissionsRepository` class.