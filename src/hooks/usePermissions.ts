/**
 * usePermissions Hook
 * React hook for accessing user permissions and checking authorization
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import axios from 'axios';

export type UserRole =
  | 'Admin'
  | 'FleetManager'
  | 'MaintenanceManager'
  | 'Inspector'
  | 'Driver'
  | 'Finance'
  | 'Safety'
  | 'Auditor'
  | 'Vendor';

export interface ModuleConfig {
  name: string;
  description: string;
  roles: UserRole[];
}

export interface UserPermissions {
  user_id: string;
  roles: UserRole[];
  visible_modules: string[];
  module_configs: Record<string, ModuleConfig>;
  permissions: {
    can_access_admin: boolean;
    can_manage_users: boolean;
    can_view_financial: boolean;
    can_manage_maintenance: boolean;
    can_view_safety_data: boolean;
    is_auditor: boolean;
  };
}

export interface PermissionCheckRequest {
  action: string;
  resource?: any;
  resourceType?: string;
}

export interface PermissionCheckResponse {
  allowed: boolean;
  reason?: string;
  conditions?: string[];
}

/**
 * Fetch user permissions from API
 */
async function fetchPermissions(): Promise<UserPermissions> {
  const response = await axios.get('/api/v1/me/permissions');
  return response.data;
}

/**
 * Check permission for a specific action
 */
async function checkPermission(request: PermissionCheckRequest): Promise<PermissionCheckResponse> {
  const response = await axios.post('/api/v1/permissions/check', request);
  return response.data;
}

/**
 * Main permissions hook
 */
