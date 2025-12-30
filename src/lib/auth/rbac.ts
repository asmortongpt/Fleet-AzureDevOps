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
 *