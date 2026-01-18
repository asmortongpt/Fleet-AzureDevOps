/**
 * Role-Based Navigation Configuration
 *
 * Maps RBAC roles to navigation items based on workflow requirements
 * and operational needs documented in FLEET_WORKFLOW_ANALYSIS.md
 *
 * RBAC Roles (from api/src/types/rbac.ts):
 * - SUPER_ADMIN (admin): Full system access
 * - TENANT_ADMIN (admin): Full tenant access
 * - FLEET_MANAGER (fleet_manager): Operations & resource management
 * - MAINTENANCE_MANAGER (maintenance_manager): Maintenance & work orders
 * - DRIVER (driver): Vehicle operations & trips
 * - VIEWER (viewer): Read-only access
 */

export type RBACRole =
  | 'super_admin'
  | 'admin'
  | 'tenant_admin'
  | 'fleet_manager'
  | 'manager'
  | 'maintenance_manager'
  | 'driver'
  | 'user'
  | 'viewer'
  | 'guest'
  // Legacy/alias roles
  | 'SuperAdmin'
  | 'Admin'
  | 'FleetAdmin'
  | 'Manager'
  | 'FleetManager'
  | 'Supervisor'
  | 'Dispatcher'
  | 'Mechanic'
  | 'Technician'
  | 'SafetyOfficer'
  | 'Finance'
  | 'Analyst'
  | 'Auditor'
  | 'Driver'
  | 'ReadOnly'
  | 'CTAOwner';

/**
 * Role-to-Navigation mapping based on workflow analysis
 *
 * Each role gets access to specific hubs based on their daily operational needs
 */
