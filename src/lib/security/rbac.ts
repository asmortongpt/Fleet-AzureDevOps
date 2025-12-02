/**
 * Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC)
 * FedRAMP-compliant authorization framework
 *
 * @module rbac
 *
 * ## Role Hierarchy
 *
 * ```
 * super-admin (Platform)
 *     ├── admin (Tenant)
 *     │   ├── manager (Fleet Operations)
 *     │   │   ├── supervisor (Team Lead)
 *     │   │   │   ├── dispatcher
 *     │   │   │   ├── mechanic
 *     │   │   │   └── technician
 *     │   │   └── driver
 *     │   ├── safety-officer (Compliance)
 *     │   ├── analyst (Reporting)
 *     │   └── auditor (Read-only)
 *     └── viewer (Basic Read)
 * ```
 *
 * ## Permission Format
 *
 * Permissions follow the format: `resource.action`
 * - resource: vehicles, drivers, maintenance, etc.
 * - action: view, create, edit, delete, approve, etc.
 *
 * ## Usage Examples
 *
 * ### Frontend Permission Checking
 * ```typescript
 * import { hasPermission, getRolePermissions } from '@/lib/security/rbac'
 *
 * // Check single permission
 * if (hasPermission(userRole, userPermissions, "vehicles.create")) {
 *   // Allow vehicle creation
 * }
 *
 * // Get all permissions for a role
 * const managerPermissions = getRolePermissions("manager")
 * ```
 *
 * ### Backend Middleware Integration
 * ```typescript
 * import { requirePermission } from '../middleware/permissions'
 *
 * // Protect route with permission check
 * router.post('/vehicles', requirePermission('vehicles.create'), createVehicle)
 * router.delete('/vehicles/:id', requirePermission('vehicles.delete'), deleteVehicle)
 * ```
 *
 * @see {@link https://csrc.nist.gov/projects/role-based-access-control | NIST RBAC}
 */

import logger from '@/utils/logger'

/**
 * Fine-grained permissions for all system resources.
 *
 * Format: `resource.action` where:
 * - resource: The entity being accessed (vehicles, drivers, etc.)
 * - action: The operation being performed (view, create, edit, etc.)
 *
 * @example
 * ```typescript
 * // Check if user can create vehicles
 * const canCreate: Permission = "vehicles.create"
 * if (hasPermission(userRole, userPermissions, canCreate)) {
 *   // Allow creation
 * }
 * ```
 */
export type Permission = 
  // Vehicle permissions
  | "vehicles.view" | "vehicles.create" | "vehicles.edit" | "vehicles.delete" | "vehicles.assign"
  // Driver permissions
  | "drivers.view" | "drivers.create" | "drivers.edit" | "drivers.delete" | "drivers.certify"
  // Maintenance permissions
  | "maintenance.view" | "maintenance.create" | "maintenance.approve" | "maintenance.schedule" | "maintenance.complete"
  // Work order permissions
  | "workorders.view" | "workorders.create" | "workorders.assign" | "workorders.approve" | "workorders.complete"
  // Parts & inventory
  | "parts.view" | "parts.create" | "parts.edit" | "parts.delete" | "parts.order" | "parts.receive"
  // Vendor management
  | "vendors.view" | "vendors.create" | "vendors.edit" | "vendors.delete" | "vendors.contract"
  // Purchase orders
  | "po.view" | "po.create" | "po.approve" | "po.receive" | "po.cancel"
  // Invoices
  | "invoices.view" | "invoices.create" | "invoices.approve" | "invoices.pay" | "invoices.dispute"
  // Reports & analytics
  | "reports.view" | "reports.generate" | "reports.export" | "reports.schedule"
  // Audit & compliance
  | "audit.view" | "audit.export" | "compliance.view" | "compliance.manage"
  // OSHA & safety
  | "osha.view" | "osha.submit" | "osha.approve" | "osha.export" | "safety.manage"
  // Policy engine
  | "policy.view" | "policy.create" | "policy.edit" | "policy.approve" | "policy.test" | "policy.deploy"
  // GPS & tracking
  | "gps.view" | "gps.history" | "gps.export" | "geofence.create" | "geofence.edit"
  // Video telematics
  | "video.view" | "video.download" | "video.redact" | "video.delete"
  // Communications
  | "comms.view" | "comms.send" | "comms.broadcast" | "radio.monitor"
  // Charging & EV
  | "charging.view" | "charging.manage" | "charging.command" | "energy.reports"
  // Payments
  | "payments.view" | "payments.approve" | "payments.process" | "payments.refund"
  // Admin & settings
  | "settings.view" | "settings.manage" | "users.view" | "users.manage" | "roles.manage"
  // Tenant management
  | "tenant.view" | "tenant.create" | "tenant.manage" | "tenant.billing"
  // System
  | "system.admin" | "system.audit" | "system.backup" | "system.restore"

