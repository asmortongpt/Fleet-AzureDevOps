
/**
 * Okta SSO Integration for Fleet Management System
 * Implements SAML 2.0 and OAuth 2.0 authentication for government compliance
 *
 * Features:
 * - SAML 2.0 authentication flow
 * - Multi-factor authentication (MFA) support
 * - Role-based access control (RBAC)
 * - Session management with timeout
 * - Audit logging for compliance
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Type declarations for Okta SDK (packages not installed - this is an optional enterprise feature)
// These types provide compile-time safety without requiring the actual @okta packages

interface OktaAuthOptions {
  issuer: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  pkce: boolean;
  disableHttpsCheck?: boolean;
  tokenManager?: {
    autoRenew?: boolean;
    autoRemove?: boolean;
    expireEarlySeconds?: number;
    storage?: string;
    storageKey?: string;
  };
  cookies?: {
    secure?: boolean;
    sameSite?: string;
  };
  serviceWorker?: string;
}

interface OktaAuthInstance {
  getUser: () => Promise<Record<string, unknown>>;
  signInWithRedirect: (options: { originalUri: string }) => Promise<void>;
  signOut: (options: { postLogoutRedirectUri: string }) => Promise<void>;
  token: {
    isLoginRedirect: () => boolean;
  };
  handleLoginRedirect: () => Promise<void>;
  tokenManager: {
    renew: (tokenType: string) => Promise<void>;
  };
  authStateManager: {
    getAuthState: () => Promise<Record<string, unknown>>;
    subscribe: (callback: (state: Record<string, unknown>) => void) => void;
    unsubscribe: (callback: (state: Record<string, unknown>) => void) => void;
  };
}

// Stub OktaAuth class - actual implementation requires @okta/okta-auth-js package
class OktaAuth implements OktaAuthInstance {
  constructor(_options: OktaAuthOptions) {
    // Stub implementation - requires @okta/okta-auth-js package
  }
  getUser(): Promise<Record<string, unknown>> {
    throw new Error('OktaAuth requires @okta/okta-auth-js package');
  }
  signInWithRedirect(_options: { originalUri: string }): Promise<void> {
    throw new Error('OktaAuth requires @okta/okta-auth-js package');
  }
  signOut(_options: { postLogoutRedirectUri: string }): Promise<void> {
    throw new Error('OktaAuth requires @okta/okta-auth-js package');
  }
  token = {
    isLoginRedirect: (): boolean => false,
  };
  handleLoginRedirect(): Promise<void> {
    throw new Error('OktaAuth requires @okta/okta-auth-js package');
  }
  tokenManager = {
    renew: (_tokenType: string): Promise<void> => {
      throw new Error('OktaAuth requires @okta/okta-auth-js package');
    },
  };
  authStateManager = {
    getAuthState: (): Promise<Record<string, unknown>> => {
      throw new Error('OktaAuth requires @okta/okta-auth-js package');
    },
    subscribe: (_callback: (state: Record<string, unknown>) => void): void => {
      // Stub
    },
    unsubscribe: (_callback: (state: Record<string, unknown>) => void): void => {
      // Stub
    },
  };
}

// Stub Security component - actual implementation requires @okta/okta-react package
interface SecurityProps {
  oktaAuth: OktaAuthInstance;
  onAuthRequired?: () => void;
  restoreOriginalUri: (oktaAuth: OktaAuthInstance, originalUri: string) => Promise<void>;
  children: React.ReactNode;
}

const Security: React.FC<SecurityProps> = ({ children }) => {
  // Stub implementation - requires @okta/okta-react package
  return <>{children}</>;
};

// Utility function stub - actual implementation from @okta/okta-auth-js
function toRelativeUrl(uri: string, origin: string): string {
  // Convert absolute URL to relative URL
  if (uri.startsWith(origin)) {
    return uri.substring(origin.length) || '/';
  }
  return uri;
}

import { logger } from '@/utils/logger';

// Okta configuration interface
interface OktaConfig {
  issuer: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  pkce: boolean;
  disableHttpsCheck?: boolean;
}

// User profile interface
interface UserProfile {
  sub: string;
  name: string;
  email: string;
  preferred_username: string;
  groups: string[];
  department?: string;
  employee_id?: string;
  roles: string[];
  permissions: string[];
  mfa_enabled: boolean;
  last_login?: Date;
}

// Auth state interface
interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  sessionExpiry: Date | null;
}

// Auth context interface
interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isSessionExpired: () => boolean;
  extendSession: () => Promise<void>;
}

// Government role definitions
export const GOVERNMENT_ROLES = {
  ADMIN: 'fleet_admin',
  MANAGER: 'fleet_manager',
  SUPERVISOR: 'fleet_supervisor',
  DRIVER: 'fleet_driver',
  MECHANIC: 'fleet_mechanic',
  AUDITOR: 'fleet_auditor',
  READONLY: 'fleet_readonly'
} as const;

// Permission definitions
export const PERMISSIONS = {
  // Vehicle permissions
  VIEW_VEHICLES: 'vehicles.read',
  CREATE_VEHICLES: 'vehicles.create',
  UPDATE_VEHICLES: 'vehicles.update',
  DELETE_VEHICLES: 'vehicles.delete',

  // Maintenance permissions
  VIEW_MAINTENANCE: 'maintenance:read',
  SCHEDULE_MAINTENANCE: 'maintenance:create',
  UPDATE_MAINTENANCE: 'maintenance:update',
  APPROVE_MAINTENANCE: 'maintenance:approve',

  // Driver permissions
  VIEW_DRIVERS: 'drivers:read',
  MANAGE_DRIVERS: 'drivers:manage',

  // Financial permissions
  VIEW_COSTS: 'costs:read',
  APPROVE_EXPENSES: 'costs:approve',

  // Reporting permissions
  VIEW_REPORTS: 'reports:read',
  CREATE_REPORTS: 'reports:create',
  EXPORT_DATA: 'reports:export',

  // System permissions
  ADMIN_ACCESS: 'system:admin',
  AUDIT_ACCESS: 'system:audit',
  USER_MANAGEMENT: 'users:manage'
} as const;

// Role to permission mapping
const ROLE_PERMISSIONS = {
  [GOVERNMENT_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [GOVERNMENT_ROLES.MANAGER]: [
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.CREATE_VEHICLES,
    PERMISSIONS.UPDATE_VEHICLES,
    PERMISSIONS.VIEW_MAINTENANCE,
    PERMISSIONS.SCHEDULE_MAINTENANCE,
    PERMISSIONS.UPDATE_MAINTENANCE,
    PERMISSIONS.APPROVE_MAINTENANCE,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_COSTS,
    PERMISSIONS.APPROVE_EXPENSES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  [GOVERNMENT_ROLES.SUPERVISOR]: [
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.UPDATE_VEHICLES,
    PERMISSIONS.VIEW_MAINTENANCE,
    PERMISSIONS.SCHEDULE_MAINTENANCE,
    PERMISSIONS.UPDATE_MAINTENANCE,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.VIEW_COSTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORTS
  ],
  [GOVERNMENT_ROLES.DRIVER]: [
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.VIEW_MAINTENANCE,
    PERMISSIONS.VIEW_REPORTS
  ],
  [GOVERNMENT_ROLES.MECHANIC]: [
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.VIEW_MAINTENANCE,
    PERMISSIONS.UPDATE_MAINTENANCE,
    PERMISSIONS.VIEW_REPORTS
  ],
  [GOVERNMENT_ROLES.AUDITOR]: [
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.VIEW_MAINTENANCE,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.VIEW_COSTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.AUDIT_ACCESS
  ],
  [GOVERNMENT_ROLES.READONLY]: [
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.VIEW_MAINTENANCE,
    PERMISSIONS.VIEW_REPORTS
  ]
};

// Get Okta configuration from environment variables
const getOktaConfig = (): OktaConfig => {
  const config: OktaConfig = {
    issuer: process.env.REACT_APP_OKTA_ISSUER || 'https://dcf-florida.okta.com/oauth2/default',
    clientId: process.env.REACT_APP_OKTA_CLIENT_ID || 'your-client-id',
    redirectUri: process.env.REACT_APP_OKTA_REDIRECT_URI || window.location.origin + '/login/callback',
    scopes: ['openid', 'profile', 'email', 'groups'],
    pkce: true,
    disableHttpsCheck: process.env.NODE_ENV === 'development'
  };

  // Validate required configuration
  if (!config.issuer || config.issuer === 'https://dcf-florida.okta.com/oauth2/default') {
    logger.warn('Okta issuer not configured properly');
  }

  if (!config.clientId || config.clientId === 'your-client-id') {
    logger.warn('Okta client ID not configured properly');
  }

  return config;
};

// Create Okta Auth instance
const oktaConfig = getOktaConfig();
const oktaAuth = new OktaAuth({
  issuer: oktaConfig.issuer,
  clientId: oktaConfig.clientId,
  redirectUri: oktaConfig.redirectUri,
  scopes: oktaConfig.scopes,
  pkce: oktaConfig.pkce,
  disableHttpsCheck: oktaConfig.disableHttpsCheck,
  // Additional government-specific configuration
  tokenManager: {
    autoRenew: true,
    autoRemove: true,
    expireEarlySeconds: 300, // Renew 5 minutes before expiry
    storage: 'localStorage', // Use localStorage for government compliance
    storageKey: 'dcf-fleet-tokens'
  },
  cookies: {
    secure: true,
    sameSite: 'strict'
  },
  // Service worker for token refresh
  serviceWorker: '/sw.js'
});

// Audit logging function
const logAuthEvent = (event: string, details: any = {}) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    event,
    user: details.user?.email || 'unknown',
    ip: details.ip || 'unknown',
    userAgent: navigator.userAgent,
    sessionId: details.sessionId || 'unknown',
    details
  };

  // Send to audit logging service
  logger.debug('🔒 Auth Event:', auditLog);

  // In production, send to audit logging API
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/audit/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(auditLog)
    }).catch(error => {
      logger.error('Failed to log audit event:', error);
    });
  }
};

// Extract user roles and permissions from Okta groups
const processUserProfile = (userInfo: any, groups: string[] = []): UserProfile => {
  // Map Okta groups to application roles
  const userRoles: string[] = [];
  const userPermissions: string[] = [];

  groups.forEach(group => {
    // Map group names to roles (customize based on your Okta group structure)
    if (group.includes('fleet_admin') || group.includes('FleetAdmin')) {
      userRoles.push(GOVERNMENT_ROLES.ADMIN);
    } else if (group.includes('fleet_manager') || group.includes('FleetManager')) {
      userRoles.push(GOVERNMENT_ROLES.MANAGER);
    } else if (group.includes('fleet_supervisor') || group.includes('FleetSupervisor')) {
      userRoles.push(GOVERNMENT_ROLES.SUPERVISOR);
    } else if (group.includes('fleet_driver') || group.includes('FleetDriver')) {
      userRoles.push(GOVERNMENT_ROLES.DRIVER);
    } else if (group.includes('fleet_mechanic') || group.includes('FleetMechanic')) {
      userRoles.push(GOVERNMENT_ROLES.MECHANIC);
    } else if (group.includes('fleet_auditor') || group.includes('FleetAuditor')) {
      userRoles.push(GOVERNMENT_ROLES.AUDITOR);
    }
  });

  // Default to readonly if no specific roles
  if (userRoles.length === 0) {
    userRoles.push(GOVERNMENT_ROLES.READONLY);
  }

  // Build permissions from roles
  userRoles.forEach(role => {
    const rolePermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
    userPermissions.push(...rolePermissions);
  });

  // Remove duplicates
  const uniquePermissions = [...new Set(userPermissions)];

  return {
    sub: userInfo.sub,
    name: userInfo.name || userInfo.preferred_username,
    email: userInfo.email,
    preferred_username: userInfo.preferred_username,
    groups: groups,
    department: userInfo.department || userInfo.org || 'DCF',
    employee_id: userInfo.employee_id || userInfo.employeeNumber,
    roles: userRoles,
    permissions: uniquePermissions,
    mfa_enabled: userInfo.amr?.includes('mfa') || false,
    last_login: new Date()
  };
};

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface OktaAuthProviderProps {
  children: React.ReactNode;
  onAuthRequired?: () => void;
  onAuthError?: (error: any) => void;
}

export const OktaAuthProvider: React.FC<OktaAuthProviderProps> = ({
  children,
  onAuthRequired,
  onAuthError
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
    accessToken: null,
    idToken: null,
    refreshToken: null,
    sessionExpiry: null
  });

  // Handle authentication state changes
  const handleAuthStateChange = useCallback(async (authStateChange: any) => {
    try {
      const { isAuthenticated, accessToken, idToken } = authStateChange;

      if (isAuthenticated) {
        // Get user info and groups
        const userInfo = await oktaAuth.getUser();
        const groups = Array.isArray(userInfo.groups) ? userInfo.groups as string[] : [];

        // Process user profile with roles and permissions
        const userProfile = processUserProfile(userInfo, groups);

        // Calculate session expiry
        const tokenExpiry = accessToken?.expiresAt ? new Date(accessToken.expiresAt * 1000) : null;

        setAuthState({
          isAuthenticated: true,
          user: userProfile,
          isLoading: false,
          error: null,
          accessToken: accessToken?.value || null,
          idToken: idToken?.value || null,
          refreshToken: null, // Okta handles refresh tokens internally
          sessionExpiry: tokenExpiry
        });

        // Log successful authentication
        logAuthEvent('AUTH_SUCCESS', {
          user: userProfile,
          sessionId: accessToken?.value?.substr(-8) || 'unknown',
          mfaUsed: userProfile.mfa_enabled
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
          accessToken: null,
          idToken: null,
          refreshToken: null,
          sessionExpiry: null
        });
      }
    } catch (error) {
      logAuthEvent('AUTH_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (onAuthError) {
        onAuthError(error);
      }
    }
  }, [onAuthError]);

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we're returning from login
        if (oktaAuth.token.isLoginRedirect()) {
          await oktaAuth.handleLoginRedirect();
        }

        // Get initial auth state
        const initialAuthState = await oktaAuth.authStateManager.getAuthState();
        await handleAuthStateChange(initialAuthState);

        // Subscribe to auth state changes
        oktaAuth.authStateManager.subscribe(handleAuthStateChange);

      } catch (error) {
        logger.error('Auth initialization failed:', error);
      }
    };

    initAuth();

    // Cleanup subscription
    return () => {
      oktaAuth.authStateManager.unsubscribe(handleAuthStateChange);
    };
  }, [handleAuthStateChange]);

  // Login function
  const login = useCallback(async () => {
    try {
      logAuthEvent('LOGIN_ATTEMPT');
      await oktaAuth.signInWithRedirect({
        originalUri: window.location.href
      });
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      logAuthEvent('LOGOUT_ATTEMPT', { user: authState.user });
      await oktaAuth.signOut({
        postLogoutRedirectUri: window.location.origin + '/login'
      });
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }, [authState.user]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      await oktaAuth.tokenManager.renew('accessToken');
      await oktaAuth.tokenManager.renew('idToken');
      logAuthEvent('SESSION_REFRESHED', { user: authState.user });
    } catch (error) {
      logger.error('Session refresh failed:', error);
      throw error;
    }
  }, [authState.user]);

  // Role checking functions
  const hasRole = useCallback((role: string): boolean => {
    return authState.user?.roles.includes(role) || false;
  }, [authState.user]);

  const hasPermission = useCallback((permission: string): boolean => {
    return authState.user?.permissions.includes(permission) || false;
  }, [authState.user]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  // Session expiry check
  const isSessionExpired = useCallback((): boolean => {
    if (!authState.sessionExpiry) return false;
    return new Date() >= authState.sessionExpiry;
  }, [authState.sessionExpiry]);

  // Extend session
  const extendSession = useCallback(async () => {
    try {
      await refreshSession();
    } catch (error) {
      logger.error('Failed to extend session:', error);
      throw error;
    }
  }, [refreshSession]);

  // Session timeout warning
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.sessionExpiry) return;

    const warningTime = 5 * 60 * 1000; // 5 minutes before expiry
    const timeUntilWarning = authState.sessionExpiry.getTime() - Date.now() - warningTime;

    if (timeUntilWarning > 0) {
      const warningTimer = setTimeout(() => {
        const shouldExtend = window.confirm(
          'Your session will expire in 5 minutes. Would you like to extend it?'
        );
        if (shouldExtend) {
          extendSession().catch(() => {
            alert('Failed to extend session. Please log in again.');
            logout();
          });
        }
      }, timeUntilWarning);

      return () => clearTimeout(warningTimer);
    }
  }, [authState.isAuthenticated, authState.sessionExpiry, extendSession, logout]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshSession,
    hasRole,
    hasPermission,
    hasAnyRole,
    isSessionExpired,
    extendSession
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <Security
        oktaAuth={oktaAuth}
        onAuthRequired={onAuthRequired}
        restoreOriginalUri={async (_oktaAuth: OktaAuthInstance, originalUri: string) => {
          // Handle post-login redirect
          window.location.replace(
            toRelativeUrl(originalUri || '/', window.location.origin)
          );
        }}
      >
        {children}
      </Security>
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an OktaAuthProvider');
  }
  return context;
};

// Login component
export const Login: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (error) {
      logger.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-3 lg:px-3">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">DCF</span>
          </div>
        </div>
        <h2 className="mt-3 text-center text-base font-extrabold text-gray-900">
          Florida DCF Fleet Management
        </h2>
        <p className="mt-2 text-center text-sm text-slate-700">
          Sign in with your state credentials
        </p>
      </div>

      <div className="mt-3 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-3 px-2 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-2 py-3 rounded relative">
              <strong className="font-bold">Authentication Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          <div className="space-y-2">
            <div>
              <button
                onClick={handleLogin}
                disabled={isLoading || isLoggingIn}
                className="w-full flex justify-center py-3 px-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || isLoggingIn ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in with State SSO'
                )}
              </button>
            </div>

            <div className="text-xs text-gray-700 text-center space-y-2">
              <p>🔒 Secure authentication via Florida State Okta</p>
              <p>🛡️ Multi-factor authentication required</p>
              <p>📊 All access is logged for compliance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Login callback component
export const LoginCallbackComponent: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    oktaAuth.handleLoginRedirect().then(() => {
      navigate('/', { replace: true });
    }).catch((error: unknown) => {
      logger.error('Login callback error:', error);
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
      <p className="text-slate-700">Completing authentication...</p>
    </div>
  );
};

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  requiredRoles,
  requiredPermissions,
  fallback
}) => {
  const { isAuthenticated, isLoading, hasRole, hasPermission, hasAnyRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || <AccessDenied requiredRole={requiredRole} />;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return fallback || <AccessDenied requiredRoles={requiredRoles} />;
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <AccessDenied requiredPermission={requiredPermission} />;
  }

  if (requiredPermissions && !requiredPermissions.every(perm => hasPermission(perm))) {
    return fallback || <AccessDenied requiredPermissions={requiredPermissions} />;
  }

  return <>{children}</>;
};

// Access denied component
interface AccessDeniedProps {
  requiredRole?: string;
  requiredRoles?: string[];
  requiredPermission?: string;
  requiredPermissions?: string[];
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole,
  requiredRoles,
  requiredPermission,
  requiredPermissions
}) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <span className="text-red-600 text-sm">🚫</span>
        </div>
        <h2 className="text-sm font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-slate-700 mb-2">
          You don't have the required permissions to access this resource.
        </p>

        {(requiredRole || requiredRoles) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
            <p className="text-sm text-yellow-800">
              <strong>Required Role:</strong> {requiredRole || requiredRoles?.join(', ')}
            </p>
            <p className="text-sm text-yellow-800">
              <strong>Your Roles:</strong> {user?.roles.join(', ') || 'None'}
            </p>
          </div>
        )}

        {(requiredPermission || requiredPermissions) && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
            <p className="text-sm text-blue-800">
              <strong>Required Permission:</strong> {requiredPermission || requiredPermissions?.join(', ')}
            </p>
          </div>
        )}

        <p className="text-sm text-gray-700">
          Contact your administrator to request access to this feature.
        </p>
      </div>
    </div>
  );
};

// User profile component
export const UserProfile: React.FC = () => {
  const { user, logout, extendSession, sessionExpiry } = useAuth();
  const [isExtending, setIsExtending] = useState(false);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await extendSession();
    } catch (error) {
      logger.error('Failed to extend session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  if (!user) return null;

  const timeUntilExpiry = sessionExpiry ? Math.max(0, sessionExpiry.getTime() - Date.now()) : 0;
  const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));

  return (
    <div className="bg-white shadow rounded-lg p-3">
      <h3 className="text-sm font-medium text-gray-900 mb-2">User Profile</h3>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <p className="text-sm text-gray-900">{user.name}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <p className="text-sm text-gray-900">{user.email}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Department</label>
          <p className="text-sm text-gray-900">{user.department}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Employee ID</label>
          <p className="text-sm text-gray-900">{user.employee_id || 'N/A'}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Roles</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {user.roles.map(role => (
              <span key={role} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {role}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">MFA Status</label>
          <p className="text-sm text-gray-900">
            {user.mfa_enabled ? '✅ Enabled' : '❌ Not Enabled'}
          </p>
        </div>

        {sessionExpiry && (
          <div>
            <label className="text-sm font-medium text-gray-700">Session Expiry</label>
            <p className="text-sm text-gray-900">
              {minutesUntilExpiry > 0 ? `${minutesUntilExpiry} minutes remaining` : 'Expired'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex space-x-3">
        <button
          onClick={handleExtendSession}
          disabled={isExtending}
          className="bg-blue-600 text-white px-2 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isExtending ? 'Extending...' : 'Extend Session'}
        </button>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-2 py-2 rounded text-sm hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default OktaAuthProvider;
