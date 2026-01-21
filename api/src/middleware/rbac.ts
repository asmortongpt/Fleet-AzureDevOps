/**
 * Role-Based Access Control (RBAC) Middleware
 * CRIT-F-003: Comprehensive RBAC implementation
 *
 * This module implements a hierarchical role-based access control system
 * with granular permissions and tenant isolation.
 *
 * Security Features:
 * - Role hierarchy: admin > manager > user > guest
 * - Permission-based route protection
 * - Tenant isolation (users can only access their own tenant's data)
 * - Audit logging for all authorization decisions
 * - Cache-based permission lookup for performance
 *
 * @module middleware/rbac
 */

import { Response, NextFunction } from 'express'

import pool from '../config/database'
import logger from '../config/logger'

import { AuthRequest } from './auth'
import { getUserPermissions, clearPermissionCache } from './permissions'

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

/**
 * Role hierarchy (higher roles inherit all permissions from lower roles)
 */
export enum Role {
  ADMIN = 'admin',
  SECURITY_ADMIN = 'security-admin',
  FLEET_MANAGER = 'fleet-manager',
  MANAGER = 'manager',
  MAINTENANCE_TECH = 'maintenance-tech',
  COMPLIANCE_OFFICER = 'compliance-officer',
  ANALYST = 'analyst',
  DRIVER = 'driver',
  USER = 'user',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

/**
 * Role hierarchy map - each role includes all lower roles
 */
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [Role.ADMIN]: [Role.ADMIN, Role.SECURITY_ADMIN, Role.FLEET_MANAGER, Role.MANAGER, Role.MAINTENANCE_TECH, Role.COMPLIANCE_OFFICER, Role.ANALYST, Role.DRIVER, Role.USER, Role.VIEWER, Role.GUEST],
  [Role.SECURITY_ADMIN]: [Role.SECURITY_ADMIN, Role.VIEWER, Role.GUEST],
  [Role.FLEET_MANAGER]: [Role.FLEET_MANAGER, Role.MANAGER, Role.MAINTENANCE_TECH, Role.ANALYST, Role.DRIVER, Role.USER, Role.VIEWER, Role.GUEST],
  [Role.MANAGER]: [Role.MANAGER, Role.USER, Role.VIEWER, Role.GUEST],
  [Role.MAINTENANCE_TECH]: [Role.MAINTENANCE_TECH, Role.VIEWER, Role.GUEST],
  [Role.COMPLIANCE_OFFICER]: [Role.COMPLIANCE_OFFICER, Role.VIEWER, Role.GUEST],
  [Role.ANALYST]: [Role.ANALYST, Role.VIEWER, Role.GUEST],
  [Role.DRIVER]: [Role.DRIVER, Role.USER, Role.VIEWER, Role.GUEST],
  [Role.USER]: [Role.USER, Role.VIEWER, Role.GUEST],
  [Role.VIEWER]: [Role.VIEWER, Role.GUEST],
  [Role.GUEST]: [Role.GUEST]
}

/**
 * Check if a user's role satisfies the required role(s)
 * Respects role hierarchy (admin can access manager routes, etc.)
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  const normalizedUserRole = userRole.toLowerCase() as Role
  const hierarchy = ROLE_HIERARCHY[normalizedUserRole] || [normalizedUserRole]

  return requiredRoles.some(required =>
    hierarchy.includes(required.toLowerCase() as Role)
  )
}

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * Standard permission format: resource:action:scope
 * Examples:
 * - vehicle:read:own
 * - vehicle:create:team
 * - vehicle:delete:global
 * - user:manage:global
 */