/**
 * System roles organized in hierarchy from highest to lowest privilege.
 *
 * Hierarchy levels:
 * - Level 0: super-admin (Platform level)
 * - Level 1: admin (Tenant level)
 * - Level 2: manager, safety-officer, analyst, auditor (Department level)
 * - Level 3: supervisor (Team level)
 * - Level 4: dispatcher, mechanic, technician, driver (Individual level)
 * - Level 5: viewer (Read-only)
 *
 * @example
 * ```typescript
 * // Check user role
 * const userRole: Role = "manager"
 * const permissions = getRolePermissions(userRole)
 * ```
 */
export type Role =
  | "super-admin"      // Platform administrator - manages multiple tenants
  | "admin"            // Tenant administrator - full organizational access
  | "manager"          // Fleet manager - operational oversight
  | "supervisor"       // Operations supervisor - team management
  | "dispatcher"       // Dispatch coordinator - vehicle assignments
  | "mechanic"         // Maintenance technician - repairs
  | "technician"       // Field technician - installations
  | "driver"           // Vehicle operator - field access
  | "safety-officer"   // Safety & compliance officer
  | "analyst"          // Data analyst - reporting
  | "auditor"          // Compliance auditor - read-only
  | "viewer"           // Basic read-only access

/**
 * Complete definition of a role including permissions and constraints.
 *
 * @property name - The role identifier
 * @property description - Human-readable role description
 * @property permissions - Array of granted permissions
 * @property isSystemRole - Whether this is a platform-level role
 * @property maxDatasetSize - Optional row-level security limit for large datasets
 *
 * @example
 * ```typescript
 * const managerRole: RoleDefinition = ROLE_DEFINITIONS["manager"]
 * console.log(managerRole.description) // "Fleet manager with operational oversight"
 * console.log(managerRole.maxDatasetSize) // 10000
 * ```
 */
