To refactor the given code and replace `pool.query` with a repository pattern, we'll need to create a new repository class and update the existing code to use it. Here's the complete refactored file:


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

export default router;


To complete this refactoring, you'll need to create a new file for the `PermissionRepository` class. Here's an example of what that file might look like:


// File: src/repositories/permissionRepository.ts

import { injectable } from 'inversify';
import pool from '../db';

@injectable()
export class PermissionRepository {
  async getUserRoles(tenantId: string, userId: string): Promise<string[]> {
    const result = await pool.query(
      `SELECT role_name
       FROM user_module_roles
       WHERE tenant_id = $1 AND user_id = $2
       AND is_active = true
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [tenantId, userId]
    );

    return result.rows.map(row => row.role_name);
  }

  async getAllRoles(): Promise<any[]> {
    const result = await pool.query(
      `SELECT name, description, is_system, created_at, updated_at
       FROM module_roles
       ORDER BY name`
    );

    return result.rows;
  }

  async createRole(name: string, description: string | null): Promise<any> {
    const result = await pool.query(
      `INSERT INTO module_roles (name, description, is_system)
       VALUES ($1, $2, false)
       RETURNING *`,
      [name, description]
    );

    return result.rows[0];
  }
}


This refactoring replaces all instances of `pool.query` with methods from the `PermissionRepository` class. The repository class encapsulates the database operations, making the code more modular and easier to maintain. 

Remember to update your dependency injection container to include the new `PermissionRepository` class. For example, in your container setup file:


// File: src/container.ts

import { Container } from 'inversify';
import { PermissionRepository } from './repositories/permissionRepository';

const container = new Container();

container.bind<PermissionRepository>(PermissionRepository).toSelf().inSingletonScope();

export { container };


This refactoring improves the separation of concerns and makes the code more testable and maintainable.