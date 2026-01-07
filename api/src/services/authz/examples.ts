/**
 * Authorization Service - Usage Examples
 *
 * Practical examples showing how to integrate the Authorization Service
 * into your Fleet Management application.
 *
 * @module services/authz/examples
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

import { AuthorizationService, AuthContext } from './AuthorizationService';

// ============================================================================
// Setup and Initialization
// ============================================================================

/**
 * Example 1: Initialize Authorization Service
 */
export function initializeAuthzService() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: 2,
    max: 10
  });

  const authzService = new AuthorizationService(
    pool,
    true, // Enable caching
    process.env.REDIS_URL
  );

  return authzService;
}

// ============================================================================
// Express Middleware Examples
// ============================================================================

/**
 * Example 2: Simple Permission Middleware
 */
export function requirePermission(
  authzService: AuthorizationService,
  permission: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const granted = await authzService.hasPermission(userId, permission);

      if (!granted) {
        return res.status(403).json({
          error: 'Permission denied',
          permission
        });
      }

      next();
    } catch (error) {
      console.error('Authorization check failed:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Example 3: Context-Aware Permission Middleware
 */
export function requirePermissionWithContext(
  authzService: AuthorizationService,
  permission: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decision = await authzService.checkPermission(
        userId,
        permission,
        req.body, // Resource context
        {
          attributes: {
            tenantId: req.user.tenantId,
            teamIds: req.user.teamIds || [],
            fleetIds: req.user.fleetIds || []
          },
          environment: {
            ipAddress: req.ip || '0.0.0.0',
            userAgent: req.headers['user-agent'] || 'unknown',
            deviceId: req.headers['x-device-id'] as string
          }
        }
      );

      if (!decision.granted) {
        return res.status(403).json({
          error: 'Permission denied',
          reason: decision.reason,
          permission
        });
      }

      // Attach decision to request for audit logging
      (req as any).authzDecision = decision;
      next();
    } catch (error) {
      console.error('Authorization check failed:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Example 4: Resource-Specific Permission Check
 */
export function requireResourcePermission(
  authzService: AuthorizationService,
  permission: string,
  resourceGetter: (req: Request) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get the resource
      const resource = await resourceGetter(req);
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const decision = await authzService.checkPermission(
        userId,
        permission,
        resource,
        {
          environment: {
            ipAddress: req.ip || '0.0.0.0',
            userAgent: req.headers['user-agent'] || 'unknown'
          }
        }
      );

      if (!decision.granted) {
        return res.status(403).json({
          error: 'Permission denied',
          reason: decision.reason,
          resourceId: resource.id
        });
      }

      // Attach resource to request
      (req as any).resource = resource;
      (req as any).authzDecision = decision;
      next();
    } catch (error) {
      console.error('Authorization check failed:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

// ============================================================================
// Route Handler Examples
// ============================================================================

/**
 * Example 5: Vehicle CRUD with Authorization
 */
export class VehicleController {
  constructor(private authzService: AuthorizationService) {}

  /**
   * GET /api/vehicles - List vehicles with scope filtering
   */
  async listVehicles(req: Request, res: Response) {
    const userId = req.user!.id;

    // Check what scope the user can view
    const permissions = await this.authzService.checkMultiplePermissions(
      userId,
      [
        'vehicle:view:own',
        'vehicle:view:team',
        'vehicle:view:fleet',
        'vehicle:view:global'
      ]
    );

    let scope: string;
    if (permissions.get('vehicle:view:global')) {
      scope = 'global';
    } else if (permissions.get('vehicle:view:fleet')) {
      scope = 'fleet';
    } else if (permissions.get('vehicle:view:team')) {
      scope = 'team';
    } else if (permissions.get('vehicle:view:own')) {
      scope = 'own';
    } else {
      return res.status(403).json({ error: 'No view permissions' });
    }

    // Fetch vehicles based on scope
    const vehicles = await this.getVehiclesByScope(userId, scope);

    res.json({ vehicles, scope });
  }

  /**
   * POST /api/vehicles - Create vehicle
   */
  async createVehicle(req: Request, res: Response) {
    const userId = req.user!.id;

    const granted = await this.authzService.hasPermission(
      userId,
      'vehicle:create:global'
    );

    if (!granted) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Create vehicle
    const vehicle = await this.createVehicleInDatabase(req.body);

    res.status(201).json({ vehicle });
  }

  /**
   * PUT /api/vehicles/:id - Update vehicle
   */
  async updateVehicle(req: Request, res: Response) {
    const userId = req.user!.id;
    const vehicleId = req.params.id;

    // Get vehicle to check scope
    const vehicle = await this.getVehicleById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const decision = await this.authzService.checkPermission(
      userId,
      'vehicle:update:team',
      vehicle
    );

    if (!decision.granted) {
      return res.status(403).json({
        error: 'Permission denied',
        reason: decision.reason
      });
    }

    // Update vehicle
    const updated = await this.updateVehicleInDatabase(vehicleId, req.body);

    res.json({ vehicle: updated });
  }

  /**
   * DELETE /api/vehicles/:id - Delete vehicle
   */
  async deleteVehicle(req: Request, res: Response) {
    const userId = req.user!.id;
    const vehicleId = req.params.id;

    const granted = await this.authzService.hasPermission(
      userId,
      'vehicle:delete:global'
    );

    if (!granted) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await this.deleteVehicleFromDatabase(vehicleId);

    res.status(204).send();
  }

  // Mock database methods (replace with actual implementation)
  private async getVehiclesByScope(userId: string, scope: string): Promise<any[]> {
    return [];
  }

  private async getVehicleById(id: string): Promise<any> {
    return null;
  }

  private async createVehicleInDatabase(data: any): Promise<any> {
    return {};
  }

  private async updateVehicleInDatabase(id: string, data: any): Promise<any> {
    return {};
  }

  private async deleteVehicleFromDatabase(id: string): Promise<void> {}
}

// ============================================================================
// Admin Functions Examples
// ============================================================================

/**
 * Example 6: Role Management
 */
export class RoleManagementController {
  constructor(private authzService: AuthorizationService) {}

  /**
   * POST /api/admin/users/:userId/roles - Assign role to user
   */
  async assignRole(req: Request, res: Response) {
    const adminUserId = req.user!.id;
    const { userId } = req.params;
    const { roleId, expiresAt } = req.body;

    // Check if admin has permission to manage roles
    const canManage = await this.authzService.hasPermission(
      adminUserId,
      'role:manage:global'
    );

    if (!canManage) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    try {
      await this.authzService.assignRole(
        userId,
        roleId,
        adminUserId,
        expiresAt ? new Date(expiresAt) : undefined
      );

      res.json({ success: true, message: 'Role assigned successfully' });
    } catch (error: any) {
      if (error.name === 'RoleAssignmentError') {
        return res.status(400).json({
          error: error.message,
          details: error.details
        });
      }
      throw error;
    }
  }

  /**
   * DELETE /api/admin/users/:userId/roles/:roleId - Revoke role
   */
  async revokeRole(req: Request, res: Response) {
    const adminUserId = req.user!.id;
    const { userId, roleId } = req.params;

    const canManage = await this.authzService.hasPermission(
      adminUserId,
      'role:manage:global'
    );

    if (!canManage) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await this.authzService.revokeRole(userId, roleId, adminUserId);

    res.json({ success: true, message: 'Role revoked successfully' });
  }

  /**
   * GET /api/admin/users/:userId/roles - Get user roles
   */
  async getUserRoles(req: Request, res: Response) {
    const adminUserId = req.user!.id;
    const { userId } = req.params;

    const canView = await this.authzService.hasPermission(
      adminUserId,
      'user:manage:global'
    );

    if (!canView) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const roles = await this.authzService.getUserRoles(userId);

    res.json({ roles });
  }
}

// ============================================================================
// Batch Operations Examples
// ============================================================================

/**
 * Example 7: Batch Permission Checks for UI State
 */
export async function getUserCapabilities(
  authzService: AuthorizationService,
  userId: string
) {
  const permissions = await authzService.checkMultiplePermissions(userId, [
    // Vehicle permissions
    'vehicle:view:fleet',
    'vehicle:create:global',
    'vehicle:update:fleet',
    'vehicle:delete:global',
    'vehicle:assign:fleet',

    // Driver permissions
    'driver:view:fleet',
    'driver:create:global',
    'driver:update:global',
    'driver:certify:global',

    // Work order permissions
    'work_order:view:fleet',
    'work_order:create:fleet',
    'work_order:approve:fleet',

    // Admin permissions
    'user:manage:global',
    'role:manage:global',
    'audit_log:view:global'
  ]);

  return {
    vehicles: {
      canView: permissions.get('vehicle:view:fleet'),
      canCreate: permissions.get('vehicle:create:global'),
      canUpdate: permissions.get('vehicle:update:fleet'),
      canDelete: permissions.get('vehicle:delete:global'),
      canAssign: permissions.get('vehicle:assign:fleet')
    },
    drivers: {
      canView: permissions.get('driver:view:fleet'),
      canCreate: permissions.get('driver:create:global'),
      canUpdate: permissions.get('driver:update:global'),
      canCertify: permissions.get('driver:certify:global')
    },
    workOrders: {
      canView: permissions.get('work_order:view:fleet'),
      canCreate: permissions.get('work_order:create:fleet'),
      canApprove: permissions.get('work_order:approve:fleet')
    },
    admin: {
      canManageUsers: permissions.get('user:manage:global'),
      canManageRoles: permissions.get('role:manage:global'),
      canViewAuditLog: permissions.get('audit_log:view:global')
    }
  };
}

// ============================================================================
// Cache Optimization Examples
// ============================================================================

/**
 * Example 8: Warm Cache on User Login
 */
export async function handleUserLogin(
  authzService: AuthorizationService,
  userId: string
) {
  // Warm cache with common permissions
  await authzService.warmCache(userId);

  // Get user capabilities for initial UI state
  const capabilities = await getUserCapabilities(authzService, userId);

  return capabilities;
}

/**
 * Example 9: Invalidate Cache on Role Change
 */
export async function handleRoleChange(
  authzService: AuthorizationService,
  userId: string,
  roleId: string,
  action: 'assign' | 'revoke',
  performedBy: string
) {
  if (action === 'assign') {
    await authzService.assignRole(userId, roleId, performedBy);
  } else {
    await authzService.revokeRole(userId, roleId, performedBy);
  }

  // Invalidate user's cache
  await authzService.invalidateUserCache(userId);

  // Optionally warm cache immediately
  await authzService.warmCache(userId);
}

// ============================================================================
// Policy Evaluation Examples
// ============================================================================

/**
 * Example 10: Time-Based Access Control
 */
export async function checkBusinessHoursAccess(
  authzService: AuthorizationService,
  userId: string,
  action: string,
  resource: any
) {
  const context: Partial<AuthContext> = {
    attributes: {},
    environment: {
      timestamp: new Date(),
      ipAddress: '0.0.0.0',
      userAgent: 'internal'
    }
  };

  const decision = await authzService.evaluatePolicy(
    userId,
    action,
    resource,
    context as AuthContext
  );

  return decision.effect === 'allow';
}

/**
 * Example 11: Geofenced Operations
 */
export async function checkLocationBasedAccess(
  authzService: AuthorizationService,
  userId: string,
  action: string,
  resource: any,
  userLocation: { lat: number; lon: number }
) {
  const context: Partial<AuthContext> = {
    attributes: {},
    environment: {
      timestamp: new Date(),
      ipAddress: '0.0.0.0',
      userAgent: 'mobile',
      geolocation: userLocation
    }
  };

  const decision = await authzService.evaluatePolicy(
    userId,
    action,
    resource,
    context as AuthContext
  );

  return decision.effect === 'allow';
}

// ============================================================================
// Error Handling Examples
// ============================================================================

/**
 * Example 12: Comprehensive Error Handling
 */
export async function safePermissionCheck(
  authzService: AuthorizationService,
  userId: string,
  permission: string,
  resource?: any
) {
  try {
    const decision = await authzService.checkPermission(
      userId,
      permission,
      resource
    );

    return {
      granted: decision.granted,
      reason: decision.reason,
      evaluationTime: decision.evaluationTimeMs,
      cached: decision.cacheHit
    };
  } catch (error: any) {
    if (error.name === 'PermissionDeniedError') {
      return {
        granted: false,
        reason: error.message,
        error: 'PERMISSION_DENIED'
      };
    }

    if (error.name === 'AuthorizationError') {
      console.error('Authorization error:', error);
      return {
        granted: false,
        reason: 'Authorization check failed',
        error: error.code
      };
    }

    // Unknown error - deny by default
    console.error('Unexpected error during authorization:', error);
    return {
      granted: false,
      reason: 'Internal error',
      error: 'INTERNAL_ERROR'
    };
  }
}

// ============================================================================
// Audit and Monitoring Examples
// ============================================================================

/**
 * Example 13: Audit Trail Query
 */
export async function getRecentPermissionDenials(
  pool: Pool,
  userId?: string,
  hours: number = 24
) {
  const query = `
    SELECT
      user_id,
      permission_name,
      resource_type,
      resource_id,
      reason,
      ip_address,
      created_at
    FROM permission_check_logs
    WHERE granted = false
      AND created_at > NOW() - INTERVAL '${hours} hours'
      ${userId ? 'AND user_id = $1' : ''}
    ORDER BY created_at DESC
    LIMIT 100
  `;

  const result = await pool.query(
    query,
    userId ? [userId] : []
  );

  return result.rows;
}

/**
 * Example 14: Permission Usage Analytics
 */
export async function getPermissionUsageStats(
  pool: Pool,
  startDate: Date,
  endDate: Date
) {
  const query = `
    SELECT
      permission_name,
      COUNT(*) as total_checks,
      COUNT(*) FILTER (WHERE granted) as grants,
      COUNT(*) FILTER (WHERE NOT granted) as denials,
      COUNT(DISTINCT user_id) as unique_users,
      AVG(
        EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY user_id, permission_name ORDER BY created_at))) * 1000
      ) as avg_time_between_checks_ms
    FROM permission_check_logs
    WHERE created_at BETWEEN $1 AND $2
    GROUP BY permission_name
    ORDER BY total_checks DESC
  `;

  const result = await pool.query(query, [startDate, endDate]);

  return result.rows;
}

// ============================================================================
// Express Router Setup Example
// ============================================================================

/**
 * Example 15: Complete Express Router with Authorization
 */
export function createVehicleRouter(authzService: AuthorizationService) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const router = require('express').Router();
  const controller = new VehicleController(authzService);

  // List vehicles (scoped)
  router.get('/vehicles',
    requirePermission(authzService, 'vehicle:view:own'),
    (req: Request, res: Response) => controller.listVehicles(req, res)
  );

  // Create vehicle
  router.post('/vehicles',
    requirePermission(authzService, 'vehicle:create:global'),
    (req: Request, res: Response) => controller.createVehicle(req, res)
  );

  // Update vehicle
  router.put('/vehicles/:id',
    requirePermissionWithContext(authzService, 'vehicle:update:team'),
    (req: Request, res: Response) => controller.updateVehicle(req, res)
  );

  // Delete vehicle
  router.delete('/vehicles/:id',
    requirePermission(authzService, 'vehicle:delete:global'),
    (req: Request, res: Response) => controller.deleteVehicle(req, res)
  );

  return router;
}

// ============================================================================
// Export all examples
// ============================================================================

export default {
  initializeAuthzService,
  requirePermission,
  requirePermissionWithContext,
  requireResourcePermission,
  VehicleController,
  RoleManagementController,
  getUserCapabilities,
  handleUserLogin,
  handleRoleChange,
  checkBusinessHoursAccess,
  checkLocationBasedAccess,
  safePermissionCheck,
  getRecentPermissionDenials,
  getPermissionUsageStats,
  createVehicleRouter
};