export const PERMISSIONS = {
  // Vehicle permissions
  VEHICLE_CREATE: 'vehicle:create',
  VEHICLE_READ: 'vehicle:read',
  VEHICLE_UPDATE: 'vehicle:update',
  VEHICLE_DELETE: 'vehicle:delete',

  // Driver permissions
  DRIVER_CREATE: 'driver:create',
  DRIVER_READ: 'driver:read',
  DRIVER_UPDATE: 'driver:update',
  DRIVER_DELETE: 'driver:delete',

  // Maintenance permissions
  MAINTENANCE_CREATE: 'maintenance:create',
  MAINTENANCE_READ: 'maintenance:read',
  MAINTENANCE_UPDATE: 'maintenance:update',
  MAINTENANCE_DELETE: 'maintenance:delete',
  MAINTENANCE_APPROVE: 'maintenance:approve',

  // Work order permissions
  WORK_ORDER_CREATE: 'work_order:create',
  WORK_ORDER_READ: 'work_order:read',
  WORK_ORDER_UPDATE: 'work_order:update',
  WORK_ORDER_DELETE: 'work_order:delete',
  WORK_ORDER_APPROVE: 'work_order:approve',

  // Report permissions
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',
  REPORT_SCHEDULE: 'report:schedule',

  // Admin permissions
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  AUDIT_VIEW: 'audit:view',
  SETTINGS_MANAGE: 'settings:manage',

  // Fuel transaction permissions
  FUEL_CREATE: 'fuel:create',
  FUEL_READ: 'fuel:read',
  FUEL_UPDATE: 'fuel:update',
  FUEL_DELETE: 'fuel:delete',

  // Document permissions
  DOCUMENT_UPLOAD: 'document:upload',
  DOCUMENT_READ: 'document:read',
  DOCUMENT_DELETE: 'document:delete',

  // Facility permissions
  FACILITY_CREATE: 'facility:create',
  FACILITY_READ: 'facility:read',
  FACILITY_UPDATE: 'facility:update',
  FACILITY_DELETE: 'facility:delete',

  // Incident permissions
  INCIDENT_CREATE: 'incident:create',
  INCIDENT_READ: 'incident:read',
  INCIDENT_UPDATE: 'incident:update',
  INCIDENT_DELETE: 'incident:delete',

  // Inspection permissions
  INSPECTION_CREATE: 'inspection:create',
  INSPECTION_READ: 'inspection:read',
  INSPECTION_UPDATE: 'inspection:update',
  INSPECTION_DELETE: 'inspection:delete',

  // Safety alert permissions
  SAFETY_ALERT_CREATE: 'safety_alert:create',
  SAFETY_ALERT_READ: 'safety_alert:read',
  SAFETY_ALERT_UPDATE: 'safety_alert:update',
  SAFETY_ALERT_DELETE: 'safety_alert:delete',
  SAFETY_METRICS_READ: 'safety_metrics:read',

  // Analytics permissions
  ANALYTICS_READ: 'analytics:read',

  // Reports permissions
  REPORTS_READ: 'reports:read'
} as const

// ============================================================================
// RBAC MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Middleware to require specific role(s)
 * Supports role hierarchy - higher roles can access lower role routes
 *
 * @param roles - Array of acceptable roles
 * @returns Express middleware function
 *
 * @example
 * router.post('/vehicles', requireRole([Role.ADMIN, Role.MANAGER]), handler)
 */
export function requireRole(roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('RBAC: No user in request (authentication required)', {
        path: req.path,
        method: req.method
      })
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const userRole = req.user.role

    if (!hasRole(userRole, roles)) {
      logger.warn('RBAC: Insufficient role', {
        userId: req.user.id,
        userRole,
        requiredRoles: roles,
        path: req.path,
        method: req.method
      })

      await logAuthorizationFailure({
        userId: req.user.id,
        tenantId: req.user.tenant_id,
        action: req.method + ' ' + req.path,
        reason: 'Insufficient role',
        requiredRoles: roles,
        userRole,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || ''
      })

      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: userRole,
        code: 'INSUFFICIENT_ROLE'
      })
    }

    logger.debug('RBAC: Role check passed', {
      userId: req.user.id,
      userRole,
      requiredRoles: roles,
      path: req.path
    })

    next()
  }
}

/**
 * Middleware to require specific permission(s)
 * More granular than role-based checks
 *
 * @param permissions - Array of required permissions (user must have at least one)
 * @param requireAll - If true, user must have ALL permissions (default: false)
 * @returns Express middleware function
 *
 * @example
 * router.delete('/vehicles/:id', requirePermission([PERMISSIONS.VEHICLE_DELETE]), handler)
 */