export function usePermissions() {
  const {
    data: permissions,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<UserPermissions>({
    queryKey: ['user-permissions'],
    queryFn: fetchPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2
  });

  /**
   * Check if user can perform an action (client-side check)
   * Note: This is for UI hints only. Server-side validation is required.
   */
  const can = useMemo(
    () => (action: string, resource?: any) => {
      if (!permissions) return false;

      // Admin can do everything
      if (permissions.roles.includes('Admin')) return true;

      // Map common actions to permission checks
      const actionRoleMap: Record<string, UserRole[]> = {
        'vehicle.create': ['Admin', 'FleetManager'],
        'vehicle.update': ['Admin', 'FleetManager'],
        'vehicle.delete': ['Admin'],
        'vehicle.read': ['Admin', 'FleetManager', 'MaintenanceManager', 'Inspector', 'Driver', 'Finance', 'Safety', 'Auditor', 'Vendor'],
        'garage.view': ['Admin', 'FleetManager', 'MaintenanceManager', 'Inspector', 'Driver', 'Finance', 'Safety', 'Auditor', 'Vendor'],
        'garage.toggleValuePanel': ['Admin', 'Finance', 'FleetManager'],
        'damage.edit': ['Admin', 'FleetManager', 'Inspector'],
        'damage.addManual': ['Admin', 'FleetManager', 'Inspector'],
        'damage.autoApprove': ['Admin', 'FleetManager', 'Safety'],
        'scan.create': ['Admin', 'FleetManager', 'MaintenanceManager', 'Inspector'],
        'scan.delete': ['Admin'],
        'maint.addRecord': ['Admin', 'MaintenanceManager'],
        'maint.editRecord': ['Admin', 'MaintenanceManager'],
        'maint.closeWorkOrder': ['Admin', 'MaintenanceManager', 'Vendor'],
        'crash.read': ['Admin', 'FleetManager', 'Safety', 'Auditor'],
        'crash.create': ['Admin', 'FleetManager', 'Safety'],
        'crash.edit': ['Admin', 'Safety'],
        'value.read': ['Admin', 'Finance', 'FleetManager'],
        'value.setPurchase': ['Admin', 'Finance'],
        'value.overrideMarket': ['Admin', 'Finance'],
        'reports.generate': ['Admin', 'FleetManager', 'MaintenanceManager', 'Finance', 'Safety', 'Auditor'],
        'reports.export': ['Admin', 'FleetManager', 'MaintenanceManager', 'Finance', 'Safety', 'Auditor']
      };

      const allowedRoles = actionRoleMap[action];

      if (!allowedRoles) {
        // Unknown action - assume not allowed
        return false;
      }

      // Check if user has any of the required roles
      return permissions.roles.some(role => allowedRoles.includes(role));
    },
    [permissions]
  );

  /**
   * Check if user has access to a module
   */
  const hasModule = useMemo(
    () => (moduleName: string) => {
      if (!permissions) return false;
      return permissions.visible_modules.includes(moduleName);
    },
    [permissions]
  );

  /**
   * Check if user has a specific role
   */
  const hasRole = useMemo(
    () => (role: UserRole) => {
      if (!permissions) return false;
      return permissions.roles.includes(role);
    },
    [permissions]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useMemo(
    () => (...roles: UserRole[]) => {
      if (!permissions) return false;
      return permissions.roles.some(role => roles.includes(role));
    },
    [permissions]
  );

  /**
   * Get visible modules
   */
  const visibleModules = useMemo(
    () => permissions?.visible_modules || [],
    [permissions]
  );

  /**
   * Check if user can access a field
   */
  const canAccessField = useMemo(
    () => (resourceType: string, fieldName: string) => {
      if (!permissions) return false;

      // Admin can access all fields
      if (permissions.roles.includes('Admin')) return true;

      // Field visibility rules (matches backend config)
      const fieldRules: Record<string, Record<string, UserRole[]>> = {
        vehicle: {
          purchase_price: ['Admin', 'Finance'],
          current_value: ['Admin', 'Finance'],
          depreciation_data: ['Admin', 'Finance'],
          crash_history: ['Admin', 'FleetManager', 'Safety', 'Auditor'],
          crash_claim_number: ['Admin', 'Safety'],
          police_report: ['Admin', 'Safety']
        },
        garage_hud: {
          purchase_price: ['Admin', 'Finance'],
          current_value: ['Admin', 'Finance'],
          depreciation_chart: ['Admin', 'Finance'],
          crash_details_panel: ['Admin', 'FleetManager', 'Safety'],
          maintenance_costs: ['Admin', 'Finance', 'MaintenanceManager']
        },
        maintenance: {
          cost: ['Admin', 'Finance', 'MaintenanceManager'],
          labor_hours: ['Admin', 'MaintenanceManager'],
          labor_rate: ['Admin', 'MaintenanceManager']
        }
      };

      const resourceRules = fieldRules[resourceType];
      if (!resourceRules) return true; // No rules = accessible

      const fieldRule = resourceRules[fieldName];
      if (!fieldRule) return true; // No rule for field = accessible

      return permissions.roles.some(role => fieldRule.includes(role));
    },
    [permissions]
  );

  /**
   * Server-side permission check (for critical actions)
   */
  const checkPermissionServer = async (request: PermissionCheckRequest): Promise<boolean> => {
    try {
      const result = await checkPermission(request);
      return result.allowed;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };

  return {
    permissions,
    isLoading,
    isError,
    error,
    refetch,
    can,
    hasModule,
    hasRole,
    hasAnyRole,
    canAccessField,
    visibleModules,
    checkPermissionServer,
    // Convenience flags
    isAdmin: permissions?.roles.includes('Admin') || false,
    isFleetManager: permissions?.roles.includes('FleetManager') || false,
    isDriver: permissions?.roles.includes('Driver') || false,
    isAuditor: permissions?.roles.includes('Auditor') || false,
    canViewFinancial: permissions?.permissions.can_view_financial || false,
    canManageMaintenance: permissions?.permissions.can_manage_maintenance || false,
    canViewSafety: permissions?.permissions.can_view_safety_data || false
  };
}

/**
 * Hook for checking a specific permission
 */
export function usePermission(action: string, resource?: any) {
  const { can, isLoading } = usePermissions();

  return {
    allowed: can(action, resource),
    isLoading
  };
}

/**
 * Hook for checking module access
 */
export function useModuleAccess(moduleName: string) {
  const { hasModule, isLoading } = usePermissions();

  return {
    hasAccess: hasModule(moduleName),
    isLoading
  };
}
