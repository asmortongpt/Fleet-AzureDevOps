/**
 * Protected Route Component
 * Wraps routes that require authentication and/or specific roles/permissions
 * SECURITY (CRIT-F-003): Implements route-level access control with RBAC
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ProtectedRouteProps {
  children: ReactNode;
  /** Required role(s) to access this route */
  requireRole?: UserRole | UserRole[];
  /** Required permission(s) to access this route */
  requirePermission?: string | string[];
  /** Redirect path when access is denied (default: /login) */
  redirectTo?: string;
  /** Show access denied message instead of redirecting */
  showAccessDenied?: boolean;
  /** Custom access denied component */
  accessDeniedComponent?: ReactNode;
}

/**
 * Protected Route Component
 * Ensures user is authenticated and has required role/permissions
 */
export function ProtectedRoute({
  children,
  requireRole,
  requirePermission,
  redirectTo = '/login',
  showAccessDenied = false,
  accessDeniedComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, canAccess, user, logout } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // Check role and permission requirements
  const hasAccess = canAccess(requireRole, requirePermission);

  if (!hasAccess) {
    // Show custom access denied component if provided
    if (accessDeniedComponent) {
      return <>{accessDeniedComponent}</>;
    }

    // Show access denied message
    if (showAccessDenied) {
      return (
        <div className="flex items-center justify-center min-h-screen p-6">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-destructive" />
                <CardTitle>Access Denied</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Insufficient Permissions</AlertTitle>
                <AlertDescription>
                  You don't have the required permissions to access this page.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Your role:</strong> {user?.role || 'Unknown'}
                </p>
                {requireRole && (
                  <p>
                    <strong>Required role:</strong>{' '}
                    {Array.isArray(requireRole) ? requireRole.join(' or ') : requireRole}
                  </p>
                )}
                {requirePermission && (
                  <p>
                    <strong>Required permission:</strong>{' '}
                    {Array.isArray(requirePermission) ? requirePermission.join(' or ') : requirePermission}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="flex-1"
                >
                  Go Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={logout}
                  className="flex-1"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Redirect to unauthorized page
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location, requireRole, requirePermission }}
        replace
      />
    );
  }

  // User has access - render children
  return <>{children}</>;
}

/**
 * Require Authentication HOC
 * Simpler wrapper that only checks if user is authenticated
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

/**
 * Require Role HOC
 * Wrapper that checks for specific role(s)
 */
export function RequireRole({
  role,
  children,
}: {
  role: UserRole | UserRole[];
  children: ReactNode;
}) {
  return <ProtectedRoute requireRole={role}>{children}</ProtectedRoute>;
}

/**
 * Require Permission HOC
 * Wrapper that checks for specific permission(s)
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: string | string[];
  children: ReactNode;
}) {
  return <ProtectedRoute requirePermission={permission}>{children}</ProtectedRoute>;
}

/**
 * Admin Only Route
 * Requires Admin or SuperAdmin role
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      requireRole={['Admin', 'SuperAdmin']}
      showAccessDenied
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * SuperAdmin Only Route
 * Requires SuperAdmin role
 */
export function SuperAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      requireRole="SuperAdmin"
      showAccessDenied
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Manager+ Route
 * Requires Manager, Admin, or SuperAdmin role
 */
export function ManagerRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      requireRole={['Manager', 'Admin', 'SuperAdmin']}
      showAccessDenied
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Read-Only Guard
 * Prevents ReadOnly users from accessing the route
 */
export function NoReadOnlyRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user?.role === 'ReadOnly') {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-destructive" />
              <CardTitle>Read-Only Access</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Limited Access</AlertTitle>
              <AlertDescription>
                Your account has read-only access. You cannot perform this action.
                Please contact your administrator to upgrade your permissions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
