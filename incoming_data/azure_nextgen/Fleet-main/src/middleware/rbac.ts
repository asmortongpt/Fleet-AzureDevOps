/**
 * Role-Based Access Control (RBAC) Middleware
 * SECURITY (CRIT-F-003): Implements comprehensive permission checking
 * Used for both API routes and UI component rendering
 */

import { UserRole } from '@/contexts/AuthContext';
import logger from '@/utils/logger';

/**
 * Role hierarchy levels
 * Higher number = more privileges
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SuperAdmin: 5,
  Admin: 4,
  Manager: 3,
  User: 2,
  ReadOnly: 1,
};

/**
 * Permission categories and their allowed operations
 */
export const PERMISSION_CATEGORIES = {
  // Vehicle Management
  'vehicles:read': 'View vehicles',
  'vehicles:create': 'Create vehicles',
  'vehicles:update': 'Update vehicles',
  'vehicles:delete': 'Delete vehicles',
  'vehicles:*': 'All vehicle operations',

  // Driver Management
  'drivers:read': 'View drivers',
  'drivers:create': 'Create drivers',
  'drivers:update': 'Update drivers',
  'drivers:delete': 'Delete drivers',
  'drivers:*': 'All driver operations',

  // Maintenance
  'maintenance:read': 'View maintenance records',
  'maintenance:create': 'Create maintenance records',
  'maintenance:update': 'Update maintenance records',
  'maintenance:delete': 'Delete maintenance records',
  'maintenance:approve': 'Approve maintenance requests',
  'maintenance:*': 'All maintenance operations',

  // Fuel Management
  'fuel:read': 'View fuel transactions',
  'fuel:create': 'Create fuel transactions',
  'fuel:update': 'Update fuel transactions',
  'fuel:delete': 'Delete fuel transactions',
  'fuel:*': 'All fuel operations',

  // Work Orders
  'work-orders:read': 'View work orders',
  'work-orders:create': 'Create work orders',
  'work-orders:update': 'Update work orders',
  'work-orders:delete': 'Delete work orders',
  'work-orders:approve': 'Approve work orders',
  'work-orders:*': 'All work order operations',

  // Procurement
  'procurement:read': 'View procurement data',
  'procurement:create': 'Create purchase orders',
  'procurement:update': 'Update purchase orders',
  'procurement:approve': 'Approve purchase orders',
  'procurement:*': 'All procurement operations',

  // Reports
  'reports:read': 'View reports',
  'reports:create': 'Create reports',
  'reports:export': 'Export reports',
  'reports:*': 'All reporting operations',

  // Admin Functions
  'users:read': 'View users',
  'users:create': 'Create users',
  'users:update': 'Update users',
  'users:delete': 'Delete users',
  'users:*': 'All user management operations',

  'tenants:read': 'View tenant data',
  'tenants:create': 'Create tenants',
  'tenants:update': 'Update tenants',
  'tenants:delete': 'Delete tenants',
  'tenants:switch': 'Switch between tenants',
  'tenants:*': 'All tenant operations',

  'settings:read': 'View settings',
  'settings:update': 'Update settings',
  'settings:*': 'All settings operations',

  // System Administration
  'system:admin': 'System administration',
  'system:audit': 'View audit logs',
  'system:*': 'All system operations',

  // Wildcard
  '*': 'All permissions',
} as const;

export type Permission = keyof typeof PERMISSION_CATEGORIES;

/**
 * Default permissions by role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SuperAdmin: ['*'], // Full access to everything

  Admin: [
    'vehicles:*',
    'drivers:*',
    'maintenance:*',
    'fuel:*',
    'work-orders:*',
    'procurement:*',
    'reports:*',
    'users:read',
    'users:create',
    'users:update',
    'settings:*',
    'system:audit',
  ],

  Manager: [
    'vehicles:read',
    'vehicles:update',
    'drivers:read',
    'drivers:update',
    'maintenance:read',
    'maintenance:create',
    'maintenance:update',
    'maintenance:approve',
    'fuel:read',
    'fuel:create',
    'fuel:update',
    'work-orders:read',
    'work-orders:create',
    'work-orders:update',
    'work-orders:approve',
    'procurement:read',
    'procurement:create',
    'reports:read',
    'reports:create',
    'reports:export',
    'settings:read',
  ],

  User: [
    'vehicles:read',
    'drivers:read',
    'maintenance:read',
    'maintenance:create',
    'fuel:read',
    'fuel:create',
    'work-orders:read',
    'work-orders:create',
    'procurement:read',
    'reports:read',
  ],

  ReadOnly: [
    'vehicles:read',
    'drivers:read',
    'maintenance:read',
    'fuel:read',
    'work-orders:read',
    'procurement:read',
    'reports:read',
  ],
};

/**
 * Check if a role has sufficient level to access another role's data
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a role can access multiple roles
 */
