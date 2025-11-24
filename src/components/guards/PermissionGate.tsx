/**
 * Permission Gate Component
 * Conditionally renders children based on permissions
 */

import React, { ReactNode } from 'react';
import { usePermissionContext } from '../../contexts/PermissionContext';
import { UserRole } from '../../hooks/usePermissions';
import { Tooltip } from '../ui/tooltip';

interface PermissionGateProps {
  children: ReactNode;
  action?: string;
  module?: string;
  role?: UserRole | UserRole[];
  field?: { resourceType: string; fieldName: string };
  fallback?: ReactNode;
  showTooltip?: boolean;
  tooltipMessage?: string;
  hideIfDenied?: boolean;
}

/**
 * PermissionGate Component
 * Shows/hides UI elements based on permissions
 */
export function PermissionGate({
  children,
  action,
  module,
  role,
  field,
  fallback,
  showTooltip = false,
  tooltipMessage,
  hideIfDenied = false
}: PermissionGateProps) {
  const {
    can,
    hasModule,
    hasRole,
    hasAnyRole,
    canAccessField,
    isLoading
  } = usePermissionContext();

  // Show loading state (optional)
  if (isLoading) {
    return hideIfDenied ? null : <>{children}</>;
  }

  let hasPermission = true;

  // Check action permission
  if (action) {
    hasPermission = hasPermission && can(action);
  }

  // Check module access
  if (module) {
    hasPermission = hasPermission && hasModule(module);
  }

  // Check role access
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    hasPermission = hasPermission && hasAnyRole(...roles);
  }

  // Check field access
  if (field) {
    hasPermission = hasPermission && canAccessField(field.resourceType, field.fieldName);
  }

  // If permission denied
  if (!hasPermission) {
    // Hide completely if requested
    if (hideIfDenied) {
      return null;
    }

    // Show fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Show disabled state with tooltip
    if (showTooltip) {
      const message = tooltipMessage || 'You do not have permission to access this feature';

      return (
        <Tooltip content={message}>
          <div className="opacity-50 cursor-not-allowed pointer-events-none">
            {children}
          </div>
        </Tooltip>
      );
    }

    // Show disabled state without tooltip
    return (
      <div className="opacity-50 cursor-not-allowed pointer-events-none">
        {children}
      </div>
    );
  }

  // Permission granted, render children normally
  return <>{children}</>;
}

/**
 * Shorthand for action-based gates
 */
export function ActionGate({
  children,
  action,
  fallback,
  hideIfDenied = false
}: {
  children: ReactNode;
  action: string;
  fallback?: ReactNode;
  hideIfDenied?: boolean;
}) {
  return (
    <PermissionGate action={action} fallback={fallback} hideIfDenied={hideIfDenied}>
      {children}
    </PermissionGate>
  );
}

/**
 * Shorthand for role-based gates
 */
export function RoleGate({
  children,
  role,
  fallback,
  hideIfDenied = false
}: {
  children: ReactNode;
  role: UserRole | UserRole[];
  fallback?: ReactNode;
  hideIfDenied?: boolean;
}) {
  return (
    <PermissionGate role={role} fallback={fallback} hideIfDenied={hideIfDenied}>
      {children}
    </PermissionGate>
  );
}

/**
 * Admin-only gate
 */
export function AdminGate({
  children,
  fallback,
  hideIfDenied = true
}: {
  children: ReactNode;
  fallback?: ReactNode;
  hideIfDenied?: boolean;
}) {
  return (
    <PermissionGate role="Admin" fallback={fallback} hideIfDenied={hideIfDenied}>
      {children}
    </PermissionGate>
  );
}

/**
 * Finance-only gate
 */
export function FinanceGate({
  children,
  fallback,
  hideIfDenied = true
}: {
  children: ReactNode;
  fallback?: ReactNode;
  hideIfDenied?: boolean;
}) {
  return (
    <PermissionGate role={['Admin', 'Finance']} fallback={fallback} hideIfDenied={hideIfDenied}>
      {children}
    </PermissionGate>
  );
}

/**
 * Field-level gate (for conditional field display)
 */
export function FieldGate({
  children,
  resourceType,
  fieldName,
  hideIfDenied = true
}: {
  children: ReactNode;
  resourceType: string;
  fieldName: string;
  hideIfDenied?: boolean;
}) {
  return (
    <PermissionGate
      field={{ resourceType, fieldName }}
      hideIfDenied={hideIfDenied}
    >
      {children}
    </PermissionGate>
  );
}
