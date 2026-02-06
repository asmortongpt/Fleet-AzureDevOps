
/**
 * Authentication Provider Switcher
 * DCF ITB 2425-077 Fleet Management System
 * Uses the primary AuthContext for runtime authentication.
 */

import type { ReactNode } from 'react';
import React from "react";

import { useAuth } from '@/contexts/AuthContext';

interface AuthProviderSwitcherProps {
 children: ReactNode;
}

// Universal auth interface that works with both providers
interface UniversalAuthContext {
 user: any;
 isLoading: boolean;
 isAuthenticated: boolean;
 login: (username?: string) => Promise<void>;
 logout: () => Promise<void>;
 hasPermission: (permission: string) => boolean;
 hasRole: (role: any) => boolean;
 getAuthHeaders: () => Promise<Record<string, string>>;
 authMode: 'okta';
}

// Hook that works with either auth provider
export const useUniversalAuth = (): UniversalAuthContext => {
 const auth = useAuth();
  return {
  user: auth.user,
  isLoading: auth.isLoading,
  isAuthenticated: auth.isAuthenticated,
  login: async () => {
    auth.loginWithMicrosoft();
  },
  logout: auth.logout,
  hasPermission: (permission: string) => auth.hasPermission(permission),
  hasRole: (role: any) => auth.hasRole(role),
  getAuthHeaders: async () => ({}),
  authMode: 'okta'
 };
};

// Loading component that shows appropriate loader
export const UniversalAuthLoading: React.FC = () => {
 return (
  <div className="flex items-center justify-center h-full w-full">
   <div className="text-sm text-slate-600">Signing you in…</div>
  </div>
 );
};

// Login prompt that shows appropriate form
export const UniversalLoginPrompt: React.FC = () => {
 return (
  <div className="flex items-center justify-center h-full w-full">
   <div className="text-sm text-slate-600">Authentication required. Please sign in.</div>
  </div>
 );
};

// Auth status component for development
export const AuthStatus: React.FC = () => {
 const auth = useUniversalAuth();
 
 if (!auth.isAuthenticated) return null;
 
 return (
 <div style={{
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
 }}>
 <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
 Auth Status (SSO)
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

// Component that conditionally renders content based on auth
interface RequireAuthProps {
 children: ReactNode;
 permissions?: string[];
 roles?: string[];
 fallback?: ReactNode;
 showLoading?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, permissions = [],
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

 // Check permissions
 if (permissions.length > 0) {
 const hasRequiredPermissions = permissions.some(permission => hasPermission(permission));
 if (!hasRequiredPermissions) {
 return <>{fallback}</>;
 }
 }

 // Check roles
 if (roles.length > 0) {
 const hasRequiredRole = roles.some(role => hasRole(role));
 if (!hasRequiredRole) {
 return <>{fallback}</>;
 }
 }

 return <>{children}</>;
};

// Main provider component that chooses the right auth system
export const AuthProviderSwitcher: React.FC<AuthProviderSwitcherProps> = ({ children }) => {
  // Mock auth is not allowed in runtime builds. Use the primary AuthProvider instead.
  return <>{children}</>;
};

// Content wrapper that includes appropriate role switcher for dev
interface AuthenticatedContentProps {
 children: ReactNode;
 showAuthStatus?: boolean;
 showRoleSwitcher?: boolean;
}

export const AuthenticatedContent: React.FC<AuthenticatedContentProps> = ({ children, showAuthStatus = true }) => {
  return (
    <>
      {children}
      {showAuthStatus && import.meta.env.MODE === 'development' && <AuthStatus />}
    </>
  );
};
export type { UniversalAuthContext };
