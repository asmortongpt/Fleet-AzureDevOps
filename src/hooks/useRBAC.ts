/**
 * RBAC React Hook - Easy permission checking in components
 *
 * Created: 2025-12-31 (Agent 7)
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  Role,
  Permission,
  Resource,
  hasPermission,
  canAccessResource,
  checkAccess,
  getRolePermissions,
  getRoleResources,
} from '@/lib/rbac';

export interface RBACHook {
  role: Role;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (resource: Resource) => boolean;
  checkAccess: (permission: Permission, resource: Resource) => boolean;
  permissions: Permission[];
  resources: Resource[];
  isAdmin: boolean;
  isManager: boolean;
  isOperator: boolean;
  isViewer: boolean;
}

/**
 * Hook to check RBAC permissions in components
 */
export function useRBAC(): RBACHook {
  const { user } = useAuth();

  // Get user's role (default to 'viewer' if not set)
  const role: Role = (user?.role?.toLowerCase() as Role) || 'viewer';
  const userId = user?.id || user?.email || 'anonymous';

  const rbac = useMemo(() => {
    return {
      role,
      hasPermission: (permission: Permission) => hasPermission(role, permission),
      canAccess: (resource: Resource) => canAccessResource(role, resource),
      checkAccess: (permission: Permission, resource: Resource) =>
        checkAccess(userId, role, permission, resource),
      permissions: getRolePermissions(role),
      resources: getRoleResources(role),
      isAdmin: role === 'admin',
      isManager: role === 'manager',
      isOperator: role === 'operator',
      isViewer: role === 'viewer',
    };
  }, [role, userId]);

  return rbac;
}