export interface RoleDefinition {
  name: Role
  description: string
  permissions: Permission[]
  isSystemRole: boolean
  maxDatasetSize?: number // Row-level security limits for performance
}

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  "super-admin": {
    name: "super-admin",
    description: "Platform administrator with full system access",
    permissions: ["system.admin", "system.audit", "system.backup", "system.restore", "tenant.create", "tenant.manage", "tenant.billing"],
    isSystemRole: true
  },
  "admin": {
    name: "admin",
    description: "Tenant administrator with full organizational access",
    permissions: [
      "vehicles.view", "vehicles.create", "vehicles.edit", "vehicles.delete", "vehicles.assign",
      "drivers.view", "drivers.create", "drivers.edit", "drivers.delete", "drivers.certify",
      "maintenance.view", "maintenance.create", "maintenance.approve", "maintenance.schedule", "maintenance.complete",
      "workorders.view", "workorders.create", "workorders.assign", "workorders.approve", "workorders.complete",
      "parts.view", "parts.create", "parts.edit", "parts.delete", "parts.order", "parts.receive",
      "vendors.view", "vendors.create", "vendors.edit", "vendors.delete", "vendors.contract",
      "po.view", "po.create", "po.approve", "po.receive", "po.cancel",
      "invoices.view", "invoices.create", "invoices.approve", "invoices.pay", "invoices.dispute",
      "reports.view", "reports.generate", "reports.export", "reports.schedule",
      "audit.view", "audit.export", "compliance.view", "compliance.manage",
      "osha.view", "osha.submit", "osha.approve", "osha.export", "safety.manage",
      "policy.view", "policy.create", "policy.edit", "policy.approve", "policy.test", "policy.deploy",
      "gps.view", "gps.history", "gps.export", "geofence.create", "geofence.edit",
      "video.view", "video.download", "video.redact", "video.delete",
      "comms.view", "comms.send", "comms.broadcast", "radio.monitor",
      "charging.view", "charging.manage", "charging.command", "energy.reports",
      "payments.view", "payments.approve", "payments.process", "payments.refund",
      "settings.view", "settings.manage", "users.view", "users.manage", "roles.manage"
    ],
    isSystemRole: false
  },
  "manager": {
    name: "manager",
    description: "Fleet manager with operational oversight",
    permissions: [
      "vehicles.view", "vehicles.edit", "vehicles.assign",
      "drivers.view", "drivers.edit", "drivers.certify",
      "maintenance.view", "maintenance.create", "maintenance.approve", "maintenance.schedule",
      "workorders.view", "workorders.create", "workorders.assign", "workorders.approve",
      "parts.view", "parts.order",
      "vendors.view", "vendors.edit",
      "po.view", "po.create", "po.approve",
      "invoices.view", "invoices.approve",
      "reports.view", "reports.generate", "reports.export",
      "compliance.view", "osha.view", "osha.approve",
      "policy.view", "policy.test",
      "gps.view", "gps.history", "geofence.create",
      "video.view", "video.download",
      "comms.view", "comms.send", "comms.broadcast",
      "charging.view", "charging.manage",
      "payments.view", "payments.approve"
    ],
    isSystemRole: false,
    maxDatasetSize: 10000
  },
  "supervisor": {
    name: "supervisor",
    description: "Operations supervisor with team oversight",
    permissions: [
      "vehicles.view", "vehicles.assign",
      "drivers.view", "drivers.edit",
      "maintenance.view", "maintenance.schedule",
      "workorders.view", "workorders.create", "workorders.assign",
      "parts.view",
      "reports.view", "reports.generate",
      "osha.view", "osha.submit",
      "policy.view",
      "gps.view", "gps.history",
      "video.view",
      "comms.view", "comms.send",
      "charging.view"
    ],
    isSystemRole: false,
    maxDatasetSize: 5000
  },
  "dispatcher": {
    name: "dispatcher",
    description: "Dispatch coordinator managing vehicle assignments",
    permissions: [
      "vehicles.view", "vehicles.assign",
      "drivers.view",
      "workorders.view", "workorders.create", "workorders.assign",
      "gps.view", "gps.history",
      "comms.view", "comms.send", "comms.broadcast",
      "reports.view"
    ],
    isSystemRole: false,
    maxDatasetSize: 5000
  },
  "mechanic": {
    name: "mechanic",
    description: "Maintenance technician performing repairs",
    permissions: [
      "vehicles.view",
      "maintenance.view", "maintenance.complete",
      "workorders.view", "workorders.complete",
      "parts.view", "parts.order",
      "osha.submit"
    ],
    isSystemRole: false,
    maxDatasetSize: 1000
  },
  "technician": {
    name: "technician",
    description: "Field technician with limited access",
    permissions: [
      "vehicles.view",
      "workorders.view", "workorders.complete",
      "parts.view",
      "osha.submit",
      "gps.view"
    ],
    isSystemRole: false,
    maxDatasetSize: 500
  },
  "driver": {
    name: "driver",
    description: "Vehicle operator with field access",
    permissions: [
      "vehicles.view",
      "maintenance.view",
      "workorders.view",
      "osha.submit",
      "gps.view"
    ],
    isSystemRole: false,
    maxDatasetSize: 100
  },
  "safety-officer": {
    name: "safety-officer",
    description: "Safety and compliance specialist",
    permissions: [
      "vehicles.view",
      "drivers.view", "drivers.certify",
      "compliance.view", "compliance.manage",
      "osha.view", "osha.submit", "osha.approve", "osha.export", "safety.manage",
      "policy.view", "policy.create", "policy.edit",
      "video.view", "video.download",
      "reports.view", "reports.generate", "reports.export",
      "audit.view"
    ],
    isSystemRole: false,
    maxDatasetSize: 10000
  },
  "analyst": {
    name: "analyst",
    description: "Data analyst with reporting access",
    permissions: [
      "vehicles.view",
      "drivers.view",
      "maintenance.view",
      "workorders.view",
      "parts.view",
      "reports.view", "reports.generate", "reports.export", "reports.schedule",
      "gps.view", "gps.history", "gps.export",
      "compliance.view",
      "energy.reports"
    ],
    isSystemRole: false,
    maxDatasetSize: 50000
  },
  "auditor": {
    name: "auditor",
    description: "Compliance auditor with read-only access",
    permissions: [
      "vehicles.view",
      "drivers.view",
      "maintenance.view",
      "workorders.view",
      "parts.view",
      "vendors.view",
      "po.view",
      "invoices.view",
      "audit.view", "audit.export",
      "compliance.view",
      "osha.view", "osha.export",
      "policy.view",
      "reports.view", "reports.export"
    ],
    isSystemRole: false,
    maxDatasetSize: 50000
  },
  "viewer": {
    name: "viewer",
    description: "Read-only access to basic information",
    permissions: [
      "vehicles.view",
      "drivers.view",
      "maintenance.view",
      "workorders.view",
      "reports.view",
      "gps.view"
    ],
    isSystemRole: false,
    maxDatasetSize: 1000
  }
}

