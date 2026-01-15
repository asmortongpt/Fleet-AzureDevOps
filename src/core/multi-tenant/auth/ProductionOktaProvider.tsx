import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { Security, useOktaAuth } from '@okta/okta-react';


/**
 * Production Okta Authentication Provider
 * DCF ITB 2425-077 Fleet Management System
 * Real Okta integration for production environment
 */

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { logger } from '@/utils/logger';

interface MockUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  role: 'admin' | 'legislature' | 'department' | 'driver';
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin: Date;
  sessionTimeout: number;
}

interface ProductionOktaContextType {
  user: MockUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: MockUserProfile["role"]) => boolean;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const ProductionOktaContext = createContext<ProductionOktaContextType | undefined>(undefined);

// Okta configuration from environment variables
const oktaConfig = {
  issuer: import.meta.env.VITE_OKTA_ISSUER || 'https://dcf-florida.okta.com/oauth2/default',
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID || 'dcf-fleet-management-client',
  redirectUri: import.meta.env.VITE_OKTA_REDIRECT_URI || (typeof window !== "undefined" ? window.location.origin + '/login/callback' : ''),
  scopes: (import.meta.env.VITE_OKTA_SCOPES || 'openid,profile,email,groups').split(','),
  pkce: import.meta.env.VITE_OKTA_PKCE !== 'false',
  responseType: import.meta.env.VITE_OKTA_RESPONSE_TYPE || 'code',
  postLogoutRedirectUri: import.meta.env.VITE_OKTA_POST_LOGOUT_REDIRECT_URI || (typeof window !== "undefined" ? window.location.origin : ''),
  storageType: import.meta.env.VITE_OKTA_STORAGE_TYPE || 'sessionStorage'
};

// Initialize Okta Auth instance
const oktaAuth = new OktaAuth(oktaConfig);

interface ProductionOktaProviderProps {
  children: ReactNode;
}

// Role mapping from Okta groups to application roles
const OKTA_ROLE_MAPPING: Record<string, MockUserProfile['role']> = {
  "DCF-Fleet-Administrators": "admin",
  "Florida-Legislature": "legislature",
  "DCF-Department-Managers": "department",
  "DCF-Fleet-Drivers": "driver"
};

// Permission mapping based on roles
const ROLE_PERMISSIONS: Record<MockUserProfile['role'], string[]> = {
  admin: ['read', 'write', 'admin', 'fleet:manage', 'drivers:manage', 'maintenance:manage'],
  legislature: ['read', 'fleet:view', 'analytics:view'],
  department: ['read', 'write', 'fleet:manage', 'drivers:view'],
  driver: ['read', 'vehicle:checkout', 'maintenance:report']
};

