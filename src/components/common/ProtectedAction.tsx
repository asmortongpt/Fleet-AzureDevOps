/**
 * Protected Action Component - Conditionally render UI based on permissions
 *
 * Created: 2025-12-31 (Agent 7)
 */

import React from 'react';

import { useRBAC } from '@/hooks/useRBAC';
import { Permission, Resource } from '@/lib/rbac';

interface ProtectedActionProps {
  children: React.ReactNode;
  permission: Permission;
  resource: Resource;
  fallback?: React.ReactNode;
}

/**
 * Conditionally render children based on RBAC permissions
 */
export function ProtectedAction({
  children,
  permission,
  resource,
  fallback = null,
}: ProtectedActionProps) {
  const rbac = useRBAC();
  const hasAccess = rbac.checkAccess(permission, resource);

  return <>{hasAccess ? children : fallback}</>;
}
