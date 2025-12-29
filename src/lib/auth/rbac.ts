/**
 * Role-Based Access Control (RBAC) System
 *
 * Production-grade RBAC supporting:
 * - 8 distinct roles with granular permissions
 * - 15+ fine-grained permissions across all modules
 * - Permission inheritance and composition
 * - Decorator-based authorization (@requirePermission)
 * - Runtime permission checking (hasPermission)
 *
 * FedRAMP Compliance: AC-2, AC-3, AC-5, AC-6
 * SOC 2: CC6.1, CC6.2, CC6.3
 */

/**
 * System Roles
 *
 * Ordered from least to most privileged
 */
export type Role =
  | 'viewer'              // Read-only access to public data
  | 'driver'              // Drivers can view assigned vehicles/routes
  | 'analyst'             // Read access + analytics/reporting
  | 'maintenance-tech'    // Manage work orders and vehicle maintenance
  | 'compliance-officer'  // Audit logs and compliance reporting
  | 'fleet-manager'       // Full operational control (no admin)
  | 'security-admin'      // Security and audit management
  | 'admin';              // Full system access (super admin)

/**
 * Fine-Grained Permissions
 *
 * Format: <resource>:<action>
 */
export type Permission =
  // Vehicle Permissions
  | 'vehicle:read'
  | 'vehicle:write'
  | 'vehicle:delete'
  | 'vehicle:assign'
  | 'vehicle:retire'

  // Driver Permissions
  | 'driver:read'
  | 'driver:write'
  | 'driver:delete'
  | 'driver:assign'
  | 'driver:certify'

  // Work Order Permissions
  | 'workorder:read'
  | 'workorder:write'
  | 'workorder:delete'
  | 'workorder:approve'
  | 'workorder:close'

  // Facility Permissions
  | 'facility:read'
  | 'facility:write'
  | 'facility:delete'
  | 'facility:manage'

  // Route Permissions
  | 'route:read'
  | 'route:write'
  | 'route:delete'
  | 'route:analyze'
  | 'route:optimize'

  // Procurement Permissions
  | 'procurement:read'
  | 'procurement:write'
  | 'procurement:approve'

  // Financial Permissions
  | 'finance:read'
  | 'finance:write'
  | 'finance:approve'

  // Audit & Compliance
  | 'audit:read'
  | 'audit:export'
  | 'compliance:read'
  | 'compliance:report'

  // System Administration
  | 'admin:users'
  | 'admin:roles'
  | 'admin:settings'
  | 'admin:all';

/**
 * Role → Permission Mapping
 *
 * Defines which permissions each role has
 */
