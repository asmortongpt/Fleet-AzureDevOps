/**
 * RBAC UI Guard Components
 * Conditionally render UI elements based on user roles and permissions
 * SECURITY (CRIT-F-003): Client-side rendering control (NOT a security boundary)
 */

import { ReactNode } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Permission } from '@/middleware/rbac';

export interface RBACGuardProps {
  children: ReactNode;
  /** Required role(s) to render children */
  requireRole?: UserRole | UserRole[];
  /** Required permission(s) to render children */
  requirePermission?: Permission | Permission[];
  /** Fallback content when access is denied */
  fallback?: ReactNode;
  /** Require both role AND permission (default: false - requires either) */
  requireBoth?: boolean;
}

/**
 * RBAC Guard Component
 * Renders children only if user has required role/permission
 *
 * @example
 * <RBACGuard requireRole="Admin">
 *   <Button>Admin Only Button</Button>
 * </RBACGuard>
 *
 * @example
 * <RBACGuard requirePermission="vehicles:delete" fallback={<p>No access</p>}>
 *   <DeleteButton />
 * </RBACGuard>
 */
export function RBACGuard({
  children,
  requireRole,
  requirePermission,
  fallback = null,
  requireBoth = false,
}: RBACGuardProps) {
  const { canAccess, hasRole, hasPermission } = useAuth();

  // Check access based on requireBoth flag
  let hasAccess: boolean;

  if (requireBoth && requireRole && requirePermission) {
    // User must have BOTH role AND permission
    hasAccess = hasRole(requireRole) && hasPermission(requirePermission as string | string[]);
  } else {
    // User must have EITHER role OR permission (or both if specified)
    hasAccess = canAccess(requireRole, requirePermission as string | string[]);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Show Only For Role
 * Renders children only for specific role(s)
 */
export function ShowForRole({
  role,
  children,
  fallback,
}: {
  role: UserRole | UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RBACGuard requireRole={role} fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

/**
 * Show Only For Permission
 * Renders children only if user has specific permission(s)
 */
export function ShowForPermission({
  permission,
  children,
  fallback,
}: {
  permission: Permission | Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RBACGuard requirePermission={permission} fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

/**
 * Hide For Role
 * Hides children for specific role(s)
 */
export function HideForRole({
  role,
  children,
}: {
  role: UserRole | UserRole[];
  children: ReactNode;
}) {
  const { hasRole } = useAuth();
  const shouldHide = hasRole(role);

  if (shouldHide) {
    return null;
  }

  return <>{children}</>;
}

/**
 * SuperAdmin Only
 * Renders children only for SuperAdmin users
 */
export function SuperAdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RBACGuard requireRole="SuperAdmin" fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

/**
 * Admin Only
 * Renders children only for Admin or SuperAdmin users
 */
export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RBACGuard requireRole={['Admin', 'SuperAdmin']} fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

/**
 * Manager Only
 * Renders children only for Manager, Admin, or SuperAdmin users
 */
export function ManagerOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RBACGuard requireRole={['Manager', 'Admin', 'SuperAdmin']} fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

/**
 * Not ReadOnly
 * Renders children for all roles except ReadOnly
 */
export function NotReadOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();

  if (user?.role === 'ReadOnly') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * ReadOnly Only
 * Renders children only for ReadOnly users
 */
export function ReadOnlyOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RBACGuard requireRole="ReadOnly" fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

/**
 * Can Create
 * Renders children if user has create permission for a resource
 */
export function CanCreate({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RBACGuard
      requirePermission={`${resource}:create` as Permission}
      fallback={fallback}
    >
      {children}
    </RBACGuard>
  );
}

/**
 * Can Update
 * Renders children if user has update permission for a resource
 */
export function CanUpdate({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RBACGuard
      requirePermission={`${resource}:update` as Permission}
      fallback={fallback}
    >
      {children}
    </RBACGuard>
  );
}

/**
 * Can Delete
 * Renders children if user has delete permission for a resource
 */
export function CanDelete({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RBACGuard
      requirePermission={`${resource}:delete` as Permission}
      fallback={fallback}
    >
      {children}
    </RBACGuard>
  );
}

/**
 * Can Approve
 * Renders children if user has approve permission for a resource
 */
export function CanApprove({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RBACGuard
      requirePermission={`${resource}:approve` as Permission}
      fallback={fallback}
    >
      {children}
    </RBACGuard>
  );
}

/**
 * useRBAC Hook
 * Provides RBAC utility functions for conditional logic
 *
 * @example
 * const { canCreate, canUpdate, canDelete, isAdmin } = useRBAC();
 *
 * if (canDelete('vehicles')) {
 *   // Show delete button
 * }
 */
export function useRBAC() {
  const { hasRole, hasPermission, isRole, isSuperAdmin } = useAuth();

  const canCreate = (resource: string) =>
    hasPermission(`${resource}:create` as Permission);

  const canRead = (resource: string) =>
    hasPermission(`${resource}:read` as Permission);

  const canUpdate = (resource: string) =>
    hasPermission(`${resource}:update` as Permission);

  const canDelete = (resource: string) =>
    hasPermission(`${resource}:delete` as Permission);

  const canApprove = (resource: string) =>
    hasPermission(`${resource}:approve` as Permission);

  const isAdmin = () => hasRole(['Admin', 'SuperAdmin']);
  const isManager = () => hasRole(['Manager', 'Admin', 'SuperAdmin']);
  const isReadOnly = () => isRole('ReadOnly');

  return {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canApprove,
    isAdmin,
    isManager,
    isReadOnly,
    isSuperAdmin: isSuperAdmin(),
    hasRole,
    hasPermission,
  };
}