export function requirePermission(permissions: string[], requireAll: boolean = false) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('RBAC: No user in request (authentication required)', {
        path: req.path,
        method: req.method
      })
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    try {
      const userPermissions = await getUserPermissions(req.user.id)

      const hasRequiredPermissions = requireAll
        ? permissions.every(p => userPermissions.has(p))
        : permissions.some(p => userPermissions.has(p))

      if (!hasRequiredPermissions) {
        logger.warn('RBAC: Insufficient permissions', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermissions: permissions,
          userPermissions: Array.from(userPermissions),
          requireAll,
          path: req.path,
          method: req.method
        })

        await logAuthorizationFailure({
          userId: req.user.id,
          tenantId: req.user.tenant_id,
          action: req.method + ' ' + req.path,
          reason: 'Insufficient permissions',
          requiredPermissions: permissions,
          userPermissions: Array.from(userPermissions),
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || ''
        })

        return res.status(403).json({
          error: 'Insufficient permissions',
          required: permissions,
          code: 'INSUFFICIENT_PERMISSIONS'
        })
      }

      logger.debug('RBAC: Permission check passed', {
        userId: req.user.id,
        requiredPermissions: permissions,
        path: req.path
      })

      next()
    } catch (error) {
      logger.error('RBAC: Permission check failed', {
        error,
        userId: req.user.id,
        permissions
      })
      return res.status(500).json({
        error: 'Internal server error',
        code: 'PERMISSION_CHECK_FAILED'
      })
    }
  }
}

/**
 * Middleware to enforce tenant isolation
 * Ensures users can only access resources within their tenant
 *
 * @param resourceType - Type of resource being accessed
 * @returns Express middleware function
 *
 * @example
 * router.get('/vehicles', requireTenantIsolation('vehicle'), handler)
 */
export function requireTenantIsolation(resourceType?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    // Admin users bypass tenant isolation (they can access all tenants)
    if (req.user.role === Role.ADMIN) {
      return next()
    }

    // For list endpoints, add tenant_id filter to query
    if (req.method === 'GET' && !req.params.id) {
      // Modify query to include tenant filter
      req.query.tenant_id = req.user.tenant_id
      logger.debug('RBAC: Added tenant filter to query', {
        userId: req.user.id,
        tenantId: req.user.tenant_id,
        resourceType
      })
      return next()
    }

    // For individual resource access, verify tenant ownership
    if (req.params.id) {
      try {
        const resourceId = req.params.id
        const tenantOwned = await verifyTenantOwnership(
          req.user.tenant_id,
          resourceType || 'unknown',
          resourceId
        )

        if (!tenantOwned) {
          logger.warn('RBAC: Tenant isolation violation attempt', {
            userId: req.user.id,
            userTenantId: req.user.tenant_id,
            resourceType,
            resourceId,
            path: req.path
          })

          await logAuthorizationFailure({
            userId: req.user.id,
            tenantId: req.user.tenant_id,
            action: req.method + ' ' + req.path,
            reason: 'Tenant isolation violation',
            resourceType,
            resourceId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || ''
          })

          // Return 404 instead of 403 to prevent information disclosure
          return res.status(404).json({
            error: resourceType + ' not found',
            code: 'NOT_FOUND'
          })
        }

        next()
      } catch (error) {
        logger.error('RBAC: Tenant isolation check failed', {
          error,
          userId: req.user.id,
          resourceType,
          resourceId: req.params.id
        })
        return res.status(500).json({
          error: 'Internal server error',
          code: 'TENANT_CHECK_FAILED'
        })
      }
    } else {
      next()
    }
  }
}

/**
 * Combined middleware for complete RBAC protection
 * Enforces: authentication + role + permissions + tenant isolation
 *
 * @param config - RBAC configuration
 * @returns Express middleware function
 *
 * @example
 * router.post('/vehicles',
 *   requireRBAC({
 *     roles: [Role.ADMIN, Role.MANAGER],
 *     permissions: [PERMISSIONS.VEHICLE_CREATE],
 *     enforceIsolation: true,
 *     resourceType: 'vehicle'
 *   }),
 *   handler
 * )
 */
