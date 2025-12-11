Here's the complete refactored file with the `pool.query` replaced by the `PermissionRepository`:


/**
 * Permissions API Routes
 * Endpoints for managing user permissions, roles, and checking access
 */

import { Router, Request, Response } from 'express';
import { permissionEngine } from '../permissions/engine';
import { auditService } from '../services/auditService';
import { requireAdmin, requireRole } from '../middleware/modulePermissions';
import { User } from '../permissions/types';
import { container } from '../container';
import { csrfProtection } from '../middleware/csrf';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger'; // Wave 27: Add Winston logger

// Import the new repository
import { PermissionRepository } from '../repositories/permissionRepository';

const router = Router();

// Resolve the repository from the container
const permissionRepository = container.resolve(PermissionRepository);

/**
 * GET /api/v1/me/permissions
 * Get current user's permissions (visible modules, actions, field visibility)
 */
router.get('/me/permissions', async (req: Request, res: Response) => {
  try {
    const user = req.user as User;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Get visible modules
    const { modules, moduleConfigs } = await permissionEngine.visibleModules(user);

    // Get user's roles from the repository
    const roles = await permissionRepository.getUserRoles(user.tenant_id, user.id);

    res.json({
      user_id: user.id,
      roles,
      visible_modules: modules,
      module_configs: moduleConfigs,
      permissions: {
        can_access_admin: roles.includes('Admin'),
        can_manage_users: roles.includes('Admin'),
        can_view_financial: roles.includes('Admin') || roles.includes('Finance'),
        can_manage_maintenance: roles.includes('Admin') || roles.includes('MaintenanceManager'),
        can_view_safety_data: roles.includes('Admin') || roles.includes('Safety'),
        is_auditor: roles.includes('Auditor')
      }
    });
  } catch (error) {
    logger.error('Error getting user permissions:', error); // Wave 27: Winston logger
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve permissions'
    });
  }
});

/**
 * POST /api/v1/permissions/check
 * Check if current user can perform a specific action
 */
router.post('/check', csrfProtection, async (req: Request, res: Response) => {
  try {
    const user = req.user as User;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { action, resource, resourceType } = req.body;

    if (!action) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Action is required'
      });
    }

    const result = await permissionEngine.can(user, action, resource, { resourceType });

    res.json({
      allowed: result.allowed,
      reason: result.reason,
      conditions: result.conditions
    });
  } catch (error) {
    logger.error('Error checking permission:', error); // Wave 27: Winston logger
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check permission'
    });
  }
});

/**
 * GET /api/v1/roles
 * List all available roles (Admin only)
 */
router.get('/roles', requireAdmin, async (req: Request, res: Response) => {
  try {
    const roles = await permissionRepository.getAllRoles();

    res.json({
      roles
    });
  } catch (error) {
    logger.error('Error fetching roles:', error); // Wave 27: Winston logger
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch roles'
    });
  }
});

/**
 * POST /api/v1/roles
 * Create a new role (Admin only)
 */
router.post('/roles', csrfProtection, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role name is required'
      });
    }

    const newRole = await permissionRepository.createRole(name, description);

    // Audit log
    await auditService.logSecurityEvent({
      user_id: user.id,
      event_type: 'role.created',
      severity: 'medium',
      description: `Role "${name}" created`,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      context: { role_name: name }
    });

    res.status(201).json({
      role: newRole
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role name already exists'
      });
    }
    logger.error('Error creating role:', error); // Wave 27: Winston logger
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create role'
    });
  }
});

/**
 * PUT /api/v1/roles/:id
 * Update an existing role (Admin only)
 */
router.put('/roles/:id', csrfProtection, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const roleId = parseInt(req.params.id, 10);
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role name is required'
      });
    }

    const updatedRole = await permissionRepository.updateRole(roleId, name, description);

    if (!updatedRole) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Role not found'
      });
    }

    // Audit log
    await auditService.logSecurityEvent({
      user_id: user.id,
      event_type: 'role.updated',
      severity: 'medium',
      description: `Role "${name}" updated`,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      context: { role_id: roleId, role_name: name }
    });

    res.json({
      role: updatedRole
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role name already exists'
      });
    }
    logger.error('Error updating role:', error); // Wave 27: Winston logger
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update role'
    });
  }
});

/**
 * DELETE /api/v1/roles/:id
 * Delete a role (Admin only)
 */
router.delete('/roles/:id', csrfProtection, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const roleId = parseInt(req.params.id, 10);

    const deletedRole = await permissionRepository.deleteRole(roleId);

    if (!deletedRole) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Role not found'
      });
    }

    // Audit log
    await auditService.logSecurityEvent({
      user_id: user.id,
      event_type: 'role.deleted',
      severity: 'high',
      description: `Role "${deletedRole.name}" deleted`,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      context: { role_id: roleId, role_name: deletedRole.name }
    });

    res.json({
      message: 'Role deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting role:', error); // Wave 27: Winston logger
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete role'
    });
  }
});

export default router;


In this refactored version, I've replaced all instances of `pool.query` with calls to methods on the `PermissionRepository`. The `PermissionRepository` class would need to be implemented separately, containing methods like `getUserRoles`, `getAllRoles`, `createRole`, `updateRole`, and `deleteRole`. These methods would encapsulate the database operations previously handled by `pool.query`.

The `PermissionRepository` class would be responsible for handling the database interactions, allowing for easier testing, better separation of concerns, and potential future changes in the data access layer without affecting the route handlers.

To complete the refactoring, you would need to create the `PermissionRepository` class in the `../repositories/permissionRepository` file, implementing the necessary methods to interact with the database.