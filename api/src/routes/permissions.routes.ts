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
import logger from '../config/logger';

// Import necessary repositories
import { PermissionRepository } from '../repositories/permissionRepository';
import { UserRepository } from '../repositories/userRepository';
import { RoleRepository } from '../repositories/roleRepository';

const router = Router();

// Resolve repositories from the container
const permissionRepository = container.resolve(PermissionRepository);
const userRepository = container.resolve(UserRepository);
const roleRepository = container.resolve(RoleRepository);

/**
 * GET /api/v1/me/permissions
 * Get current user's permissions (visible modules, actions, field visibility)
 */
router.get('/me/permissions', async (req: Request, res: Response) => {
  try {
    const user = await userRepository.getUserById(req.user.id, req.user.tenant_id);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Get visible modules
    const { modules, moduleConfigs } = await permissionEngine.visibleModules(user);

    // Get user's roles from the repository
    const roles = await roleRepository.getUserRoles(user.tenant_id, user.id);

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
    logger.error('Error getting user permissions:', error);
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
    const user = await userRepository.getUserById(req.user.id, req.user.tenant_id);

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
    logger.error('Error checking permission:', error);
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
    const roles = await roleRepository.getAllRoles(req.user.tenant_id);

    res.json({
      roles
    });
  } catch (error) {
    logger.error('Error fetching roles:', error);
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
    const user = await userRepository.getUserById(req.user.id, req.user.tenant_id);
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role name is required'
      });
    }

    const newRole = await roleRepository.createRole(name, description, req.user.tenant_id);

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
    logger.error('Error creating role:', error);
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
    const user = await userRepository.getUserById(req.user.id, req.user.tenant_id);
    const roleId = parseInt(req.params.id, 10);
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role name is required'
      });
    }

    const updatedRole = await roleRepository.updateRole(roleId, name, description, req.user.tenant_id);

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
      context: { role_name: name }
    });

    res.json({
      role: updatedRole
    });
  } catch (error) {
    logger.error('Error updating role:', error);
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
    const user = await userRepository.getUserById(req.user.id, req.user.tenant_id);
    const roleId = parseInt(req.params.id, 10);

    const deletedRole = await roleRepository.deleteRole(roleId, req.user.tenant_id);

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
      severity: 'medium',
      description: `Role "${deletedRole.name}" deleted`,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      context: { role_name: deletedRole.name }
    });

    res.json({
      message: 'Role deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting role:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete role'
    });
  }
});

export default router;