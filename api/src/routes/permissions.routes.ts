/**
 * Permissions API Routes
 * Endpoints for managing user permissions, roles, and checking access
 */

import { Router, Request, Response } from 'express';
import { permissionEngine } from '../permissions/engine';
import { auditService } from '../services/auditService';
import { requireAdmin, requireRole } from '../middleware/modulePermissions';
import { User } from '../permissions/types';
import pool from '../db';

const router = Router();

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

    // Get user's roles from database
    const rolesResult = await pool.query(
      `SELECT role_name
       FROM user_module_roles
       WHERE user_id = $1
       AND is_active = true
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [user.id]
    );

    const roles = rolesResult.rows.map(row => row.role_name);

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
    console.error('Error getting user permissions:', error);
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
router.post('/check', async (req: Request, res: Response) => {
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
    console.error('Error checking permission:', error);
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
    const result = await pool.query(
      `SELECT name, description, is_system, created_at, updated_at
       FROM module_roles
       ORDER BY name`
    );

    res.json({
      roles: result.rows
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
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
router.post('/roles', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Role name is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO module_roles (name, description, is_system)
       VALUES ($1, $2, false)
       RETURNING *`,
      [name, description || null]
    );

    // Audit log
    await auditService.logSecurityEvent({
      user_id: user.id,
      event_type: 'role.created',
      severity: 'medium',
      description: 'Role '${name}' created`,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      context: { role_name: name }
    });

    res.status(201).json({
      role: result.rows[0]
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'Role with this name already exists'
      });
    }

    console.error('Error creating role:', error);
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

    const result = await pool.query(
      `SELECT
         umr.id,
         umr.role_name,
         umr.org_id,
         umr.granted_at,
         umr.granted_by,
         umr.expires_at,
         umr.is_active,
         mr.description
       FROM user_module_roles umr
       JOIN module_roles mr ON umr.role_name = mr.name
       WHERE umr.user_id = $1
       ORDER BY umr.granted_at DESC`,
      [userId]
    );

    res.json({
      user_id: userId,
      roles: result.rows
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
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
router.put('/users/:userId/roles', requireAdmin, async (req: Request, res: Response) => {
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

    // Start transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Deactivate existing roles
      await client.query(
        `UPDATE user_module_roles
         SET is_active = false
         WHERE user_id = $1',
        [userId]
      );

      // Insert new roles
      for (const roleName of roles) {
        await client.query(
          `INSERT INTO user_module_roles (user_id, role_name, org_id, granted_by, granted_at, is_active)
           VALUES ($1, $2, $3, $4, NOW(), true)
           ON CONFLICT (user_id, role_name)
           DO UPDATE SET is_active = true, granted_by = $4, granted_at = NOW()`,
          [userId, roleName, org_id || null, user.id]
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
    console.error('Error updating user roles:', error);
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
router.delete('/users/:userId/roles/:roleName', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { userId, roleName } = req.params;

    await pool.query(
      `UPDATE user_module_roles
       SET is_active = false
       WHERE user_id = $1 AND role_name = $2',
      [userId, roleName]
    );

    // Audit log
    await auditService.logSecurityEvent({
      user_id: user.id,
      event_type: 'user.role_removed',
      severity: 'medium',
      description: 'Role '${roleName}' removed from user ${userId}`,
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
    console.error('Error removing user role:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove role'
    });
  }
});

/**
 * GET /api/v1/audit/permissions
 * Get permission audit logs (Admin or Auditor only)
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
    console.error('Error fetching audit logs:', error);
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
    console.error('Error fetching audit summary:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch audit summary'
    });
  }
});

export default router;
