/**
 * Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC)
 * FedRAMP-compliant authorization framework
 */

import logger from '@/utils/logger'
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

export type Role = 
  | "super-admin"      // Platform administrator
  | "admin"            // Tenant administrator
  | "manager"          // Fleet manager
  | "supervisor"       // Operations supervisor
  | "dispatcher"       // Dispatch coordinator
  | "mechanic"         // Maintenance technician
  | "technician"       // Field technician
  | "driver"           // Vehicle operator
  | "safety-officer"   // Safety & compliance officer
  | "analyst"          // Data analyst
  | "auditor"          // Compliance auditor
  | "viewer"           // Read-only access

export interface RoleDefinition {
  name: Role
  description: string
  permissions: Permission[]
  isSystemRole: boolean
  maxDatasetSize?: number // Row-level security limits
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
 * Attribute constraints for ABAC
 */
export interface AttributeConstraint {
  type: "department" | "site" | "region" | "vehicle-type" | "cost-center"
  operator: "equals" | "in" | "not-in" | "contains"
  value: string | string[]
}

/**
 * User attribute profile for ABAC (Attribute-Based Access Control)
 */
export interface UserAttributes {
  departments?: string[]
  sites?: string[]
  regions?: string[]
  vehicleTypes?: string[]
  costCenters?: string[]
}

/**
 * Check if user has permission with optional attribute constraints
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
  },
  userAttributes?: UserAttributes
): boolean {
  // Super admin has all permissions
  if (userRole === "super-admin") return true

  // Check if user has the permission
  const hasDirectPermission = userPermissions.includes(requiredPermission)
  if (!hasDirectPermission) {
    console.info('[RBAC] Permission denied - user lacks permission', {
      role: userRole,
      requiredPermission,
      hasPermission: false
    })
    return false
  }

  // If no constraints, permission is granted
  if (!constraints) {
    console.info('[RBAC] Permission granted', {
      role: userRole,
      requiredPermission,
      hasPermission: true
    })
    return true
  }

  // If constraints are specified but user has no attributes, deny access
  if (!userAttributes) {
    console.info('[RBAC] Permission denied - constraints specified but no user attributes', {
      role: userRole,
      requiredPermission,
      constraints
    })
    return false
  }

  // Check attribute constraints
  const constraintChecks: Record<string, boolean> = {}

  // Check department constraint
  if (constraints.department) {
    const hasAccess = userAttributes.departments?.includes(constraints.department) ?? false
    constraintChecks.department = hasAccess
    if (!hasAccess) {
      console.info('[RBAC] Permission denied - department constraint failed', {
        role: userRole,
        requiredPermission,
        requiredDepartment: constraints.department,
        userDepartments: userAttributes.departments
      })
      return false
    }
  }

  // Check site constraint
  if (constraints.site) {
    const hasAccess = userAttributes.sites?.includes(constraints.site) ?? false
    constraintChecks.site = hasAccess
    if (!hasAccess) {
      console.info('[RBAC] Permission denied - site constraint failed', {
        role: userRole,
        requiredSite: constraints.site,
        userSites: userAttributes.sites
      })
      return false
    }
  }

  // Check region constraint
  if (constraints.region) {
    const hasAccess = userAttributes.regions?.includes(constraints.region) ?? false
    constraintChecks.region = hasAccess
    if (!hasAccess) {
      console.info('[RBAC] Permission denied - region constraint failed', {
        role: userRole,
        requiredRegion: constraints.region,
        userRegions: userAttributes.regions
      })
      return false
    }
  }

  // Check vehicle type constraint
  if (constraints.vehicleType) {
    const hasAccess = userAttributes.vehicleTypes?.includes(constraints.vehicleType) ?? false
    constraintChecks.vehicleType = hasAccess
    if (!hasAccess) {
      console.info('[RBAC] Permission denied - vehicle type constraint failed', {
        role: userRole,
        requiredVehicleType: constraints.vehicleType,
        userVehicleTypes: userAttributes.vehicleTypes
      })
      return false
    }
  }

  // All constraints passed
  console.info('[RBAC] Permission granted with constraints', {
    role: userRole,
    requiredPermission,
    constraints,
    constraintChecks
  })

  return true
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_DEFINITIONS[role]?.permissions || []
}

/**
 * Check if role can access data size
 */
export function canAccessDatasetSize(role: Role, size: number): boolean {
  const roleDef = ROLE_DEFINITIONS[role]
  if (!roleDef.maxDatasetSize) return true
  return size <= roleDef.maxDatasetSize
}

/**
 * Audit log entry for permission checks
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
 * Log permission check for audit trail
 */
export function logPermissionCheck(entry: PermissionAuditLog): void {
  // In production, this would write to audit log storage
  console.info("[RBAC Audit]", { entry })
}