// Context provider component
const ProductionOktaContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { oktaAuth: contextOktaAuth, authState } = useOktaAuth();
  const [user, setUser] = useState<MockUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authState?.isAuthenticated && authState?.idToken) {
      loadUserProfile();
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [authState]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      if (!authState?.idToken) {
        throw new Error('No ID token available');
      }

      // Get user info from Okta
      const userInfo = await contextOktaAuth.getUser();
      const accessToken = authState.accessToken?.accessToken;

      // Get user groups for role mapping
      let userGroups: string[] = [];
      try {
        if (accessToken) {
          const response = await fetch(`${oktaConfig.issuer}/v1/userinfo`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          const userInfoDetailed = await response.json();
          userGroups = userInfoDetailed.groups || [];
        }
      } catch (groupError) {
        logger.error('Error fetching user groups:', groupError);
      }

      // Map Okta groups to application role
      let userRole: MockUserProfile['role'] = 'driver'; // Default role
      for (const group of userGroups) {
        if (OKTA_ROLE_MAPPING[group]) {
          userRole = OKTA_ROLE_MAPPING[group];
          break;
        }
      }

      // Create user profile compatible with mock auth
      const userProfile: MockUserProfile = {
        id: userInfo.sub || 'okta-user',
        email: userInfo.email || '',
        firstName: userInfo.given_name || 'Unknown',
        lastName: userInfo.family_name || 'User',
        department: getDepartmentFromRole(userRole),
        role: userRole,
        permissions: ROLE_PERMISSIONS[userRole],
        mfaEnabled: true, // Assume MFA is enabled in production Okta
        lastLogin: new Date(),
        sessionTimeout: 3600 // Default session timeout
      };

      setUser(userProfile);
    } catch (error) {
      logger.error('Error loading user profile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getDepartmentFromRole = (role: MockUserProfile['role']): string => {
    switch (role) {
      case 'admin': return 'DCF Fleet Operations';
      case 'legislature': return 'Florida House of Representatives';
      case 'department': return 'DCF Fleet Operations';
      case 'driver': return 'DCF Field Operations';
      default:
        return 'Unknown Department';
    }
  };

  const login = async (username?: string): Promise<void> => {
    try {
      setIsLoading(true);

      // Check if already authenticated
      if (authState?.isAuthenticated) {
        return;
      }

      // Redirect to Okta login
      await contextOktaAuth.signInWithRedirect({
        originalUri: typeof window !== "undefined" ? window.location.href : '/'
      });
    } catch (error) {
      logger.error('Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Clear local state
      setUser(null);

      // Sign out from Okta
      await contextOktaAuth.signOut({
        postLogoutRedirectUri: oktaConfig.postLogoutRedirectUri
      });
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasRole = (role: MockUserProfile['role']): boolean => {
    return user?.role === role;
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const accessToken = authState?.accessToken?.accessToken;
      if (!accessToken) {
        throw new Error('No access token available');
      }

      return {
        'Authorization': `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        'X-User-Role': user?.role || 'unknown'
      };
    } catch (error) {
      logger.error('Error getting auth headers:', error);
      throw error;
    }
  };

  const contextValue: ProductionOktaContextType = {
    user,
    isLoading: isLoading || !authState,
    isAuthenticated: authState?.isAuthenticated || false,
    login,
    logout,
    hasPermission,
    hasRole,
    getAuthHeaders
  };

  return (
    <ProductionOktaContext.Provider value={contextValue}>
      {children}
    </ProductionOktaContext.Provider>
  );
};

// Main provider component with Okta Security wrapper
export const ProductionOktaProvider: React.FC<ProductionOktaProviderProps> = ({ children }) => {
  // Handle route restoration after authentication
  const restoreOriginalUri = async (_oktaAuth: any, originalUri: string) => {
    if (typeof window !== "undefined") {
      window.location.replace(toRelativeUrl(originalUri || '/', window.location.origin));
    }
  };

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <ProductionOktaContextProvider>
        {children}
      </ProductionOktaContextProvider>
    </Security>
  );
};

// Hook to use Okta auth context
export const useProductionOkta = (): ProductionOktaContextType => {
  const context = useContext(ProductionOktaContext);
  if (!context) {
    throw new Error('useProductionOkta must be used within a ProductionOktaProvider');
  }
  return context;
};

// Loading component for Okta auth states
export const OktaAuthLoading: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc'
  }}>
    <div style={{
      padding: '20px',
      textAlign: 'center',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #1e40af',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px'
      }}></div>
      <p style={{color: '#374151'}}>Authenticating with Okta...</p>
    </div>
  </div>
);

// Login prompt for unauthenticated users
export const OktaLoginPrompt: React.FC = () => {
  const { login, isLoading } = useProductionOkta();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      logger.error('Login failed:', error);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{
        width: '400px',
        padding: '32px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{textAlign: 'center', marginBottom: '24px'}}>
          <img
            src="/dcf-logo.png"
            alt="Florida DCF"
            style={{
              height: '48px',
              marginBottom: '16px'
            }}
            onError={(e) => {
              // Hide image if logo doesn't exist
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1e40af',
            marginBottom: '8px'
          }}>
            Fleet Management System
          </h1>
          <p style={{color: '#374151'}}>Secure Government Access</p>
        </div>

        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          <div style={{fontWeight: 'bold', marginBottom: '8px'}}>Government System Access</div>
          <p style={{margin: 0}}>
            This system requires government credentials and multi-factor authentication.
            Access is monitored and logged for security compliance.
          </p>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading ? '#374151' : '#1e40af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff40',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Connecting to Okta...
            </>
          ) : (
            <>
              Sign in with Okta
            </>
          )}
        </button>

        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#374151'
        }}>
          <p>Protected by SOC 2 Type 2 Security</p>
          <p>24/7 Security Monitoring • Audit Logging</p>
        </div>
      </div>
    </div>
  );
};
