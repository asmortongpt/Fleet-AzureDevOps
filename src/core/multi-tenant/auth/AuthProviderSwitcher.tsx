/**
 * Authentication Provider Switcher
 * Production-only wrapper around the primary AuthContext (MSAL-backed).
 * Mock authentication is intentionally not supported.
 */

import type { ReactNode } from 'react';
import React from 'react';

import { useAuth } from '@/contexts';

interface AuthProviderSwitcherProps {
  children: ReactNode;
}

interface UniversalAuthContext {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: any) => boolean;
  getAuthHeaders: () => Promise<Record<string, string>>;
  authMode: 'msal';
}

export const useUniversalAuth = (): UniversalAuthContext => {
  const auth = useAuth();

  return {
    user: auth.user,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    login: async (username?: string) => auth.login(username || '', ''),
    logout: auth.logout,
    hasPermission: auth.hasPermission,
    hasRole: (role: any) => auth.hasRole(role),
    getAuthHeaders: async () => ({}),
    authMode: 'msal'
  };
};

export const UniversalAuthLoading: React.FC = () => (
  <div className="text-sm text-gray-400">Authenticating...</div>
);

export const UniversalLoginPrompt: React.FC = () => (
  <div className="text-sm text-gray-400">Please sign in to continue.</div>
);

export const AuthStatus: React.FC = () => {
  const auth = useUniversalAuth();

  if (!auth.isAuthenticated) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        zIndex: 1000,
        maxWidth: '300px',
        fontSize: '12px'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        Auth Status (MSAL)
      </div>
      <div>User: {auth.user?.firstName}, {auth.user?.lastName}</div>
      <div>Role: {auth.user?.role}</div>
      <div>Email: {auth.user?.email}</div>
      <div style={{ marginTop: '8px' }}>
        <button
          onClick={auth.logout}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            border: '1px solid #dc2626',
            borderRadius: '4px',
            background: '#dc2626',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

interface RequireAuthProps {
  children: ReactNode;
  permissions?: string[];
  roles?: string[];
  fallback?: ReactNode;
  showLoading?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  permissions = [],
  roles = [],
  fallback = <div>Access Denied</div>,
  showLoading = true
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useUniversalAuth();

  if (isLoading && showLoading) {
    return <UniversalAuthLoading />;
  }

  if (!isAuthenticated) {
    return <UniversalLoginPrompt />;
  }

  if (permissions.length > 0) {
    const hasRequiredPermissions = permissions.some(permission => hasPermission(permission));
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  if (roles.length > 0) {
    const hasRequiredRole = roles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export const AuthProviderSwitcher: React.FC<AuthProviderSwitcherProps> = ({ children }) => {
  return <>{children}</>;
};

interface AuthenticatedContentProps {
  children: ReactNode;
  showAuthStatus?: boolean;
  showRoleSwitcher?: boolean;
}

export const AuthenticatedContent: React.FC<AuthenticatedContentProps> = ({
  children,
  showAuthStatus = true,
  showRoleSwitcher = false
}) => (
  <>
    {showAuthStatus && <AuthStatus />}
    {showRoleSwitcher && null}
    {children}
  </>
);
