// ============================================================================
// Role-Based Access Control (RBAC) Type Definitions
// ============================================================================

/**
 * System Roles - Hierarchical permission structure
 *
 * SUPER_ADMIN: Full system access across all tenants
 * TENANT_ADMIN: Full access within their tenant
 * FLEET_MANAGER: Manages vehicles, drivers, and operations
 * MAINTENANCE_MANAGER: Manages maintenance and repairs
 * DRIVER: Basic access to assigned vehicles and tasks
 * VIEWER: Read-only access to reports and data
 */
export enum Role {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  FLEET_MANAGER = 'fleet_manager',
  MAINTENANCE_MANAGER = 'maintenance_manager',
  DRIVER = 'driver',
  VIEWER = 'viewer',
}

/**
 * Fine-grained permissions using resource:action pattern
 */
export enum Permission {
  // ========== Vehicle Permissions ==========
  VEHICLES_VIEW = 'vehicles:view',
  VEHICLES_CREATE = 'vehicles:create',
  VEHICLES_UPDATE = 'vehicles:update',
  VEHICLES_DELETE = 'vehicles:delete',
  VEHICLES_ASSIGN = 'vehicles:assign',
  VEHICLES_EXPORT = 'vehicles:export',

  // ========== Driver Permissions ==========
  DRIVERS_VIEW = 'drivers:view',
  DRIVERS_CREATE = 'drivers:create',
  DRIVERS_UPDATE = 'drivers:update',
  DRIVERS_DELETE = 'drivers:delete',
  DRIVERS_ASSIGN = 'drivers:assign',
  DRIVERS_CERTIFY = 'drivers:certify',
  DRIVERS_EXPORT = 'drivers:export',

  // ========== Maintenance Permissions ==========
  MAINTENANCE_VIEW = 'maintenance:view',
  MAINTENANCE_CREATE = 'maintenance:create',
  MAINTENANCE_UPDATE = 'maintenance:update',
  MAINTENANCE_DELETE = 'maintenance:delete',
  MAINTENANCE_APPROVE = 'maintenance:approve',
  MAINTENANCE_EXPORT = 'maintenance:export',

  // ========== Work Order Permissions ==========
  WORK_ORDERS_VIEW = 'work_orders:view',
  WORK_ORDERS_CREATE = 'work_orders:create',
  WORK_ORDERS_UPDATE = 'work_orders:update',
  WORK_ORDERS_DELETE = 'work_orders:delete',
  WORK_ORDERS_ASSIGN = 'work_orders:assign',
  WORK_ORDERS_COMPLETE = 'work_orders:complete',

  // ========== Facility Permissions ==========
  FACILITIES_VIEW = 'facilities:view',
  FACILITIES_CREATE = 'facilities:create',
  FACILITIES_UPDATE = 'facilities:update',
  FACILITIES_DELETE = 'facilities:delete',

  // ========== Procurement Permissions ==========
  PROCUREMENT_VIEW = 'procurement:view',
  PROCUREMENT_CREATE = 'procurement:create',
  PROCUREMENT_APPROVE = 'procurement:approve',
  PROCUREMENT_EXPORT = 'procurement:export',

  // ========== Inventory Permissions ==========
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_CREATE = 'inventory:create',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_DELETE = 'inventory:delete',
  INVENTORY_TRANSFER = 'inventory:transfer',

  // ========== Fuel Permissions ==========
  FUEL_VIEW = 'fuel:view',
  FUEL_CREATE = 'fuel:create',
  FUEL_UPDATE = 'fuel:update',
  FUEL_EXPORT = 'fuel:export',

  // ========== Trip Permissions ==========
  TRIPS_VIEW = 'trips:view',
  TRIPS_CREATE = 'trips:create',
  TRIPS_UPDATE = 'trips:update',
  TRIPS_DELETE = 'trips:delete',
  TRIPS_APPROVE = 'trips:approve',

  // ========== Report Permissions ==========
  REPORTS_VIEW = 'reports:view',
  REPORTS_CREATE = 'reports:create',
  REPORTS_EXPORT = 'reports:export',
  REPORTS_SCHEDULE = 'reports:schedule',

