/**
 * Permission Context
 * Global context for user permissions
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { usePermissions, UserPermissions, UserRole } from '../hooks/usePermissions';

interface PermissionContextValue {
  permissions: UserPermissions | undefined;
  isLoading: boolean;
  isError: boolean;
  can: (action: string, resource?: any) => boolean;
  hasModule: (moduleName: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (...roles: UserRole[]) => boolean;
  canAccessField: (resourceType: string, fieldName: string) => boolean;
  visibleModules: string[];
  checkPermissionServer: (request: any) => Promise<boolean>;
  isAdmin: boolean;
  isFleetManager: boolean;
  isDriver: boolean;
  isAuditor: boolean;
  canViewFinancial: boolean;
  canManageMaintenance: boolean;
  canViewSafety: boolean;
  refetch: () => void;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

/**
 * Permission Provider Component
 * Wraps the application to provide permission context
 */
export function PermissionProvider({ children }: PermissionProviderProps) {
  const permissionData = usePermissions();

  return (
    <PermissionContext.Provider value={permissionData}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access permission context
 * Throws error if used outside PermissionProvider
 */
export function usePermissionContext(): PermissionContextValue {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }

  return context;
}

/**
 * Optional: Hook with graceful fallback for contexts where permissions might not be loaded
 */
export function useOptionalPermissionContext(): PermissionContextValue | null {
  return useContext(PermissionContext) || null;
}