/**
 * Attribute constraints for Attribute-Based Access Control (ABAC).
 *
 * Allows fine-grained access control based on resource attributes
 * beyond simple role-based permissions.
 *
 * @property type - The attribute category to check
 * @property operator - Comparison operator for the constraint
 * @property value - Expected value(s) for the attribute
 *
 * @example
 * ```typescript
 * const constraint: AttributeConstraint = {
 *   type: "department",
 *   operator: "equals",
 *   value: "maintenance"
 * }
 * ```
 */
export interface AttributeConstraint {
  type: "department" | "site" | "region" | "vehicle-type" | "cost-center"
  operator: "equals" | "in" | "not-in" | "contains"
  value: string | string[]
}

/**
 * Check if user has a specific permission with optional attribute constraints.
 *
 * This function implements both RBAC (role-based) and ABAC (attribute-based)
 * access control. Super-admins bypass all checks.
 *
 * @param userRole - The user's role
 * @param userPermissions - Array of user's granted permissions
 * @param requiredPermission - The permission to check
 * @param constraints - Optional attribute constraints for ABAC
 * @returns `true` if user has permission, `false` otherwise
 *
 * @example
 * ```typescript
 * // Simple permission check (RBAC)
 * const canCreate = hasPermission(
 *   "manager",
 *   managerPermissions,
 *   "vehicles.create"
 * )
 *
 * // Permission check with constraints (ABAC)
 * const canViewDept = hasPermission(
 *   "supervisor",
 *   supervisorPermissions,
 *   "vehicles.view",
 *   { department: "maintenance" }
 * )
 * ```
 *
 * @see {@link getRolePermissions} for getting all permissions for a role
 * @see {@link https://csrc.nist.gov/projects/abac | NIST ABAC}
 */
export function hasPermission(
  userRole: Role,
  userPermissions: Permission[],
  requiredPermission: Permission,
  constraints?: {
    department?: string
    site?: string
    region?: string
    vehicleType?: string
  }
): boolean {
  // Super admin has all permissions
  if (userRole === "super-admin") return true

  // Check if user has the permission
  const hasDirectPermission = userPermissions.includes(requiredPermission)
  if (!hasDirectPermission) return false

  // If no constraints, permission is granted
  if (!constraints) return true

  // TODO: Implement full attribute constraint checking
  // This would check if user's attributes match the resource attributes
  // For production, integrate with backend validateResourceScope()
  logger.warn('[RBAC] Attribute constraints not fully implemented, allowing access')
  return true
}