  // ========== Dashboard Permissions ==========
  DASHBOARDS_VIEW = 'dashboards:view',
  DASHBOARDS_CREATE = 'dashboards:create',
  DASHBOARDS_CUSTOMIZE = 'dashboards:customize',

  // ========== Communication Permissions ==========
  MESSAGES_VIEW = 'messages:view',
  MESSAGES_SEND = 'messages:send',
  MESSAGES_DELETE = 'messages:delete',
  NOTIFICATIONS_MANAGE = 'notifications:manage',

  // ========== Document Permissions ==========
  DOCUMENTS_VIEW = 'documents:view',
  DOCUMENTS_UPLOAD = 'documents:upload',
  DOCUMENTS_DELETE = 'documents:delete',
  DOCUMENTS_SHARE = 'documents:share',

  // ========== User Management Permissions ==========
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  USERS_MANAGE_ROLES = 'users:manage_roles',

  // ========== Tenant Management Permissions ==========
  TENANTS_VIEW = 'tenants:view',
  TENANTS_CREATE = 'tenants:create',
  TENANTS_UPDATE = 'tenants:update',
  TENANTS_DELETE = 'tenants:delete',

  // ========== Settings Permissions ==========
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',
  SETTINGS_MANAGE_INTEGRATIONS = 'settings:manage_integrations',

  // ========== Audit Permissions ==========
  AUDIT_LOGS_VIEW = 'audit_logs:view',
  AUDIT_LOGS_EXPORT = 'audit_logs:export',

  // ========== API Permissions ==========
  API_KEYS_VIEW = 'api_keys:view',
  API_KEYS_CREATE = 'api_keys:create',
  API_KEYS_DELETE = 'api_keys:delete',

  // ========== Compliance Permissions ==========
  COMPLIANCE_VIEW = 'compliance:view',
  COMPLIANCE_MANAGE = 'compliance:manage',
  COMPLIANCE_AUDIT = 'compliance:audit',
}