export const ROLE_NAVIGATION_CONFIG: Record<string, string[]> = {
  // ==================== SUPER ADMIN ====================
  'super_admin': [
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'safety-compliance-hub',
    'safety-hub',
    'policy-hub',
    'documents-hub',
    'procurement-hub-consolidated',
    'assets-hub-consolidated',
    'admin-hub-consolidated',
    'communication-hub-consolidated',
    'financial-hub-consolidated',
    'integrations-hub-consolidated',
    'cta-configuration-hub',
    'data-governance-hub',
    'work-hub',
    'people-hub',
    'insights-hub',
    'configuration-hub',
    'meta-glasses-hub'
  ],
  'SuperAdmin': [ // Alias
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'safety-compliance-hub',
    'safety-hub',
    'policy-hub',
    'documents-hub',
    'procurement-hub-consolidated',
    'assets-hub-consolidated',
    'admin-hub-consolidated',
    'communication-hub-consolidated',
    'financial-hub-consolidated',
    'integrations-hub-consolidated',
    'cta-configuration-hub',
    'data-governance-hub',
    'work-hub',
    'people-hub',
    'insights-hub',
    'configuration-hub',
    'meta-glasses-hub'
  ],

  // ==================== ADMIN / TENANT ADMIN ====================
  'admin': [
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'safety-compliance-hub',
    'safety-hub',
    'policy-hub',
    'documents-hub',
    'procurement-hub-consolidated',
    'assets-hub-consolidated',
    'admin-hub-consolidated',
    'communication-hub-consolidated',
    'financial-hub-consolidated',
    'integrations-hub-consolidated',
    'work-hub',
    'people-hub',
    'insights-hub',
    'configuration-hub'
  ],
  'tenant_admin': [
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'safety-compliance-hub',
    'policy-hub',
    'documents-hub',
    'procurement-hub-consolidated',
    'assets-hub-consolidated',
    'admin-hub-consolidated',
    'communication-hub-consolidated',
    'financial-hub-consolidated',
    'integrations-hub-consolidated'
  ],
  'Admin': [ // Alias
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'safety-compliance-hub',
    'policy-hub',
    'documents-hub',
    'procurement-hub-consolidated',
    'assets-hub-consolidated',
    'admin-hub-consolidated',
    'communication-hub-consolidated',
    'financial-hub-consolidated',
    'integrations-hub-consolidated'
  ],
  'FleetAdmin': [ // Alias
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'safety-compliance-hub',
    'policy-hub',
    'documents-hub',
    'procurement-hub-consolidated',
    'assets-hub-consolidated',
    'admin-hub-consolidated',
    'communication-hub-consolidated',
    'financial-hub-consolidated',
    'integrations-hub-consolidated'
  ],

  // ==================== FLEET MANAGER ====================
  'fleet_manager': [
    'fleet-hub-consolidated',       // PRIMARY: Fleet status, costs, assignments
    'operations-hub-consolidated',  // Routes, dispatch, scheduling
    'maintenance-hub-consolidated', // Overdue & upcoming maintenance
    'drivers-hub-consolidated',     // Driver management & assignments
    'analytics-hub-consolidated',   // Performance metrics
    'reports-hub',                  // Operational reports
    'documents-hub',                // Fleet documentation
    'procurement-hub-consolidated', // Vehicle purchases
    'assets-hub-consolidated',      // Asset tracking
    'communication-hub-consolidated', // Team communication
    'financial-hub-consolidated'    // Cost analysis
  ],
  'manager': [
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'documents-hub',
    'procurement-hub-consolidated',
    'assets-hub-consolidated',
    'communication-hub-consolidated',
    'financial-hub-consolidated'
  ],
  'Manager': [ // Alias
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'documents-hub',
    'procurement-hub-consolidated',
    'assets-hub-consolidated',
    'communication-hub-consolidated',
    'financial-hub-consolidated'
  ],
  'FleetManager': [ // Alias
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'documents-hub',
    'procurement-hub-consolidated',
    'assets-hub-consolidated',
    'communication-hub-consolidated',
    'financial-hub-consolidated'
  ],
  'Supervisor': [ // Alias - similar to manager
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'reports-hub',
    'documents-hub',
    'communication-hub-consolidated'
  ],

  // ==================== DISPATCHER ====================
  'Dispatcher': [
    'fleet-hub-consolidated',       // PRIMARY: Live map, vehicle locations
    'operations-hub-consolidated',  // Routes, dispatch console, emergency alerts
    'drivers-hub-consolidated',     // Driver contact & assignments
    'communication-hub-consolidated', // Dispatch radio channels
    'documents-hub'                 // Route documentation
  ],

  // ==================== MAINTENANCE MANAGER ====================
  'maintenance_manager': [
    'fleet-hub-consolidated',       // Vehicle status overview
    'maintenance-hub-consolidated', // PRIMARY: Work orders, schedules, parts
    'procurement-hub-consolidated', // Parts ordering
    'assets-hub-consolidated',      // Equipment tracking
    'reports-hub',                  // Maintenance reports
    'documents-hub',                // Service manuals
    'communication-hub-consolidated' // Technician coordination
  ],
  'Mechanic': [ // Alias
    'fleet-hub-consolidated',
    'maintenance-hub-consolidated',
    'documents-hub'
  ],
  'Technician': [ // Alias
    'fleet-hub-consolidated',
    'maintenance-hub-consolidated',
    'documents-hub'
  ],

  // ==================== DRIVER ====================
  'driver': [
    'fleet-hub-consolidated',       // PRIMARY: My assigned vehicle
    'operations-hub-consolidated',  // My routes & trips
    'documents-hub'                 // Vehicle manuals, policies
  ],
  'Driver': [ // Alias
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'documents-hub'
  ],
  'user': [
    'fleet-hub-consolidated',
    'operations-hub-consolidated',
    'documents-hub'
  ],

  // ==================== SAFETY OFFICER ====================
  'SafetyOfficer': [
    'fleet-hub-consolidated',
    'drivers-hub-consolidated',
    'safety-compliance-hub',
    'policy-hub',
    'documents-hub',
    'communication-hub-consolidated',
    'reports-hub'
  ],

  // ==================== FINANCE ====================
  'Finance': [
    'fleet-hub-consolidated',
    'financial-hub-consolidated',
    'procurement-hub-consolidated',
    'assets-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'integrations-hub-consolidated'
  ],

  // ==================== ANALYST ====================
  'Analyst': [
    'fleet-hub-consolidated',
    'analytics-hub-consolidated',
    'reports-hub',
    'financial-hub-consolidated',
    'operations-hub-consolidated',
    'maintenance-hub-consolidated',
    'drivers-hub-consolidated',
    'assets-hub-consolidated',
    'documents-hub'
  ],

  // ==================== AUDITOR ====================
  'Auditor': [
    'fleet-hub-consolidated',
    'safety-compliance-hub',
    'policy-hub',
    'reports-hub',
    'analytics-hub-consolidated',
    'financial-hub-consolidated',
    'documents-hub'
  ],

  // ==================== VIEWER / READ-ONLY ====================
  'viewer': [
    'fleet-hub-consolidated',
    'reports-hub',
    'documents-hub'
  ],
  'ReadOnly': [
    'fleet-hub-consolidated',
    'reports-hub',
    'documents-hub'
  ],
  'guest': [
    'fleet-hub-consolidated'
  ]
};

