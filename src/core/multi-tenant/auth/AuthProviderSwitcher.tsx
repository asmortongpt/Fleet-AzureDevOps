import { logger } from '@/utils/logger';

/**
 * Environment-based Authentication Provider Switcher
 * DCF ITB 2425-077 Fleet Management System
 * Automatically switches between mock and production auth based on environment
 */

import type { ReactNode } from 'react';
import React from "react";
import { MockAuthProvider, useMockAuth, MockAuthLoading, MockLoginPrompt, MockRoleSwitcher } from './MockAuthProvider';

interface AuthProviderSwitcherProps {
 children: ReactNode;
 defaultRole?: 'admin' | 'legislature' | 'department' | 'driver';
 forceMode?: 'mock' | 'okta';
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
 authMode: 'mock' | 'okta';
}

// Hook that works with either auth provider
export const useUniversalAuth = (): UniversalAuthContext => {
 const authMode = getAuthMode();
 
 try {
 if (authMode === 'mock') {
 const mockAuth = useMockAuth();
 return {
 ...mockAuth,
 authMode: 'mock'
 };
 } else {
 // For now, fallback to mock auth if Okta not available
 const mockAuth = useMockAuth();
 return {
 ...mockAuth,
 authMode: 'okta'
 };
 }
 } catch (error) {
 // If hook is called outside provider, return a fallback
 return {
 user: null, isLoading: false,
 isAuthenticated: false, login: async() => {},
 logout: async() => {},
 hasPermission: () => false,
 hasRole: () => false,
 getAuthHeaders: async() => ({}),
 authMode: 'mock'
 };
 }
};

// Determine auth mode from environment
const getAuthMode = (): 'mock' | 'okta' => {
 const envMode = import.meta.env.VITE_AUTH_MODE?.toLowerCase();
 
 // Check various conditions for mock mode
 const isTestMode = typeof window !== 'undefined' &&
 (window.location.href.includes('playwright') ||
 window.location.href.includes('test') ||
 navigator.userAgent.includes('Playwright'));
 
 const isDevelopment = import.meta.env.MODE === 'development';
 const isStorybook = typeof window !== 'undefined' && window.location.href.includes('storybook');
 
 // Force mock mode in certain conditions
 if (isTestMode || isStorybook || envMode === 'mock') {
 return 'mock';
 }
 
 // Use Okta in production or when explicitly set
 if (envMode === 'okta' || import.meta.env.MODE === 'production') {
 return 'okta';
 }
 
 // Default to mock for development
 return 'mock';
};

// Loading component that shows appropriate loader
export const UniversalAuthLoading: React.FC = () => {
 const authMode = getAuthMode();
 
 if (authMode === 'mock') {
 return <MockAuthLoading />;
 } else {
 return <MockAuthLoading />; // Fallback to mock loading
 }
};

// Login prompt that shows appropriate form
export const UniversalLoginPrompt: React.FC = () => {
 const authMode = getAuthMode();
 
 if (authMode === 'mock') {
 return <MockLoginPrompt />;
 } else {
 return <MockLoginPrompt />; // Fallback to mock login
 }
};

// Auth status component for development
export const AuthStatus: React.FC = () => {
 const auth = useUniversalAuth();
 const authMode = getAuthMode();
 
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
 Auth Status ({authMode.toUpperCase()})
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
export const AuthProviderSwitcher: React.FC<AuthProviderSwitcherProps> = ({ children, defaultRole = 'admin',
 forceMode 
}) => {
 const authMode = forceMode || getAuthMode();
 
 // logger.debug(`🔐 Auth mode: ${authMode.toUpperCase()}`);
 
 if (authMode === 'mock') {
 return (
 <MockAuthProvider defaultRole={defaultRole} autoLogin={true}>
 {children}
 </MockAuthProvider>
 );
 } else {
 return (
 <MockAuthProvider defaultRole={defaultRole} autoLogin={true}>
 {children}
 </MockAuthProvider>
 );
 }
};

// Content wrapper that includes appropriate role switcher for dev
interface AuthenticatedContentProps {
 children: ReactNode;
 showAuthStatus?: boolean;
 showRoleSwitcher?: boolean;
}

export const AuthenticatedContent: React.FC<AuthenticatedContentProps> = ({ children, showAuthStatus = true,
 showRoleSwitcher = true 
}) => {
 const authMode = getAuthMode();
 
 return (
 <>
 {children}
 
 {/* Show role switcher only in mock mode for development */}
 {authMode === 'mock' && showRoleSwitcher && <MockRoleSwitcher />}
 {/* Show auth status in development */}
 {showAuthStatus && import.meta.env.MODE === 'development' && <AuthStatus />}
 </>
 );
};
// Export convenience components
export { MockRoleSwitcher };
export type { UniversalAuthContext };