export const rolePermissions: Record<Role, Permission[]> = {
  /**
   * VIEWER: Read-only access to public information
   * Use Case: External stakeholders, contractors, auditors (view-only)
   */
  viewer: [
    'vehicle:read',
    'driver:read',
    'workorder:read',
    'facility:read',
    'route:read'
  ],

  /**
   * DRIVER: Self-service for assigned vehicles and routes
   * Use Case: Company drivers, contractors with assigned vehicles
   */
  driver: [
    'vehicle:read',
    'driver:read',
    'workorder:read',
    'workorder:write', // Can report issues
    'route:read',
    'route:write' // Can update route status
  ],

  /**
   * ANALYST: Read access + analytics and reporting
   * Use Case: Business analysts, data scientists, reporting team
   */
  analyst: [
    'vehicle:read',
    'driver:read',
    'workorder:read',
    'facility:read',
    'route:read',
    'route:analyze',
    'route:optimize',
    'procurement:read',
    'finance:read',
    'audit:read',
    'compliance:read',
    'compliance:report'
  ],

  /**
   * MAINTENANCE-TECH: Manage vehicle maintenance and work orders
   * Use Case: Mechanics, maintenance technicians, shop supervisors
   */
  'maintenance-tech': [
    'vehicle:read',
    'vehicle:write',
    'workorder:read',
    'workorder:write',
    'workorder:close',
    'facility:read',
    'procurement:read',
    'procurement:write'
  ],

  /**
   * COMPLIANCE-OFFICER: Audit and compliance management
   * Use Case: Compliance team, internal auditors, regulatory reporting
   * FedRAMP Role: Requires elevated access to audit logs
   */
  'compliance-officer': [
    'vehicle:read',
    'driver:read',
    'driver:certify', // Verify driver certifications
    'workorder:read',
    'facility:read',
    'route:read',
    'audit:read',
    'audit:export',
    'compliance:read',
    'compliance:report'
  ],

  /**
   * FLEET-MANAGER: Full operational control (no admin functions)
   * Use Case: Fleet managers, operations managers, supervisors
   */
  'fleet-manager': [
    'vehicle:read',
    'vehicle:write',
    'vehicle:assign',
    'vehicle:retire',
    'driver:read',
    'driver:write',
    'driver:assign',
    'driver:certify',
    'workorder:read',
    'workorder:write',
    'workorder:approve',
    'workorder:close',
    'facility:read',
    'facility:write',
    'facility:manage',
    'route:read',
    'route:write',
    'route:analyze',
    'route:optimize',
    'procurement:read',
    'procurement:write',
    'procurement:approve',
    'finance:read',
    'audit:read',
    'compliance:read'
  ],

  /**
   * SECURITY-ADMIN: Security and audit management
   * Use Case: Security team, SOC analysts, incident responders
   * FedRAMP Role: IA-4, IA-5 enforcement
   */
  'security-admin': [
    'audit:read',
    'audit:export',
    'compliance:read',
    'compliance:report',
    'admin:users',
    'admin:roles',
    'admin:settings',
    'admin:all'
  ],

  /**
   * ADMIN: Full system access (super admin)
   * Use Case: System administrators, DevOps, CTO
   * FedRAMP Role: Requires MFA, audit logging, and strict oversight
   */
  admin: ['admin:all']
};

/**
 * Check if a user has a specific permission
 *
 * @param userRoles - Array of roles assigned to the user
 * @param permission - The permission to check
 * @returns true if user has permission, false otherwise
 *
 * @example
 * ```ts
 * const canDeleteVehicle = hasPermission(user.roles, 'vehicle:delete');
 * if (!canDeleteVehicle) {
 *   throw new Error('Permission denied');
 * }
 * ```
 */
export function hasPermission(userRoles: Role[], permission: Permission): boolean {
  // Admin role has all permissions
  if (userRoles.includes('admin')) {
    return true;
  }

  // Security admin has all permissions via admin:all
  if (userRoles.includes('security-admin')) {
    return true;
  }

  // Collect all permissions from all user roles
  const userPermissions = userRoles.flatMap(role => rolePermissions[role] || []);

  // Check if user has admin:all (universal access)
  if (userPermissions.includes('admin:all')) {
    return true;
  }

  // Check for specific permission
  return userPermissions.includes(permission);
}

/**
 * Check if a user has ANY of the specified permissions
 *
 * @param userRoles - Array of roles assigned to the user
 * @param permissions - Array of permissions to check (OR logic)
 * @returns true if user has at least one permission
 *
 * @example
 * ```ts
 * const canManageVehicles = hasAnyPermission(user.roles, [
 *   'vehicle:write',
 *   'vehicle:delete',
 *   'admin:all'
 * ]);
 * ```
 */
export function hasAnyPermission(userRoles: Role[], permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRoles, permission));
}

/**
 * Check if a user has ALL of the specified permissions
 *
 * @param userRoles - Array of roles assigned to the user
 * @param permissions - Array of permissions to check (AND logic)
 * @returns true if user has all permissions
 *
 * @example
 * ```ts
 * const canApproveWorkOrder = hasAllPermissions(user.roles, [
 *   'workorder:read',
 *   'workorder:approve'
 * ]);
 * ```
 */
export function hasAllPermissions(userRoles: Role[], permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRoles, permission));
}

/**
 * Get all permissions for a user based on their roles
 *
 * @param userRoles - Array of roles assigned to the user
 * @returns Array of all unique permissions
 *
 * @example
 * ```ts
 * const permissions = getUserPermissions(user.roles);
 * console.log('User has', permissions.length, 'permissions');
 * ```
 */