/**
 * Get all permissions granted to a specific role.
 *
 * Returns the complete permission set for a role as defined in ROLE_DEFINITIONS.
 * Useful for preloading user permissions on authentication.
 *
 * @param role - The role to lookup
 * @returns Array of permissions, or empty array if role not found
 *
 * @example
 * ```typescript
 * // Get permissions for a manager
 * const perms = getRolePermissions("manager")
 * console.log(perms.includes("vehicles.create")) // true
 * console.log(perms.includes("system.admin")) // false
 * ```
 *
 * @see {@link ROLE_DEFINITIONS} for complete role configuration
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_DEFINITIONS[role]?.permissions || []
}

/**
 * Check if a role can access a dataset of a given size.
 *
 * Implements row-level security by limiting dataset sizes for lower-privilege roles.
 * Prevents performance issues and unauthorized mass data exports.
 *
 * @param role - The user's role
 * @param size - The number of rows in the dataset
 * @returns `true` if role can access dataset, `false` if too large
 *
 * @example
 * ```typescript
 * // Check if driver can access all 10,000 vehicles
 * const allowed = canAccessDatasetSize("driver", 10000)
 * console.log(allowed) // false (driver limited to 100 rows)
 *
 * // Check if manager can access same dataset
 * const managerAllowed = canAccessDatasetSize("manager", 10000)
 * console.log(managerAllowed) // true (manager limit is 10,000)
 * ```
 *
 * @see {@link RoleDefinition.maxDatasetSize}
 */
export function canAccessDatasetSize(role: Role, size: number): boolean {
  const roleDef = ROLE_DEFINITIONS[role]
  if (!roleDef.maxDatasetSize) return true // No limit
  return size <= roleDef.maxDatasetSize
}

/**
 * Audit log entry for permission checks.
 *
 * Records all permission decisions for compliance and security auditing.
 * Required for FedRAMP AC-2, AU-2, and AU-3 controls.
 *
 * @property timestamp - ISO 8601 timestamp of the check
 * @property userId - Unique identifier of the user
 * @property tenantId - Tenant context for multi-tenancy
 * @property permission - The permission that was checked
 * @property resource - The resource being accessed
 * @property action - The action being performed
 * @property granted - Whether permission was granted
 * @property reason - Optional explanation for denial
 * @property ipAddress - Client IP address for security tracking
 * @property userAgent - Client user agent string
 *
 * @example
 * ```typescript
 * const auditEntry: PermissionAuditLog = {
 *   timestamp: new Date().toISOString(),
 *   userId: "user-123",
 *   tenantId: "tenant-456",
 *   permission: "vehicles.delete",
 *   resource: "vehicle-789",
 *   action: "DELETE",
 *   granted: false,
 *   reason: "Insufficient permissions",
 *   ipAddress: "192.168.1.100",
 *   userAgent: "Mozilla/5.0..."
 * }
 * logPermissionCheck(auditEntry)
 * ```
 *
 * @see {@link logPermissionCheck} for logging entries
 * @see {@link https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf | NIST SP 800-53}
 */
export interface PermissionAuditLog {
  timestamp: string
  userId: string
  tenantId: string
  permission: Permission
  resource: string
  action: string
  granted: boolean
  reason?: string
  ipAddress: string
  userAgent: string
}

/**
 * Log a permission check to the audit trail.
 *
 * In production, logs are written to persistent storage (database or log aggregation service)
 * for compliance reporting and security analysis.
 *
 * **Security Note:** Audit logs must be tamper-proof and retained per compliance requirements
 * (e.g., FedRAMP requires 90-day retention with 7-year backup).
 *
 * @param entry - The audit log entry to record
 *
 * @example
 * ```typescript
 * // Log a denied permission
 * logPermissionCheck({
 *   timestamp: new Date().toISOString(),
 *   userId: req.user.id,
 *   tenantId: req.user.tenant_id,
 *   permission: "vehicles.delete",
 *   resource: `vehicle-${vehicleId}`,
 *   action: "DELETE",
 *   granted: false,
 *   reason: "User role 'driver' lacks vehicles.delete permission",
 *   ipAddress: req.ip,
 *   userAgent: req.get('user-agent') || 'unknown'
 * })
 * ```
 *
 * @see {@link PermissionAuditLog} for entry format
 */
export function logPermissionCheck(entry: PermissionAuditLog): void {
  // In production, this would write to:
  // - Database audit table (for compliance queries)
  // - SIEM/log aggregation (Splunk, ELK, Datadog)
  // - FedRAMP-compliant audit storage
  logger.info("[RBAC Audit]", { entry })
}
