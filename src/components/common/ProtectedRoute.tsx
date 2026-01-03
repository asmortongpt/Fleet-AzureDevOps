/**
 * Protected Route Component - RBAC-aware routing
 *
 * Created: 2025-12-31 (Agent 7)
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRBAC } from '@/hooks/useRBAC';
import { Resource } from '@/lib/rbac';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredResource?: Resource;
  fallbackPath?: string;
  showDeniedMessage?: boolean;
}

/**
 * Wrapper component that protects routes based on RBAC permissions
 */
export function ProtectedRoute({
  children,
  requiredResource,
  fallbackPath = '/',
  showDeniedMessage = true,
}: ProtectedRouteProps) {
  const rbac = useRBAC();

  // If no resource requirement, render children
  if (!requiredResource) {
    return <>{children}</>;
  }

  // Check if user can access the resource
  const hasAccess = rbac.canAccess(requiredResource);

  if (!hasAccess) {
    if (showDeniedMessage) {
      return (
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access this resource. Required resource: {requiredResource}.
              Your role ({rbac.role}) does not have access.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