export function getUserPermissions(userRoles: Role[]): Permission[] {
  if (userRoles.includes('admin') || userRoles.includes('security-admin')) {
    // Return all permissions for admin/security-admin
    return Object.values(rolePermissions).flat();
  }

  const permissions = new Set<Permission>();
  for (const role of userRoles) {
    const rolePerms = rolePermissions[role] || [];
    rolePerms.forEach(perm => permissions.add(perm));
  }

  return Array.from(permissions);
}

/**
 * TypeScript Decorator: Require specific permission for method execution
 *
 * @param permission - The permission required to execute the method
 * @returns Method decorator
 *
 * @example
 * ```ts
 * class VehicleService {
 *   @requirePermission('vehicle:delete')
 *   async deleteVehicle(id: string) {
 *     // Only users with 'vehicle:delete' permission can call this
 *   }
 * }
 * ```
 *
 * Note: This decorator requires the class to have a getCurrentUser() method
 */
export function requirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get current user from class context
      const user = (this as any).getCurrentUser?.();

      if (!user) {
        throw new Error('Authentication required');
      }

      if (!hasPermission(user.roles, permission)) {
        throw new Error(`Permission denied: ${permission} required`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * TypeScript Decorator: Require ANY of the specified permissions
 *
 * @param permissions - Array of permissions (OR logic)
 * @returns Method decorator
 *
 * @example
 * ```ts
 * class VehicleService {
 *   @requireAnyPermission(['vehicle:write', 'admin:all'])
 *   async updateVehicle(id: string, data: any) {
 *     // Users with either vehicle:write OR admin:all can call this
 *   }
 * }
 * ```
 */
export function requireAnyPermission(permissions: Permission[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const user = (this as any).getCurrentUser?.();

      if (!user) {
        throw new Error('Authentication required');
      }

      if (!hasAnyPermission(user.roles, permissions)) {
        throw new Error(`Permission denied: One of [${permissions.join(', ')}] required`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Permission Groups for UI Components
 *
 * Organize permissions by feature area for easier UI authorization
 */
export const permissionGroups = {
  vehicles: ['vehicle:read', 'vehicle:write', 'vehicle:delete', 'vehicle:assign', 'vehicle:retire'] as const,
  drivers: ['driver:read', 'driver:write', 'driver:delete', 'driver:assign', 'driver:certify'] as const,
  workOrders: ['workorder:read', 'workorder:write', 'workorder:delete', 'workorder:approve', 'workorder:close'] as const,
  facilities: ['facility:read', 'facility:write', 'facility:delete', 'facility:manage'] as const,
  routes: ['route:read', 'route:write', 'route:delete', 'route:analyze', 'route:optimize'] as const,
  procurement: ['procurement:read', 'procurement:write', 'procurement:approve'] as const,
  finance: ['finance:read', 'finance:write', 'finance:approve'] as const,
  audit: ['audit:read', 'audit:export'] as const,
  compliance: ['compliance:read', 'compliance:report'] as const,
  admin: ['admin:users', 'admin:roles', 'admin:settings', 'admin:all'] as const
};

/**
 * Role Hierarchy (for UI display and understanding)
 */
export const roleHierarchy: Record<Role, { level: number; label: string; description: string }> = {
  viewer: {
    level: 1,
    label: 'Viewer',
    description: 'Read-only access to public information'
  },
  driver: {
    level: 2,
    label: 'Driver',
    description: 'Self-service for assigned vehicles and routes'
  },
  analyst: {
    level: 3,
    label: 'Analyst',
    description: 'Analytics, reporting, and business intelligence'
  },
  'maintenance-tech': {
    level: 4,
    label: 'Maintenance Technician',
    description: 'Vehicle maintenance and work order management'
  },
  'compliance-officer': {
    level: 5,
    label: 'Compliance Officer',
    description: 'Audit logs, compliance reporting, and certifications'
  },
  'fleet-manager': {
    level: 6,
    label: 'Fleet Manager',
    description: 'Full operational control of fleet operations'
  },
  'security-admin': {
    level: 7,
    label: 'Security Administrator',
    description: 'Security, audit, and user management'
  },
  admin: {
    level: 8,
    label: 'System Administrator',
    description: 'Full system access (super admin)'
  }
};