/**
 * Get navigation items accessible to a specific role
 */
export function getNavigationItemsForRole(userRole: string): string[] {
  // Normalize role to lowercase for comparison
  const normalizedRole = userRole.toLowerCase().replace(/-/g, '_');

  // Try exact match first
  if (ROLE_NAVIGATION_CONFIG[userRole]) {
    return ROLE_NAVIGATION_CONFIG[userRole];
  }

  // Try normalized role
  if (ROLE_NAVIGATION_CONFIG[normalizedRole]) {
    return ROLE_NAVIGATION_CONFIG[normalizedRole];
  }

  // Fallback to viewer access if role not found
  console.warn(`[Navigation] Unknown role "${userRole}", falling back to viewer access`);
  return ROLE_NAVIGATION_CONFIG.viewer;
}

/**
 * Check if a user role has access to a specific navigation item
 */
export function canAccessNavigationItem(userRole: string, itemId: string): boolean {
  const allowedItems = getNavigationItemsForRole(userRole);
  return allowedItems.includes(itemId);
}

/**
 * Priority order for each role (determines default landing page)
 * Lower number = higher priority
 */
export const ROLE_HOME_PAGE: Record<string, string> = {
  // Super Admin & Admin - Full overview
  'super_admin': 'fleet-hub-consolidated',
  'SuperAdmin': 'fleet-hub-consolidated',
  'admin': 'fleet-hub-consolidated',
  'tenant_admin': 'fleet-hub-consolidated',
  'Admin': 'fleet-hub-consolidated',
  'FleetAdmin': 'fleet-hub-consolidated',

  // Fleet Manager - Operations focus
  'fleet_manager': 'fleet-hub-consolidated',
  'manager': 'fleet-hub-consolidated',
  'Manager': 'fleet-hub-consolidated',
  'FleetManager': 'fleet-hub-consolidated',
  'Supervisor': 'fleet-hub-consolidated',

  // Dispatcher - Operations/routes
  'Dispatcher': 'operations-hub-consolidated',

  // Maintenance Manager - Work orders
  'maintenance_manager': 'maintenance-hub-consolidated',
  'Mechanic': 'maintenance-hub-consolidated',
  'Technician': 'maintenance-hub-consolidated',

  // Driver - My vehicle
  'driver': 'fleet-hub-consolidated', // Will show driver-specific view
  'Driver': 'fleet-hub-consolidated',
  'user': 'fleet-hub-consolidated',

  // Specialists
  'SafetyOfficer': 'safety-compliance-hub',
  'Finance': 'financial-hub-consolidated',
  'Analyst': 'analytics-hub-consolidated',
  'Auditor': 'safety-compliance-hub',

  // Viewers
  'viewer': 'fleet-hub-consolidated',
  'ReadOnly': 'fleet-hub-consolidated',
  'guest': 'fleet-hub-consolidated'
};

/**
 * Get the default home page for a user role
 */
export function getHomePageForRole(userRole: string): string {
  return ROLE_HOME_PAGE[userRole] || 'fleet-hub-consolidated';
}
