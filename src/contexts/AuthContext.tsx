/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 * SECURITY (CRIT-F-001): Uses httpOnly cookies for token storage
 * SECURITY (CRIT-F-003): Implements RBAC with role hierarchy and permissions
 */

import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';


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
  createdAt?: string;
  updatedAt?: string;
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Development auth bypass check
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true' || import.meta.env.VITE_BYPASS_AUTH === 'true';

// Dev user for local testing when auth is bypassed
const DEV_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@fleetcta.local',
  firstName: 'Dev',
  lastName: 'User',
  role: 'SuperAdmin',
  permissions: ['*'],
  tenantId: '8e33a492-9b42-4e7a-8654-0572c9773b71',
  tenantName: 'Capital Transit Authority',
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<User | null>(SKIP_AUTH && !import.meta.env.PROD ? DEV_USER : null);
  const [isLoading, setIsLoading] = useState(SKIP_AUTH && !import.meta.env.PROD ? false : true);
  const [authRefreshNonce, setAuthRefreshNonce] = useState(0);

  // MSAL hooks for Azure AD authentication
  const { instance, accounts, inProgress} = useMsal();

  // Allow external triggers (e.g., SSO callback) to force a session refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setAuthRefreshNonce((prev) => prev + 1);
    window.addEventListener('fleet-auth-refresh', handler);
    return () => window.removeEventListener('fleet-auth-refresh', handler);
  }, []);

  // SECURITY (CRIT-F-001): Initialize auth state from MSAL or httpOnly cookies
  useEffect(() => {
    let cancelled = false;

    const syncServerSessionFromMsal = async (): Promise<boolean> => {
      if (accounts.length === 0) {
        logger.debug('[Auth] No MSAL accounts found, skipping sync');
        return false;
      }

      try {
        const account = accounts[0];
        logger.info('[Auth] Syncing server session from MSAL', {
          accountId: account.homeAccountId,
          username: account.username,
        });

        // Acquire token silently (no user interaction)
        const tokenResult = await instance.acquireTokenSilent({
          ...loginRequest,
          account,
          forceRefresh: false,
        });

        logger.debug('[Auth] Token acquired successfully', {
          expiresOn: tokenResult.expiresOn,
          scopes: tokenResult.scopes,
        });

        // Exchange Azure AD token for app session
        const exchangeResponse = await fetch('/api/auth/microsoft/exchange', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            accessToken: tokenResult.accessToken,
            idToken: tokenResult.idToken,
            account: {
              username: account.username,
              name: account.name,
              localAccountId: account.localAccountId,
            },
          }),
        });

        if (!exchangeResponse.ok) {
          const errorText = await exchangeResponse.text();
          logger.warn('[Auth] Microsoft token exchange failed', {
            status: exchangeResponse.status,
            statusText: exchangeResponse.statusText,
            error: errorText,
          });
          return false;
        }

        const exchangeData = await exchangeResponse.json();
        logger.info('[Auth] Token exchange successful', {
          userId: exchangeData.user?.id,
          role: exchangeData.user?.role,
        });

        return true;
      } catch (error: any) {
        logger.error('[Auth] Failed to sync server session from MSAL:', {
          error: error.message,
          errorCode: error.errorCode,
          name: error.name,
        });
        return false;
      }
    };

    const fetchSessionUser = async (): Promise<User | null> => {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Send httpOnly cookie
      });

      if (!response.ok) return null;

      const responseData = await response.json();
      const payload = responseData.data || responseData;
      const userInfo = payload.user;
      if (!userInfo) {
        logger.warn('[Auth] /api/auth/me returned ok but no user data');
        return null;
      }

      return {
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.first_name,
        lastName: userInfo.last_name,
        role: userInfo.role,
        avatar: userInfo.avatar,
        permissions: userInfo.permissions || [],
        tenantId: userInfo.tenant_id,
        tenantName: userInfo.tenant_name,
        createdAt: userInfo.created_at,
        updatedAt: userInfo.updated_at,
      };
    };

    const initAuth = async () => {
      try {
        if (cancelled) return;

        // DEV: Skip all auth initialization when SKIP_AUTH is enabled
        if (SKIP_AUTH && !import.meta.env.PROD) {
          logger.info('[Auth] SKIP_AUTH enabled - using dev user, skipping auth initialization');
          setUserState(DEV_USER);
          setIsLoading(false);
          return;
        }

        // Wait until MSAL finishes any redirect/popup processing
        if (inProgress !== InteractionStatus.None) {
          setIsLoading(true);
          return;
        }

        // Prefer server session (httpOnly cookie) when available
        const sessionUser = await fetchSessionUser();
        if (sessionUser) {
          setUserState(sessionUser);
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
          setIsLoading(false);
          return;
        }

        // No server session, try to establish one from MSAL if accounts exist
        if (accounts.length > 0) {
          const exchanged = await syncServerSessionFromMsal();
          if (exchanged) {
            const refreshedUser = await fetchSessionUser();
            if (refreshedUser) {
              setUserState(refreshedUser);
              setIsLoading(false);
              return;
            }
          }
        }

        // No authenticated session available
        setUserState(null);
      } catch (error) {
        logger.error('Failed to initialize auth:', { error });
        setUserState(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, [accounts, inProgress, instance, authRefreshNonce]);

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

      const loginResponse = await response.json();
      // Handle both wrapped ({ success, data: { user } }) and unwrapped ({ user }) response formats
      const loginPayload = loginResponse.data || loginResponse;
      const loginUser = loginPayload.user;
      const userData: User = {
        id: loginUser.id,
        email: loginUser.email,
        firstName: loginUser.first_name,
        lastName: loginUser.last_name,
        role: loginUser.role,
        avatar: loginUser.avatar,
        permissions: loginUser.permissions || [],
        tenantId: loginUser.tenant_id,
        tenantName: loginUser.tenant_name,
        createdAt: loginUser.created_at,
        updatedAt: loginUser.updated_at
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
      logger.info('[Auth] Initiating MSAL login redirect', {
        authority: loginRequest,
        redirectUri: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : 'unknown'
      });

      // Use loginRedirect for better UX on mobile and compliance
      await instance.loginRedirect({
        ...loginRequest,
        redirectStartPage: window.location.href,
      });
    } catch (error: any) {
      logger.error('[Auth] MSAL login failed:', {
        error: error.message,
        errorCode: error.errorCode,
        errorMessage: error.errorMessage,
      });

      // Fallback to old OAuth flow if MSAL fails
      logger.warn('[Auth] Falling back to legacy OAuth flow');
      window.location.href = getMicrosoftLoginUrl();
    }
  }, [instance]);

  // SECURITY (CRIT-F-001): Logout function
  const logout = useCallback(async () => {
    try {
      logger.info('[Auth] Starting logout process');

      // Stop token refresh
      stopTokenRefresh();

      // Clear local token storage
      const { getTokenStorage } = await import('@/services/token-storage');
      const persistentStorage = getTokenStorage(true);
      const sessionStorage_ = getTokenStorage(false);

      await Promise.all([
        persistentStorage.clearTokens(),
        sessionStorage_.clearTokens()
      ]);

      logger.debug('[Auth] Local tokens cleared');

      // If MSAL account exists, logout from MSAL
      if (accounts.length > 0) {
        logger.info('[Auth] Logging out from MSAL');

        // Clear backend session first
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          logger.warn('[Auth] Backend logout failed (continuing with MSAL):', { error });
        }

        // Clear CSRF token
        clearCsrfToken();

        // Clear MSAL cache and redirect
        await instance.logoutRedirect({
          account: accounts[0]
        });

        return; // MSAL will handle the redirect
      }

      // Call backend to clear httpOnly cookie
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        logger.debug('[Auth] Backend session cleared');
      } catch (error) {
        logger.warn('[Auth] Backend logout failed:', { error });
      }

      // Clear CSRF token
      clearCsrfToken();

      // Clear local storage items
      localStorage.removeItem('demo_mode');
      localStorage.removeItem('demo_role');
      localStorage.removeItem('fleet_auth_state');

      // Clear session storage items
      sessionStorage.removeItem('fleet_enc_key');
      sessionStorage.removeItem('msal.account.keys');
      sessionStorage.removeItem('msal.token.keys.access_token');
      sessionStorage.removeItem('msal.token.keys.refresh_token');

      logger.info('[Auth] Logout successful');
    } catch (error) {
      logger.error('[Auth] Logout error:', { error });
    } finally {
      // Always clear user state
      setUserState(null);

      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?reason=logged_out';
      }
    }
  }, [instance, accounts]);

  // Set user (for demo mode)
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

// Export the context for advanced use cases
export { AuthContext };
