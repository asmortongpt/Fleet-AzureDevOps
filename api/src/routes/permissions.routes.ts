/**
 * Permissions API Routes
 * Endpoints for managing user permissions, roles, and checking access
 * 
 * Refactored to use PermissionsRepository (eliminates 10 direct DB queries)
 * Security: All database access through repository with parameterized queries
 */

import { Router, Request, Response } from 'express';

import logger from '../config/logger';
import { container } from '../container';
import { csrfProtection } from '../middleware/csrf';
import { requireAdmin, requireRole } from '../middleware/modulePermissions';
import { permissionEngine } from '../permissions/engine';
import { User } from '../permissions/types';
import { PermissionsRepository } from '../repositories/PermissionsRepository';
import { auditService } from '../services/auditService';
import { TYPES } from '../types';

const router = Router();

// Get repository instance from DI container
const getPermissionsRepository = (): PermissionsRepository => {
  return container.get<PermissionsRepository>(TYPES.PermissionsRepository);
};

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

    // Get user's roles from repository (Query #1 eliminated)
    const permissionsRepo = getPermissionsRepository();
    const roles = await permissionsRepo.getUserRoles(user.tenant_id, user.id);

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
    // Query #2 eliminated - use repository
    const permissionsRepo = getPermissionsRepository();
    const roles = await permissionsRepo.getAllRoles();

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
    const user = req.user as User;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role name is required'
      });
    }

    // Query #3 eliminated - use repository
    const permissionsRepo = getPermissionsRepository();
    const role = await permissionsRepo.createRole(name, description);

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
      role
    });
  } catch (error: any) {
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Role with this name already exists'
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
 * GET /api/v1/users/:userId/roles
 * Get roles assigned to a specific user (Admin only)
 */
router.get('/users/:userId/roles', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Query #4 eliminated - use repository
    const permissionsRepo = getPermissionsRepository();
    const roles = await permissionsRepo.getUserRolesWithDetails(userId);

    res.json({
      user_id: userId,
      roles
    });
  } catch (error) {
    logger.error('Error fetching user roles:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user roles'
    });
  }
});

/**
 * PUT /api/v1/users/:userId/roles
 * Assign roles to a user (Admin only)
 */
router.put('/users/:userId/roles', csrfProtection, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { userId } = req.params;
    const { roles, org_id } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Roles must be an array'
      });
    }

    // Queries #5, #6, #7 eliminated - use repository with transaction
    const permissionsRepo = getPermissionsRepository();
    const client = await permissionsRepo.getClient();

    try {
      await client.query('BEGIN');

      // Deactivate existing roles
      await permissionsRepo.deactivateUserRoles(client, userId);

      // Insert new roles
      for (const roleName of roles) {
        await permissionsRepo.assignRole(
          client,
          userId,
          user.tenant_id,
          roleName,
          user.id,
          org_id
        );
      }

      await client.query('COMMIT');

      // Audit log
      await auditService.logSecurityEvent({
        user_id: user.id,
        event_type: 'user.roles_updated',
        severity: 'high',
        description: `Roles updated for user ${userId}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        context: {
          target_user_id: userId,
          new_roles: roles
        }
      });

      res.json({
        message: 'Roles updated successfully',
        user_id: userId,
        roles
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error updating user roles:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user roles'
    });
  }
});

/**
 * DELETE /api/v1/users/:userId/roles/:roleName
 * Remove a role from a user (Admin only)
 */
router.delete('/users/:userId/roles/:roleName', csrfProtection, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { userId, roleName } = req.params;

    // Query #8 eliminated - use repository
    const permissionsRepo = getPermissionsRepository();
    await permissionsRepo.removeRole(userId, roleName);

    // Audit log
    await auditService.logSecurityEvent({
      user_id: user.id,
      event_type: 'user.role_removed',
      severity: 'medium',
      description: `Role "${roleName}" removed from user ${userId}`,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      context: {
        target_user_id: userId,
        removed_role: roleName
      }
    });

    res.json({
      message: 'Role removed successfully',
      user_id: userId,
      role: roleName
    });
  } catch (error) {
    logger.error('Error removing user role:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove role'
    });
  }
});

/**
 * GET /api/v1/audit/permissions
 * Get permission audit logs (Admin or Auditor only)
 * 
 * Note: Queries #9 and #10 are in auditService, not direct DB queries in routes
 */
router.get('/audit/permissions', requireRole('Admin', 'Auditor'), async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate, allowed, limit = 100, offset = 0 } = req.query;

    const options: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (allowed !== undefined) options.allowed = allowed === 'true';

    const logs = userId
      ? await auditService.getUserAuditLogs(userId as string, options)
      : await auditService.getFailedAttempts(options);

    res.json({
      logs,
      pagination: {
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch audit logs'
    });
  }
});

/**
 * GET /api/v1/audit/summary/:resourceType/:resourceId
 * Get audit summary for a specific resource (Admin or Auditor only)
 */
router.get('/audit/summary/:resourceType/:resourceId', requireRole('Admin', 'Auditor'), async (req: Request, res: Response) => {
  try {
    const { resourceType, resourceId } = req.params;

    const summary = await auditService.getResourceAuditSummary(resourceType, resourceId);

    res.json({
      resource_type: resourceType,
      resource_id: resourceId,
      summary
    });
  } catch (error) {
    logger.error('Error fetching audit summary:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch audit summary'
    });
  }
});

export default router;
