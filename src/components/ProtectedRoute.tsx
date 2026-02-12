/**
 * Protected Route Component
 * CRIT-F-003: Role-Based Access Control for Frontend Routes
 *
 * This component wraps routes that require authentication and/or specific permissions.
 * It enforces RBAC at the UI level and redirects unauthorized users.
 *
 * Features:
 * - Authentication requirement check
 * - Role-based access control
 * - Permission-based access control
 * - Redirect to login or 403 page for unauthorized access
 * - Loading state handling
 *
 * @module components/ProtectedRoute
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth, UserRole } from '@/hooks/useAuth';
import logger from '@/utils/logger';

// Development auth bypass flag (reads from Vite environment variable)
// WARNING: ONLY set VITE_SKIP_AUTH=true in .env.local for local development/testing
// NEVER enable in production - enforced by production safety check below
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true' || import.meta.env.VITE_BYPASS_AUTH === 'true';

// Safety check: NEVER allow auth bypass in production
if (SKIP_AUTH && import.meta.env.PROD) {
  console.error('[SECURITY] Auth bypass attempted in production environment - BLOCKED');
  throw new Error('Auth bypass is not allowed in production');
}

// SKIP_AUTH mode - all routes will bypass authentication when enabled

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean; // Default: true
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string | string[];
  redirectTo?: string; // Default: '/login'
  fallback?: ReactNode; // Optional custom fallback for unauthorized
}

/**
 * ProtectedRoute component that enforces RBAC at the route level
 *
 * @example
 * // Require authentication only
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 *
 * @example
 * // Require specific role
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * @example
 * // Require multiple roles (user must have one of them)
 * <ProtectedRoute requiredRole={['admin', 'manager']}>
 *   <VehicleManagement />
 * </ProtectedRoute>
 *
 * @example
 * // Require specific permission
 * <ProtectedRoute requiredPermission="vehicle:delete">
 *   <DeleteVehicleButton />
 * </ProtectedRoute>
 *
 * @example
 * // Require both role AND permission
 * <ProtectedRoute requiredRole="manager" requiredPermission="vehicle:update">
 *   <EditVehicleForm />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole,
  requiredPermission,
  redirectTo = '/login',
  fallback
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, canAccess } = useAuth();

  // Auth state logging (development only, suppressed during loading to reduce noise)
  if (import.meta.env.DEV && !isLoading) {
    logger.debug('[ProtectedRoute] Auth state:', {
      isAuthenticated,
      hasUser: !!user,
      requireAuth,
    });
  }

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-9 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // DEV: Skip authentication if VITE_SKIP_AUTH=true in .env.local
  if (SKIP_AUTH) {
    logger.info('[ProtectedRoute] SKIP_AUTH enabled - auto-authorizing');
    return <>{children}</>;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    logger.warn('[ProtectedRoute] User not authenticated, redirecting to login', {
      hasUser: !!user,
      isAuthenticated,
      redirectTo
    });
    return <Navigate to={redirectTo} replace />;
  }

  // Check role and permission requirements
  if ((requiredRole || requiredPermission) && !canAccess(requiredRole, requiredPermission)) {
    logger.warn('ProtectedRoute: User lacks required role or permission', {
      userId: user?.id,
      userRole: user?.role,
      requiredRole,
      requiredPermission
    });

    // Show custom fallback or redirect to 403
    if (fallback) {
      return <>{fallback}</>;
    }

    return <Navigate to="/403" replace />;
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}

/**
 * Hook-based alternative for conditional rendering within components
 *
 * @example
 * const { canRender } = useProtectedContent({ requiredRole: 'admin' });
 *
 * return (
 *   <div>
 *     {

canRender ? <AdminTools /> : <AccessDenied />}
 *   </div>
 * );
 */
export function useProtectedContent({
  requiredRole,
  requiredPermission
}: {
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string | string[];
}) {
  const { user, isAuthenticated, canAccess } = useAuth();

  const canRender = isAuthenticated && canAccess(requiredRole, requiredPermission);

  return {
    canRender,
    user,
    isAuthenticated
  };
}

/**
 * Component wrapper for conditional rendering based on permissions
 * Use this for inline permission checks within a page
 *
 * @example
 * <RequirePermission permission="vehicle:delete">
 *   <Button onClick={deleteVehicle}>Delete</Button>
 * </RequirePermission>
 */
export function RequirePermission({
  permission,
  children,
  fallback = null
}: {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component wrapper for conditional rendering based on roles
 * Use this for inline role checks within a page
 *
 * @example
 * <RequireRole role="admin">
 *   <AdminControls />
 * </RequireRole>
 *
 * @example
 * <RequireRole role={['admin', 'manager']}>
 *   <ManagementPanel />
 * </RequireRole>
 */
export function RequireRole({
  role,
  children,
  fallback = null
}: {
  role: UserRole | UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasRole } = useAuth();

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default ProtectedRoute;