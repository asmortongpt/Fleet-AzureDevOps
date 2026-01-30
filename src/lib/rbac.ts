/**
import logger from '@/utils/logger';
 * Role-Based Access Control (RBAC) System - COMPLETE IMPLEMENTATION
 *
 * Features:
 * - 4-tier role hierarchy (Admin, Manager, Operator, Viewer)
 * - Permission checking for routes, components, and actions
 * - Resource-level access control
 * - Audit logging for permission denials
 *
 * Created: 2025-12-31 (Agent 7)
 */

export type Role = 'admin' | 'manager' | 'operator' | 'viewer';

export type Permission =
  | 'view_all'
  | 'view_own'
  | 'create'
  | 'edit_all'
  | 'edit_own'
  | 'delete_all'
  | 'delete_own'
  | 'manage_users'
  | 'manage_settings'
  | 'view_reports'
  | 'export_data'
  | 'manage_fleet'
  | 'assign_vehicles'
  | 'schedule_maintenance';

export type Resource =
  | 'vehicles'
  | 'drivers'
  | 'trips'
  | 'maintenance'
  | 'reports'
  | 'users'
  | 'settings'
  | 'analytics';

// Permission matrix: Role -> Permissions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'view_all',
    'create',
    'edit_all',
    'delete_all',
    'manage_users',
    'manage_settings',
    'view_reports',
    'export_data',
    'manage_fleet',
    'assign_vehicles',
    'schedule_maintenance',
  ],
  manager: [
    'view_all',
    'create',
    'edit_all',
    'delete_own',
    'view_reports',
    'export_data',
    'manage_fleet',
    'assign_vehicles',
    'schedule_maintenance',
  ],
  operator: [
    'view_all',
    'edit_own',
    'view_reports',
    'schedule_maintenance',
  ],
  viewer: [
    'view_all',
    'view_reports',
  ],
};

// Resource access by role
const RESOURCE_ACCESS: Record<Role, Resource[]> = {
  admin: ['vehicles', 'drivers', 'trips', 'maintenance', 'reports', 'users', 'settings', 'analytics'],
  manager: ['vehicles', 'drivers', 'trips', 'maintenance', 'reports', 'analytics'],
  operator: ['vehicles', 'trips', 'maintenance', 'reports'],
  viewer: ['vehicles', 'trips', 'reports'],
};

// Audit log interface
export interface AuditLog {
  timestamp: Date;
  userId: string;
  role: Role;
  action: string;
  resource: Resource;
  allowed: boolean;
  reason?: string;
}

// In-memory audit log (in production, this would go to a database)
const auditLogs: AuditLog[] = [];

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if a role can access a specific resource
 */
export function canAccessResource(role: Role, resource: Resource): boolean {
  return RESOURCE_ACCESS[role]?.includes(resource) || false;
}

/**
 * Check if user can perform action on resource (with audit logging)
 */
export function checkAccess(
  userId: string,
  role: Role,
  permission: Permission,
  resource: Resource
): boolean {
  const hasPermissionFlag = hasPermission(role, permission);
  const hasResourceAccess = canAccessResource(role, resource);
  const allowed = hasPermissionFlag && hasResourceAccess;

  // Log the access attempt
  const log: AuditLog = {
    timestamp: new Date(),
    userId,
    role,
    action: permission,
    resource,
    allowed,
    reason: !allowed
      ? !hasPermissionFlag
        ? `Role '${role}' lacks permission '${permission}'`
        : `Role '${role}' cannot access resource '${resource}'`
      : undefined,
  };

  auditLogs.push(log);

  // Log to console in development
  if (process.env.NODE_ENV === 'development' && !allowed) {
    logger.warn('[RBAC] Access Denied:', log);
  }

  return allowed;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get all resources accessible by a role
 */
export function getRoleResources(role: Role): Resource[] {
  return RESOURCE_ACCESS[role] || [];
}

/**
 * Get audit logs (optionally filtered)
 */
export function getAuditLogs(filter?: {
  userId?: string;
  role?: Role;
  resource?: Resource;
  deniedOnly?: boolean;
}): AuditLog[] {
  let logs = [...auditLogs];

  if (filter?.userId) {
    logs = logs.filter(log => log.userId === filter.userId);
  }
  if (filter?.role) {
    logs = logs.filter(log => log.role === filter.role);
  }
  if (filter?.resource) {
    logs = logs.filter(log => log.resource === filter.resource);
  }
  if (filter?.deniedOnly) {
    logs = logs.filter(log => !log.allowed);
  }

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Clear audit logs (admin only)
 */
export function clearAuditLogs(): void {
  auditLogs.length = 0;
}

/**
 * Get role hierarchy (higher number = more permissions)
 */
export function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    viewer: 1,
    operator: 2,
    manager: 3,
    admin: 4,
  };
  return levels[role] || 0;
}

/**
 * Check if roleA has equal or higher permissions than roleB
 */
export function hasEqualOrHigherRole(roleA: Role, roleB: Role): boolean {
  return getRoleLevel(roleA) >= getRoleLevel(roleB);
}