/**
 * Role-to-Permission Mapping
 * Each role has a specific set of permissions
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Super Admin: All permissions
  [Role.SUPER_ADMIN]: Object.values(Permission),

  // Tenant Admin: All permissions except tenant management
  [Role.TENANT_ADMIN]: [
    // Vehicles
    Permission.VEHICLES_VIEW,
    Permission.VEHICLES_CREATE,
    Permission.VEHICLES_UPDATE,
    Permission.VEHICLES_DELETE,
    Permission.VEHICLES_ASSIGN,
    Permission.VEHICLES_EXPORT,

    // Drivers
    Permission.DRIVERS_VIEW,
    Permission.DRIVERS_CREATE,
    Permission.DRIVERS_UPDATE,
    Permission.DRIVERS_DELETE,
    Permission.DRIVERS_ASSIGN,
    Permission.DRIVERS_CERTIFY,
    Permission.DRIVERS_EXPORT,

    // Maintenance
    Permission.MAINTENANCE_VIEW,
    Permission.MAINTENANCE_CREATE,
    Permission.MAINTENANCE_UPDATE,
    Permission.MAINTENANCE_DELETE,
    Permission.MAINTENANCE_APPROVE,
    Permission.MAINTENANCE_EXPORT,

    // Work Orders
    Permission.WORK_ORDERS_VIEW,
    Permission.WORK_ORDERS_CREATE,
    Permission.WORK_ORDERS_UPDATE,
    Permission.WORK_ORDERS_DELETE,
    Permission.WORK_ORDERS_ASSIGN,
    Permission.WORK_ORDERS_COMPLETE,

    // Facilities
    Permission.FACILITIES_VIEW,
    Permission.FACILITIES_CREATE,
    Permission.FACILITIES_UPDATE,
    Permission.FACILITIES_DELETE,

    // Procurement
    Permission.PROCUREMENT_VIEW,
    Permission.PROCUREMENT_CREATE,
    Permission.PROCUREMENT_APPROVE,
    Permission.PROCUREMENT_EXPORT,

    // Inventory
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_DELETE,
    Permission.INVENTORY_TRANSFER,

    // Fuel
    Permission.FUEL_VIEW,
    Permission.FUEL_CREATE,
    Permission.FUEL_UPDATE,
    Permission.FUEL_EXPORT,

    // Trips
    Permission.TRIPS_VIEW,
    Permission.TRIPS_CREATE,
    Permission.TRIPS_UPDATE,
    Permission.TRIPS_DELETE,
    Permission.TRIPS_APPROVE,

    // Reports
    Permission.REPORTS_VIEW,
    Permission.REPORTS_CREATE,
    Permission.REPORTS_EXPORT,
    Permission.REPORTS_SCHEDULE,

    // Dashboards
    Permission.DASHBOARDS_VIEW,
    Permission.DASHBOARDS_CREATE,
    Permission.DASHBOARDS_CUSTOMIZE,

    // Communication
    Permission.MESSAGES_VIEW,
    Permission.MESSAGES_SEND,
    Permission.MESSAGES_DELETE,
    Permission.NOTIFICATIONS_MANAGE,

    // Documents
    Permission.DOCUMENTS_VIEW,
    Permission.DOCUMENTS_UPLOAD,
    Permission.DOCUMENTS_DELETE,
    Permission.DOCUMENTS_SHARE,

    // Users
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_UPDATE,
    Permission.USERS_DELETE,
    Permission.USERS_MANAGE_ROLES,

    // Settings
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,
    Permission.SETTINGS_MANAGE_INTEGRATIONS,

    // Audit
    Permission.AUDIT_LOGS_VIEW,
    Permission.AUDIT_LOGS_EXPORT,

    // API
    Permission.API_KEYS_VIEW,
    Permission.API_KEYS_CREATE,
    Permission.API_KEYS_DELETE,

    // Compliance
    Permission.COMPLIANCE_VIEW,
    Permission.COMPLIANCE_MANAGE,
    Permission.COMPLIANCE_AUDIT,
  ],

  // Fleet Manager: Operations-focused permissions
  [Role.FLEET_MANAGER]: [
    // Vehicles
    Permission.VEHICLES_VIEW,
    Permission.VEHICLES_UPDATE,
    Permission.VEHICLES_ASSIGN,
    Permission.VEHICLES_EXPORT,

    // Drivers
    Permission.DRIVERS_VIEW,
    Permission.DRIVERS_UPDATE,
    Permission.DRIVERS_ASSIGN,
    Permission.DRIVERS_EXPORT,

    // Maintenance
    Permission.MAINTENANCE_VIEW,
    Permission.MAINTENANCE_CREATE,
    Permission.MAINTENANCE_UPDATE,
    Permission.MAINTENANCE_EXPORT,

    // Work Orders
    Permission.WORK_ORDERS_VIEW,
    Permission.WORK_ORDERS_CREATE,
    Permission.WORK_ORDERS_UPDATE,
    Permission.WORK_ORDERS_ASSIGN,
    Permission.WORK_ORDERS_COMPLETE,

    // Facilities
    Permission.FACILITIES_VIEW,

    // Procurement
    Permission.PROCUREMENT_VIEW,
    Permission.PROCUREMENT_CREATE,

    // Inventory
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_TRANSFER,

    // Fuel
    Permission.FUEL_VIEW,
    Permission.FUEL_CREATE,
    Permission.FUEL_UPDATE,
    Permission.FUEL_EXPORT,

    // Trips
    Permission.TRIPS_VIEW,
    Permission.TRIPS_CREATE,
    Permission.TRIPS_UPDATE,
    Permission.TRIPS_APPROVE,

    // Reports
    Permission.REPORTS_VIEW,
    Permission.REPORTS_CREATE,
    Permission.REPORTS_EXPORT,

    // Dashboards
    Permission.DASHBOARDS_VIEW,
    Permission.DASHBOARDS_CUSTOMIZE,

    // Communication
    Permission.MESSAGES_VIEW,
    Permission.MESSAGES_SEND,

    // Documents
    Permission.DOCUMENTS_VIEW,
    Permission.DOCUMENTS_UPLOAD,
    Permission.DOCUMENTS_SHARE,

    // Compliance
    Permission.COMPLIANCE_VIEW,
  ],

  // Maintenance Manager: Maintenance-focused permissions
  [Role.MAINTENANCE_MANAGER]: [
    // Vehicles (view only)
    Permission.VEHICLES_VIEW,

    // Maintenance (full access)
    Permission.MAINTENANCE_VIEW,
    Permission.MAINTENANCE_CREATE,
    Permission.MAINTENANCE_UPDATE,
    Permission.MAINTENANCE_DELETE,
    Permission.MAINTENANCE_APPROVE,
    Permission.MAINTENANCE_EXPORT,

    // Work Orders (full access)
    Permission.WORK_ORDERS_VIEW,
    Permission.WORK_ORDERS_CREATE,
    Permission.WORK_ORDERS_UPDATE,
    Permission.WORK_ORDERS_DELETE,
    Permission.WORK_ORDERS_ASSIGN,
    Permission.WORK_ORDERS_COMPLETE,

    // Facilities
    Permission.FACILITIES_VIEW,

    // Procurement
    Permission.PROCUREMENT_VIEW,
    Permission.PROCUREMENT_CREATE,

    // Inventory
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_DELETE,
    Permission.INVENTORY_TRANSFER,

    // Reports
    Permission.REPORTS_VIEW,
    Permission.REPORTS_CREATE,
    Permission.REPORTS_EXPORT,

    // Dashboards
    Permission.DASHBOARDS_VIEW,

    // Communication
    Permission.MESSAGES_VIEW,
    Permission.MESSAGES_SEND,

    // Documents
    Permission.DOCUMENTS_VIEW,
    Permission.DOCUMENTS_UPLOAD,
    Permission.DOCUMENTS_SHARE,
  ],

  // Driver: Limited operational permissions
  [Role.DRIVER]: [
    // Vehicles (view only assigned)
    Permission.VEHICLES_VIEW,

    // Maintenance (view only)
    Permission.MAINTENANCE_VIEW,

    // Work Orders (view assigned)
    Permission.WORK_ORDERS_VIEW,

    // Fuel
    Permission.FUEL_VIEW,
    Permission.FUEL_CREATE,

    // Trips
    Permission.TRIPS_VIEW,
    Permission.TRIPS_CREATE,
    Permission.TRIPS_UPDATE,

    // Reports (view only)
    Permission.REPORTS_VIEW,

    // Dashboards
    Permission.DASHBOARDS_VIEW,

    // Communication
    Permission.MESSAGES_VIEW,
    Permission.MESSAGES_SEND,

    // Documents
    Permission.DOCUMENTS_VIEW,
  ],

  // Viewer: Read-only access
  [Role.VIEWER]: [
    // Vehicles
    Permission.VEHICLES_VIEW,

    // Drivers
    Permission.DRIVERS_VIEW,

    // Maintenance
    Permission.MAINTENANCE_VIEW,

    // Work Orders
    Permission.WORK_ORDERS_VIEW,

    // Facilities
    Permission.FACILITIES_VIEW,

    // Procurement
    Permission.PROCUREMENT_VIEW,

    // Inventory
    Permission.INVENTORY_VIEW,

    // Fuel
    Permission.FUEL_VIEW,

    // Trips
    Permission.TRIPS_VIEW,

    // Reports
    Permission.REPORTS_VIEW,

    // Dashboards
    Permission.DASHBOARDS_VIEW,

    // Communication
    Permission.MESSAGES_VIEW,

    // Documents
    Permission.DOCUMENTS_VIEW,
  ],
};

/**
 * Helper function to check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Helper function to check if a role has ALL of the specified permissions
 */
export function roleHasAllPermissions(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.every(permission => rolePermissions.includes(permission));
}

/**
 * Helper function to check if a role has ANY of the specified permissions
 */
export function roleHasAnyPermission(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.some(permission => rolePermissions.includes(permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Authorization failure reasons for audit logging
 */
export enum AuthorizationFailureReason {
  MISSING_PERMISSION = 'missing_permission',
  INSUFFICIENT_ROLE = 'insufficient_role',
  TENANT_MISMATCH = 'tenant_mismatch',
  RESOURCE_NOT_OWNED = 'resource_not_owned',
  ACCOUNT_SUSPENDED = 'account_suspended',
  INVALID_TOKEN = 'invalid_token',
}

/**
 * Authorization result for audit logging
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: AuthorizationFailureReason;
  requiredPermissions?: Permission[];
  userPermissions?: Permission[];
}
