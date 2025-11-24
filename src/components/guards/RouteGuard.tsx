/**
 * Route Guard Component
 * Protects routes based on module/permission requirements
 */

import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissionContext } from '../../contexts/PermissionContext';
import { UserRole } from '../../hooks/usePermissions';

interface RouteGuardProps {
  children: ReactNode;
  module?: string;
  requiredRole?: UserRole | UserRole[];
  requiredAction?: string;
  fallbackPath?: string;
  showLoading?: boolean;
}

/**
 * RouteGuard Component
 * Checks if user has access to a route based on module or role
 */
export function RouteGuard({
  children,
  module,
  requiredRole,
  requiredAction,
  fallbackPath = '/403',
  showLoading = true
}: RouteGuardProps) {
  const location = useLocation();
  const {
    isLoading,
    hasModule,
    hasRole,
    hasAnyRole,
    can
  } = usePermissionContext();

  // Show loading state while permissions are being fetched
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking permissions...</span>
      </div>
    );
  }

  // Check module access
  if (module && !hasModule(module)) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role access
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!hasAnyRole(...roles)) {
      return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }
  }

  // Check action permission
  if (requiredAction && !can(requiredAction)) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Admin-only route guard
 */
export function AdminRoute({ children, fallbackPath = '/403' }: { children: ReactNode; fallbackPath?: string }) {
  return (
    <RouteGuard requiredRole="Admin" fallbackPath={fallbackPath}>
      {children}
    </RouteGuard>
  );
}

/**
 * Fleet Manager or Admin route guard
 */
export function ManagerRoute({ children, fallbackPath = '/403' }: { children: ReactNode; fallbackPath?: string }) {
  return (
    <RouteGuard requiredRole={['Admin', 'FleetManager']} fallbackPath={fallbackPath}>
      {children}
    </RouteGuard>
  );
}

/**
 * Finance access route guard
 */
export function FinanceRoute({ children, fallbackPath = '/403' }: { children: ReactNode; fallbackPath?: string }) {
  return (
    <RouteGuard requiredRole={['Admin', 'Finance']} fallbackPath={fallbackPath}>
      {children}
    </RouteGuard>
  );
}

/**
 * Safety access route guard
 */
export function SafetyRoute({ children, fallbackPath = '/403' }: { children: ReactNode; fallbackPath?: string }) {
  return (
    <RouteGuard requiredRole={['Admin', 'Safety']} fallbackPath={fallbackPath}>
      {children}
    </RouteGuard>
  );
}

/**
 * Module-based route guard (shorter syntax)
 */
export function ModuleRoute({
  children,
  module,
  fallbackPath = '/403'
}: {
  children: ReactNode;
  module: string;
  fallbackPath?: string;
}) {
  return (
    <RouteGuard module={module} fallbackPath={fallbackPath}>
      {children}
    </RouteGuard>
  );
}
