/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 * SECURITY (CRIT-F-001): Uses httpOnly cookies for token storage
 * SECURITY (CRIT-F-003): Implements RBAC with role hierarchy and permissions
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

import { refreshCsrfToken, clearCsrfToken } from '@/hooks/use-api';
import { initializeTokenRefresh, stopTokenRefresh } from '@/lib/auth/token-refresh';
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

  // SECURITY (CRIT-F-001): Initialize auth state from httpOnly cookies
  useEffect(() => {
    const initAuth = async () => {
      try {
        // DEMO MODE: Skip auth verification, use demo user
        const DEMO_MODE = import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
                          localStorage.getItem('demo_mode') !== 'false';

        if (DEMO_MODE) {
          const demoUser: User = {
            id: 'demo-user-1',
            email: 'demo@fleet.com',
            firstName: 'Demo',
            lastName: 'User',
            role: 'Admin',
            permissions: ['*'], // Full permissions in demo
            tenantId: 'demo-tenant-1',
            tenantName: 'Demo Organization'
          };
          setUserState(demoUser);
          setIsLoading(false);
          return;
        }

        // Check if we have a valid session via httpOnly cookie
        const response = await fetch('/api/v1/auth/verify', {
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
        }
      } catch (error) {
        const DEMO_MODE = import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
                          localStorage.getItem('demo_mode') !== 'false';
        if (!DEMO_MODE) {
          logger.error('Failed to initialize auth:', { error });
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // SECURITY (CRIT-F-001): Login function using httpOnly cookies only
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
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

  // Microsoft OAuth login
  const loginWithMicrosoft = useCallback(() => {
    const { getMicrosoftLoginUrl } = require('@/lib/microsoft-auth');
    window.location.href = getMicrosoftLoginUrl();
  }, []);

  // SECURITY (CRIT-F-001): Logout function
  const logout = useCallback(async () => {
    try {
      // Stop token refresh
      stopTokenRefresh();

      // Call backend to clear httpOnly cookie
      await fetch('/api/v1/auth/logout', {
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
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('demo_role');
  }, []);

  // Set user (for demo mode)
  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
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
      const response = await fetch('/api/v1/auth/switch-tenant', {
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

  const value: AuthContextType = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