export function hasAnyRoleLevel(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  const userLevel = ROLE_HIERARCHY[userRole];
  return requiredRoles.some(role => userLevel >= ROLE_HIERARCHY[role]);
}

/**
 * Check if a permission matches a required permission
 * Supports wildcard permissions (e.g., "vehicles:*" matches "vehicles:read")
 */
export function matchesPermission(userPermission: string, requiredPermission: string): boolean {
  // Exact match
  if (userPermission === requiredPermission) return true;

  // Wildcard match (*)
  if (userPermission === '*') return true;

  // Category wildcard (e.g., "vehicles:*" matches "vehicles:read")
  if (userPermission.endsWith(':*')) {
    const category = userPermission.replace(':*', '');
    return requiredPermission.startsWith(category + ':');
  }

  return false;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.some(perm => matchesPermission(perm, requiredPermission));
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(required =>
    userPermissions.some(perm => matchesPermission(perm, required))
  );
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(required =>
    userPermissions.some(perm => matchesPermission(perm, required))
  );
}

/**
 * Get effective permissions for a role (including inherited permissions)
 */
export function getEffectivePermissions(role: UserRole): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Audit log for permission checks
 */
export interface PermissionAudit {
  userId: string;
  userRole: UserRole;
  requiredPermission: string;
  granted: boolean;
  timestamp: string;
  resource?: string;
  action?: string;
}

/**
 * Log permission check for audit trail
 */
export function logPermissionCheck(audit: PermissionAudit): void {
  logger.info('[RBAC] Permission check', audit);

  // In production, send to audit log service
  if (import.meta.env.PROD) {
    // Send to backend audit log
    fetch('/api/v1/audit/permission-check', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audit),
    }).catch(error => {
      logger.error('[RBAC] Failed to log permission check', { error });
    });
  }
}

/**
 * RBAC Middleware for API requests
 * Checks if user has required role and/or permission
 */
export interface RBACCheckOptions {
  userId: string;
  userRole: UserRole;
  userPermissions: string[];
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: Permission | Permission[];
  resource?: string;
  action?: string;
}

export function checkAccess(options: RBACCheckOptions): { granted: boolean; reason?: string } {
  const {
    userId,
    userRole,
    userPermissions,
    requiredRole,
    requiredPermission,
    resource,
    action,
  } = options;

  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRole = hasAnyRoleLevel(userRole, roles);

    if (!hasRole) {
      const audit: PermissionAudit = {
        userId,
        userRole,
        requiredPermission: `role:${requiredRole}`,
        granted: false,
        timestamp: new Date().toISOString(),
        resource,
        action,
      };
      logPermissionCheck(audit);

      return {
        granted: false,
        reason: `Insufficient role. Required: ${roles.join(' or ')}, User has: ${userRole}`,
      };
    }
  }

  // Check permission requirement
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const hasPerms = hasAnyPermission(userPermissions, permissions);

    if (!hasPerms) {
      const audit: PermissionAudit = {
        userId,
        userRole,
        requiredPermission: permissions.join(' or '),
        granted: false,
        timestamp: new Date().toISOString(),
        resource,
        action,
      };
      logPermissionCheck(audit);

      return {
        granted: false,
        reason: `Insufficient permissions. Required: ${permissions.join(' or ')}`,
      };
    }
  }

  // Log successful access
  const audit: PermissionAudit = {
    userId,
    userRole,
    requiredPermission: requiredPermission ? String(requiredPermission) : 'none',
    granted: true,
    timestamp: new Date().toISOString(),
    resource,
    action,
  };
  logPermissionCheck(audit);

  return { granted: true };
}

/**
 * Express middleware factory for RBAC
 * Usage in Express routes (for reference - this is frontend code):
 *
 * router.get('/vehicles', requirePermission('vehicles:read'), async (req, res) => { ... })
 * router.post('/vehicles', requirePermission('vehicles:create'), async (req, res) => { ... })
 * router.put('/vehicles/:id', requirePermission('vehicles:update'), async (req, res) => { ... })
 * router.delete('/vehicles/:id', requireRole('Admin'), async (req, res) => { ... })
 */