export function requireRBAC(config: {
  roles?: string[]
  permissions?: string[]
  requireAllPermissions?: boolean
  enforceTenantIsolation?: boolean
  resourceType?: string
}) {
  const middlewares: any[] = []

  // Add role check if roles specified
  if (config.roles && config.roles.length > 0) {
    middlewares.push(requireRole(config.roles))
  }

  // Add permission check if permissions specified
  if (config.permissions && config.permissions.length > 0) {
    middlewares.push(requirePermission(config.permissions, config.requireAllPermissions))
  }

  // Add tenant isolation if enabled
  if (config.enforceTenantIsolation) {
    middlewares.push(requireTenantIsolation(config.resourceType))
  }

  // Return combined middleware
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Execute middlewares in sequence
      for (const middleware of middlewares) {
        // Wrap middleware to support async execution
        await new Promise<void>((resolve, reject) => {
          middleware(req, res, (err: any) => {
            if (err) return reject(err)
            // If response headers are sent, stop execution
            if (res.headersSent) return resolve()
            resolve()
          })
        })

        // If response headers are sent, stop execution chain
        if (res.headersSent) return
      }

      // If we got here and headers aren't sent, proceed to next handler
      if (!res.headersSent) {
        next()
      }
    } catch (error) {
      next(error)
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify if a resource belongs to a tenant
 */
async function verifyTenantOwnership(
  tenantId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // Map resource types to table names
  const tableMap: Record<string, string> = {
    'vehicle': 'vehicles',
    'driver': 'drivers',
    'work_order': 'work_orders',
    'route': 'routes',
    'document': 'documents',
    'fuel_transaction': 'fuel_transactions',
    'maintenance': 'maintenance_records',
    'part': 'parts',
    'vendor': 'vendors',
    'invoice': 'invoices',
    'task': 'tasks',
    'team': 'teams',
    'user': 'users'
  }

  const tableName = tableMap[resourceType]

  if (!tableName) {
    logger.warn('RBAC: Unknown resource type for tenant verification: ' + resourceType)
    return false
  }

  try {
    // Check if resource exists and belongs to tenant
    // Use parameterized query for safety (table name is internal/safe)
    const query = 'SELECT 1 FROM ' + tableName + ' WHERE id = $1 AND tenant_id = $2'
    const result = await pool.query(query, [resourceId, tenantId])

    return result.rows.length > 0
  } catch (error) {
    logger.error('Error verifying tenant ownership', {
      error, tenantId, resourceType, resourceId
    })
    return false
  }
}

/**
 * Log authorization failures for audit purposes
 */
async function logAuthorizationFailure(details: {
  userId: string
  tenantId: string
  action: string
  reason: string
  requiredRoles?: string[]
  userRole?: string
  requiredPermissions?: string[]
  userPermissions?: string[]
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs
       (user_id, tenant_id, action, resource_type, resource_id, status, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        details.userId,
        details.tenantId,
        details.action,
        details.resourceType || 'authorization',
        details.resourceId || null,
        'denied',
        JSON.stringify({
          reason: details.reason,
          requiredRoles: details.requiredRoles,
          userRole: details.userRole,
          requiredPermissions: details.requiredPermissions,
          userPermissions: details.userPermissions
        }),
        details.ipAddress || null,
        details.userAgent || null
      ]
    )
  } catch (error) {
    logger.error('Failed to log authorization failure', { error, details })
  }
}

/**
 * Get schema for a configuration key
 */
async function getSchema(key: string): Promise<any> {
  try {
    const result = await pool.query(
      `SELECT schema FROM configuration_schemas WHERE key = $1`,
      [key]
    )
    return result.rows[0]?.schema || null
  } catch (error) {
    logger.error('Error getting schema', { error, key })
    return null
  }
}

// Export helper functions for testing
export { verifyTenantOwnership, logAuthorizationFailure, clearPermissionCache }
