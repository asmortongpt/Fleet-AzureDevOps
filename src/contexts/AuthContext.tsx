/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 * SECURITY (CRIT-F-001): Uses httpOnly cookies for token storage
 * SECURITY (CRIT-F-003): Implements RBAC with role hierarchy and permissions
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';

import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { getCsrfToken, refreshCsrfToken, clearCsrfToken } from '@/hooks/use-api';
import { initializeTokenRefresh, stopTokenRefresh } from '@/lib/auth/token-refresh';
import { getMicrosoftLoginUrl } from '@/lib/microsoft-auth';
import { loginRequest } from '@/lib/msal-config';
import logger from '@/utils/logger';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  permissions: string[];
  tenantId: string;
  tenantName?: string;
}

export type UserRole = 'SuperAdmin' | 'Admin' | 'Manager' | 'User' | 'ReadOnly';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithMicrosoft: () => void;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshToken: () => Promise<void>;
  // RBAC helper methods
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string | string[]) => boolean;
  canAccess: (requiredRole?: UserRole | UserRole[], requiredPermission?: string | string[]) => boolean;
  isRole: (role: UserRole) => boolean;
  isSuperAdmin: () => boolean;
  // Tenant management
  switchTenant: (tenantId: string) => Promise<void>;
  getCurrentTenant: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track if auth initialization is in progress to prevent concurrent calls
  const isInitializingRef = useRef(false);

  // MSAL hooks for Azure AD authentication
  const { instance, accounts, inProgress } = useMsal();

  // FIX: Memoize MSAL values to prevent infinite render loop
  // MSAL hooks can return new array references on every render, causing useCallback deps to change
  // Use accounts.length (primitive) instead of accounts array to avoid reference changes
  const accountCount = accounts.length;
  const hasAccounts = accountCount > 0;
  const firstAccount = useMemo(() => accounts[0], [accountCount]);

  // SECURITY (CRIT-F-001): Initialize auth state from MSAL or httpOnly cookies
  useEffect(() => {
    const initAuth = async () => {
      // Prevent concurrent executions using ref (not state) to avoid blocking re-runs
      if (isInitializingRef.current) {
        logger.debug('[Auth] Init already in progress, skipping concurrent call');
        return;
      }

      // CRITICAL FIX: Prevent unnecessary re-initialization if user is already set
      // This prevents infinite loops when inProgress changes from 'startup' -> 'none'
      if (user && !hasAccounts) {
        logger.debug('[Auth] User already authenticated, skipping re-initialization', {
          userId: user.id,
          inProgress
        });
        return;
      }

      isInitializingRef.current = true;
      logger.info('[Auth] Initializing authentication', {
        hasAccounts,
        accountCount,
        inProgress,
        userAlreadySet: !!user
      });

      try {
        // Only enabled when (NODE_ENV='test' OR MODE='development') AND VITE_SKIP_AUTH='true'
        const SKIP_AUTH = (process.env.NODE_ENV === 'test' || import.meta.env.MODE === 'development') && import.meta.env.VITE_SKIP_AUTH === 'true';

        // Log security warning if bypass is enabled in non-test environment
        // Only warn in production - this is expected in development mode
        if (SKIP_AUTH && process.env.NODE_ENV !== 'test' && import.meta.env.PROD) {
          logger.warn('[Security] CRITICAL: Authentication bypass is enabled in non-test environment!', {
            nodeEnv: process.env.NODE_ENV,
            skipAuth: SKIP_AUTH
          });
        }

        if (SKIP_AUTH) {
          const demoUser: User = {
            id: '34c5e071-2d8c-44d0-8f1f-90b58672dceb', // Real Seeded User ID
            email: 'toby.deckow@capitaltechalliance.com', // Real Seeded Email
            firstName: 'Toby',
            lastName: 'Deckow',
            role: 'SuperAdmin', // Promoted to SuperAdmin for full access
            permissions: ['*'], // Full permissions
            tenantId: 'ee1e7320-b232-402e-b4f8-288998b5bff7', // Real Seeded Tenant ID
            tenantName: 'Capital Tech Alliance'
          };
          setUserState(demoUser);
          setIsLoading(false);
          logger.info('[Auth] Development auth bypass enabled - using demo user');
          isInitializingRef.current = false;
          return;
        }

        // Check for MSAL authentication
        // Only process MSAL account when not actively in a user interaction flow
        const activeInteractions = [
          // @ts-expect-error - MSAL API changes - InteractionStatus enum values may have changed
          InteractionStatus.Login,
          // @ts-expect-error - MSAL API changes - InteractionStatus enum values may have changed
          InteractionStatus.Logout,
          // @ts-expect-error - MSAL API changes - InteractionStatus enum values may have changed
          InteractionStatus.HandleRedirect,
          // @ts-expect-error - MSAL API changes - InteractionStatus enum values may have changed
          InteractionStatus.AcquireToken,
          // @ts-expect-error - MSAL API changes - InteractionStatus enum values may have changed
          InteractionStatus.SsoSilent
        ];

        if (hasAccounts && firstAccount && !activeInteractions.includes(inProgress as any)) {
          logger.info('[Auth] MSAL account found - creating user object', {
            email: firstAccount.username,
            accountId: firstAccount.localAccountId,
            tenantId: firstAccount.tenantId,
            inProgress
          });

          // Create user from MSAL account
          const msalUser: User = {
            id: firstAccount.localAccountId,
            email: firstAccount.username,
            firstName: firstAccount.name?.split(' ')[0] || '',
            lastName: firstAccount.name?.split(' ').slice(1).join(' ') || '',
            role: 'User', // Default role, should be fetched from backend
            permissions: [],
            tenantId: firstAccount.tenantId,
            tenantName: firstAccount.tenantId
          };
          setUserState(msalUser);
          setIsLoading(false);
          logger.info('[Auth] MSAL authentication successful - user object set', {
            userId: msalUser.id,
            email: msalUser.email
          });
          isInitializingRef.current = false;
          return;
        }

        // Check if we have a valid session via httpOnly cookie
        // Note: This request will return 401 if not authenticated, which is expected behavior
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Send httpOnly cookie
        });

        if (response.ok) {
          const data = await response.json();
          const userData: User = {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            role: data.user.role,
            avatar: data.user.avatar,
            permissions: data.user.permissions || [],
            tenantId: data.user.tenant_id,
            tenantName: data.user.tenant_name
          };
          setUserState(userData);

          // Initialize token refresh mechanism
          initializeTokenRefresh({
            onRefresh: (success) => {
              if (!success) {
                logger.error('[Auth] Token refresh failed - logging out');
                logout();
              }
            },
            onExpire: () => {
              logger.warn('[Auth] Session expired');
              logout();
            }
          });
        } else if (response.status === 401) {
          // 401 Unauthorized is expected when no valid session exists
          // No need to log this as an error - it's normal behavior for unauthenticated users
          logger.debug('[Auth] No active session found (401) - user needs to log in');
        } else {
          // Other non-200 responses are actual errors
          logger.error('[Auth] Unexpected response from /api/auth/me:', {
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (error) {
        // Network errors or fetch failures
        logger.error('Failed to initialize auth:', { error });
      } finally {
        // CRITICAL FIX: Complete loading after auth check UNLESS MSAL is actively processing user interaction
        // We need to set loading to false so ProtectedRoute can decide whether to redirect
        // Keep loading ONLY when MSAL is actively handling user interactions (Login, Logout, HandleRedirect, etc.)
        const activeInteractions = [
          // @ts-expect-error - MSAL API changes - InteractionStatus enum values may have changed
          InteractionStatus.Login,
          // @ts-expect-error - MSAL API changes - InteractionStatus enum values may have changed
          InteractionStatus.Logout,
          // @ts-expect-error - MSAL API changes - InteractionStatus enum values may have changed
          InteractionStatus.HandleRedirect,
          // @ts-expect-error - MSAL API changes - InteractionStatus enum values may have changed
          InteractionStatus.AcquireToken,
          // @ts-expect-error - MSAL API changes - InteractionStatus enum values may have changed
          InteractionStatus.SsoSilent
        ];

        const isActivelyProcessing = activeInteractions.includes(inProgress as any);

        if (!isActivelyProcessing) {
          // Safe to complete loading for: None, Startup, or any future idle states
          setIsLoading(false);
          logger.info('[Auth] Auth initialization complete, loading set to false', { inProgress });
        } else {
          // Keep loading while MSAL actively processes user interaction
          logger.debug('[Auth] MSAL actively processing user interaction, keeping loading state', { inProgress });
        }
        // Reset initialization flag to allow future re-runs
        isInitializingRef.current = false;
      }
    };

    initAuth();
  }, [firstAccount?.localAccountId, inProgress]); // FIX: Only depend on account ID and interaction status

  // SECURITY (CRIT-F-001): Login function using httpOnly cookies only
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Get CSRF token first
      const csrfToken = await getCsrfToken();

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        role: data.user.role,
        avatar: data.user.avatar,
        permissions: data.user.permissions || [],
        tenantId: data.user.tenant_id,
        tenantName: data.user.tenant_name
      };

      setUserState(userData);

      // Initialize CSRF token
      try {
        await refreshCsrfToken();
        logger.info('[Auth] CSRF token initialized after login');
      } catch (csrfError) {
        logger.warn('[Auth] Failed to fetch CSRF token:', { error: csrfError });
      }

      // Initialize token refresh mechanism
      initializeTokenRefresh({
        onRefresh: (success) => {
          if (!success) {
            logout();
          }
        },
        onExpire: () => {
          logout();
        }
      });

      logger.info('[Auth] Login successful', { userId: userData.id, role: userData.role });
    } catch (error) {
      logger.error('[Auth] Login error:', { error });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Microsoft OAuth login using MSAL
  const loginWithMicrosoft = useCallback(async () => {
    try {
      logger.info('[Auth] Initiating MSAL login redirect');
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      logger.error('[Auth] MSAL login failed:', { error });
      // Fallback to old OAuth flow if MSAL fails
      window.location.href = getMicrosoftLoginUrl();
    }
  }, [instance]);

  // SECURITY (CRIT-F-001): Logout function
  const logout = useCallback(async () => {
    try {
      // Stop token refresh
      stopTokenRefresh();

      // If MSAL account exists, logout from MSAL
      if (hasAccounts && firstAccount) {
        logger.info('[Auth] Logging out from MSAL');
        await instance.logoutRedirect({
          account: firstAccount
        });
        return; // MSAL will handle the redirect
      }

      // Call backend to clear httpOnly cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear CSRF token
      clearCsrfToken();

      logger.info('[Auth] Logout successful');
    } catch (error) {
      logger.error('[Auth] Logout error:', { error });
    }

    setUserState(null);
  }, [instance, hasAccounts, firstAccount]);

  // Set user
  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (user && data.user) {
        const updatedUser: User = {
          ...user,
          ...data.user,
          permissions: data.user.permissions || user.permissions,
        };
        setUserState(updatedUser);
      }

      logger.info('[Auth] Token refreshed successfully');
    } catch (error) {
      logger.error('[Auth] Token refresh error:', { error });
      logout();
    }
  }, [user, logout]);

  // RBAC: Role Hierarchy
  // SuperAdmin > Admin > Manager > User > ReadOnly
  const ROLE_HIERARCHY: Record<UserRole, number> = {
    SuperAdmin: 5,
    Admin: 4,
    Manager: 3,
    User: 2,
    ReadOnly: 1,
  };

  // Check if user has required role(s)
  const hasRole = useCallback((requiredRoles: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRoleLevel = ROLE_HIERARCHY[user.role];

    // User must have at least the minimum required role level
    return roles.some(role => userRoleLevel >= ROLE_HIERARCHY[role]);
  }, [user]);

  // Check if user has required permission(s)
  const hasPermission = useCallback((requiredPermissions: string | string[]): boolean => {
    if (!user || !user.permissions) return false;

    // Wildcard permission grants all access
    if (user.permissions.includes('*')) return true;

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    return permissions.some(required =>
      user.permissions.includes(required) ||
      user.permissions.some(p => p.endsWith(':*') && required.startsWith(p.replace(':*', '')))
    );
  }, [user]);

  // Check if user can access resource
  const canAccess = useCallback((
    requiredRole?: UserRole | UserRole[],
    requiredPermission?: string | string[]
  ): boolean => {
    if (!user) return false;

    const hasRequiredRole = requiredRole ? hasRole(requiredRole) : true;
    const hasRequiredPermission = requiredPermission ? hasPermission(requiredPermission) : true;

    return hasRequiredRole && hasRequiredPermission;
  }, [user, hasRole, hasPermission]);

  // Check exact role match
  const isRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  // Check if user is SuperAdmin
  const isSuperAdmin = useCallback((): boolean => {
    return user?.role === 'SuperAdmin';
  }, [user]);

  // Switch tenant (SuperAdmin only)
  const switchTenant = useCallback(async (tenantId: string) => {
    if (!isSuperAdmin()) {
      throw new Error('Only SuperAdmins can switch tenants');
    }

    try {
      const response = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (!response.ok) {
        throw new Error('Tenant switch failed');
      }

      const data = await response.json();
      const updatedUser: User = {
        ...user!,
        tenantId: data.user.tenant_id,
        tenantName: data.user.tenant_name,
      };
      setUserState(updatedUser);

      logger.info('[Auth] Tenant switched', { tenantId, tenantName: data.user.tenant_name });
    } catch (error) {
      logger.error('[Auth] Tenant switch error:', { error });
      throw error;
    }
  }, [user, isSuperAdmin]);

  // Get current tenant ID
  const getCurrentTenant = useCallback((): string | null => {
    return user?.tenantId || null;
  }, [user]);

  // Memoize context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithMicrosoft,
      logout,
      setUser,
      refreshToken,
      hasRole,
      hasPermission,
      canAccess,
      isRole,
      isSuperAdmin,
      switchTenant,
      getCurrentTenant,
    }),
    [
      user,
      isLoading,
      login,
      loginWithMicrosoft,
      logout,
      setUser,
      refreshToken,
      hasRole,
      hasPermission,
      canAccess,
      isRole,
      isSuperAdmin,
      switchTenant,
      getCurrentTenant,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
