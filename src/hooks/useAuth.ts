// Authentication Hook
// Manages user authentication state, login, logout, and token management

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import logger from '@/utils/logger'
// SECURITY (CRIT-F-002): Import CSRF token management functions
import { refreshCsrfToken, clearCsrfToken } from './use-api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  token: string;
  permissions?: string[]; // CRIT-F-003: Add permissions array
  tenantId?: string; // CRIT-F-003: Add tenant ID for isolation
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  refreshToken: () => Promise<void>;
  // CRIT-F-003: Add RBAC helper methods
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string | string[]) => boolean;
  canAccess: (requiredRole?: string | string[], requiredPermission?: string | string[]) => boolean;
}

// Create auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider hook (for use in App.tsx)
export const useAuthProvider = () => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // SECURITY (CRIT-F-001): Initialize auth state from httpOnly cookies
  // Tokens are NO LONGER stored in localStorage to prevent XSS attacks
  // Instead, we verify session with backend which reads the httpOnly cookie
  // NOTE: In demo mode (no backend), this will gracefully fail and allow app to continue
  useEffect(() => {
    const initAuth = async () => {
      try {
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
            token: '', // No token in localStorage anymore
          };
          setUserState(userData);
        }
      } catch (error) {
        // Silently handle auth errors in demo mode - app continues to work with demo data
        // In production, this would be a real error
        logger.info('Auth API not available - continuing in demo mode');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // SECURITY (CRIT-F-001): Login function using httpOnly cookies only
  // NO localStorage token storage to prevent XSS token theft
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        credentials: 'include',  // Required to receive httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        role: data.user.role,
        avatar: data.user.avatar,
        token: '', // SECURITY: No token stored in memory/localStorage
      };

      // SECURITY (CRIT-F-001): Token is now ONLY in httpOnly cookie set by backend
      // NO localStorage.setItem('token', ...) - prevents XSS token theft
      // Only store non-sensitive user profile data for UI display
      localStorage.setItem('user', JSON.stringify(userData));

      setUserState(userData);

      // SECURITY (CRIT-F-002): Fetch CSRF token after successful login
      // This ensures we have a valid CSRF token for subsequent state-changing requests
      try {
        await refreshCsrfToken();
        logger.info('CSRF token initialized after login');
      } catch (csrfError) {
        logger.warn('Failed to fetch CSRF token after login:', { error: csrfError });
        // Don't fail login if CSRF token fetch fails - it will be retried on first mutation
      }
    } catch (error) {
      logger.error('Login error:', { error });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // SECURITY (CRIT-F-001): Logout function - backend clears httpOnly cookie
  const logout = useCallback(async () => {
    try {
      // Call backend to clear httpOnly cookie
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      logger.error('Logout error:', { error });
    }

    // SECURITY (CRIT-F-002): Clear CSRF token on logout
    // This prevents stale CSRF tokens from being used after logout
    clearCsrfToken();
    logger.info('CSRF token cleared on logout');

    setUserState(null);
    localStorage.removeItem('user');
    // SECURITY: No localStorage.removeItem('token') - it was never there
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('demo_role');
  }, []);

  // SECURITY (CRIT-F-001): Set user for demo mode only
  // NO token storage in localStorage
  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      // Only store non-sensitive user profile data
      const safeUser = { ...newUser, token: '' }; // Strip token
      localStorage.setItem('user', JSON.stringify(safeUser));
      // SECURITY: No localStorage.setItem('token', ...) - prevents XSS
    }
  }, []);

  // CRIT-F-003: RBAC helper methods

  /**
   * Check if user has a specific role (or any of the specified roles)
   * Supports role hierarchy: admin > manager > user > guest
   */
  const hasRole = useCallback((requiredRoles: string | string[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRole = user.role.toLowerCase();

    // Role hierarchy
    const ROLE_HIERARCHY: Record<string, string[]> = {
      admin: ['admin', 'manager', 'user', 'guest'],
      manager: ['manager', 'user', 'guest'],
      user: ['user', 'guest'],
      guest: ['guest']
    };

    const userHierarchy = ROLE_HIERARCHY[userRole] || [userRole];

    return roles.some(required =>
      userHierarchy.includes(required.toLowerCase())
    );
  }, [user]);

  /**
   * Check if user has a specific permission (or any of the specified permissions)
   */
  const hasPermission = useCallback((requiredPermissions: string | string[]): boolean => {
    if (!user || !user.permissions) return false;

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    return permissions.some(required =>
      user.permissions?.includes(required)
    );
  }, [user]);

  /**
   * Check if user can access a resource based on role AND/OR permission
   * If both role and permission are specified, user must satisfy BOTH
   */
  const canAccess = useCallback((
    requiredRole?: string | string[],
    requiredPermission?: string | string[]
  ): boolean => {
    if (!user) return false;

    const hasRequiredRole = requiredRole ? hasRole(requiredRole) : true;
    const hasRequiredPermission = requiredPermission ? hasPermission(requiredPermission) : true;

    return hasRequiredRole && hasRequiredPermission;
  }, [user, hasRole, hasPermission]);

  // SECURITY (CRIT-F-001): Refresh token using httpOnly cookie only
  // Backend rotates httpOnly cookie, NO localStorage token storage
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',  // Send httpOnly cookie, receive new one
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (user && data.user) {
        // Update user profile data only, NO token storage
        const updatedUser = {
          ...user,
          ...data.user,
          token: '' // SECURITY: No token in memory
        };
        setUserState(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // SECURITY: No localStorage.setItem('token', ...) - prevents XSS
      }
    } catch (error) {
      logger.error('Token refresh error:', { error });
      logout();
    }
  }, [user, logout]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setUser,
    refreshToken,
    // CRIT-F-003: RBAC helper methods
    hasRole,
    hasPermission,
    canAccess,
  };
};
