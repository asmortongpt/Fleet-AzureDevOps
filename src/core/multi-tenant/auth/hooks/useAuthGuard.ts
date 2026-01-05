
/**
 * Authentication Guard Hooks
 * Custom hooks for role-based access control and security
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { AUTH_CONFIG } from '../config';
import { Permission, GovernmentRole, AuditEventType } from '../types';

import { logger } from '@/utils/logger';

// Hook for role-based access control
export const useRoleGuard = (requiredRoles: GovernmentRole | GovernmentRole[]) => {
  const { user, hasRole, hasAnyRole, isAuthenticated } = useAuth();

  const roles = useMemo(() =>
    Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles],
    [requiredRoles]
  );

  const hasAccess = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    return hasAnyRole(roles);
  }, [isAuthenticated, user, roles, hasAnyRole]);

  const missingRoles = useMemo(() => {
    if (!user) return roles;
    return roles.filter(role => !hasRole(role));
  }, [user, roles, hasRole]);

  return {
    hasAccess,
    missingRoles,
    userRoles: user?.roles || [],
    isAuthenticated
  };
};

// Hook for permission-based access control
export const usePermissionGuard = (requiredPermissions: Permission | Permission[]) => {
  const { user, hasPermission, isAuthenticated } = useAuth();

  const permissions = useMemo(() =>
    Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions],
    [requiredPermissions]
  );

  const hasAccess = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    return permissions.every(permission => hasPermission(permission));
  }, [isAuthenticated, user, permissions, hasPermission]);

  const missingPermissions = useMemo(() => {
    if (!user) return permissions;
    return permissions.filter(permission => !hasPermission(permission));
  }, [user, permissions, hasPermission]);

  return {
    hasAccess,
    missingPermissions,
    userPermissions: user?.permissions || [],
    isAuthenticated
  };
};

// Hook for session management
export const useSessionGuard = () => {
  const { sessionExpiry, isSessionExpired, extendSession, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!sessionExpiry) return;

    const updateTimeRemaining = () => {
      const remaining = Math.max(0, sessionExpiry.getTime() - Date.now());
      setTimeRemaining(remaining);

      const warningThreshold = AUTH_CONFIG.session.warningTime * 60 * 1000; // Convert to milliseconds
      setShowWarning(remaining > 0 && remaining <= warningThreshold);

      // Auto-logout if session expired
      if (remaining === 0 && !isSessionExpired()) {
        logout();
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000); // Update every second

    return () => clearInterval(interval);
  }, [sessionExpiry, isSessionExpired, logout]);

  const handleExtendSession = useCallback(async () => {
    try {
      await extendSession();
      setShowWarning(false);
    } catch (error) {
      logger.error('Session extension failed:', error);
      logout();
    }
  }, [extendSession, logout]);

  return {
    showWarning,
    timeRemaining,
    sessionExpiry,
    isExpired: isSessionExpired(),
    extendSession: handleExtendSession,
    logout
  };
};

// Hook for route protection
export const useRouteGuard = (
  requiredRole?: GovernmentRole,
  requiredPermission?: Permission,
  redirectTo: string = '/unauthorized'
) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  const roleGuard = useRoleGuard(requiredRole || GovernmentRole.VIEWER);
  const permissionGuard = usePermissionGuard(requiredPermission || Permission.FLEET_VIEW_ALL);

  const hasAccess = useMemo(() => {
    if (!isAuthenticated) return false;
    let roleAccess = true;
    let permissionAccess = true;

    if (requiredRole) {
      roleAccess = roleGuard.hasAccess;
    }

    if (requiredPermission) {
      permissionAccess = permissionGuard.hasAccess;
    }

    return roleAccess && permissionAccess;
  }, [isAuthenticated, requiredRole, requiredPermission, roleGuard.hasAccess, permissionGuard.hasAccess]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Store current location for post-login redirect
      navigate('/login', {
        state: { from: location },
        replace: true
      });
      return;
    }

    if (!hasAccess) {
      navigate(redirectTo, {
        state: {
          from: location,
          reason: 'insufficient_permissions',
          required: {
            role: requiredRole,
            permission: requiredPermission
          }
        },
        replace: true
      });
    }
  }, [isLoading, isAuthenticated, hasAccess, navigate, location, redirectTo, requiredRole, requiredPermission]);

  return {
    hasAccess,
    isLoading,
    isAuthenticated,
    missingRoles: roleGuard.missingRoles,
    missingPermissions: permissionGuard.missingPermissions
  };
};

// Hook for audit logging
export const useAuditLogger = () => {
  const { user } = useAuth();

  const logEvent = useCallback(async (
    eventType: AuditEventType,
    details: Record<string, any> = {},
    resource?: string,
    action?: string
  ) => {
    if (!AUTH_CONFIG.compliance.auditEnabled) return;

    const auditEntry = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      user_id: user?.sub || 'anonymous',
      user_email: user?.email || 'unknown',
      session_id: 'session_' + Date.now(), // Simplified for demo
      ip_address: 'client_ip', // Would be populated by backend
      user_agent: navigator.userAgent,
      resource,
      action,
      result: 'success',
      details,
      security_context: details.security_context || 'internal'
    };

    try {
      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Audit Event:', auditEntry);
      }

      // Send to audit service
      const response = await fetch(AUTH_CONFIG.compliance.auditEndpoint, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(auditEntry)
      });

      if (!response.ok) {
        throw new Error(`Audit logging failed: ${response.status}`);
      }
    } catch (error) {
      logger.error('Audit logging failed:', error);
      // In production, you might want to queue failed audit logs for retry
    }
  }, [user]);

  return { logEvent };
};

// Hook for MFA enforcement
export const useMFAGuard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const mfaRequired = AUTH_CONFIG.security.requireMFA;
  const mfaEnabled = user?.mfa_enabled || false;

  const needsMFA = useMemo(() => {
    return mfaRequired && !mfaEnabled;
  }, [mfaRequired, mfaEnabled]);

  useEffect(() => {
    if (needsMFA && user) {
      // In a real implementation, this would redirect to MFA setup
      logger.debug('MFA setup required for user');

      // For demo purposes, show a warning
      if (window.confirm('Multi-Factor Authentication is required. Would you like to set it up now?')) {
        navigate('/profile/security');
      } else {
        // Force logout if user refuses MFA setup
        logout();
      }
    }
  }, [needsMFA, user, navigate, logout]);

  return {
    mfaRequired,
    mfaEnabled,
    needsMFA
  };
};

// Hook for IP-based access control
export const useIPGuard = () => {
  const [clientIP, setClientIP] = useState<string>('');
  const [isAllowed, setIsAllowed] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    // Get client IP (in production, this would come from the server)
    const fetchClientIP = async () => {
      try {
        // This is a simplified example - in production, IP validation
        // would be handled on the server side
        const response = await fetch('/api/client-ip');

        if (response.ok) {
          const data = await response.json();
          setClientIP(data.ip);

          // Check if IP is in whitelist
          if (AUTH_CONFIG.security.ipWhitelist) {
            const allowed = AUTH_CONFIG.security.ipWhitelist.includes(data.ip);
            setIsAllowed(allowed);

            if (!allowed) {
              logger.error('IP not allowed:', data.ip);
              logout();
            }
          }
        }
      } catch (error) {
        logger.error('IP check failed:', error);
        // Don't block access if IP check fails (fail open for availability)
      }
    };

    if (AUTH_CONFIG.security.ipWhitelist) {
      fetchClientIP();
    }
  }, [logout]);

  return {
    clientIP,
    isAllowed,
    ipWhitelistEnabled: !!AUTH_CONFIG.security.ipWhitelist
  };
};

// Composite hook for comprehensive security checks
export const useSecurityGuard = (options: {
  requiredRole?: GovernmentRole;
  requiredPermission?: Permission;
  requireMFA?: boolean;
  checkIP?: boolean;
  redirectTo?: string;
} = {}) => {
  const roleGuard = useRoleGuard(options.requiredRole || GovernmentRole.VIEWER);
  const permissionGuard = usePermissionGuard(options.requiredPermission || Permission.FLEET_VIEW_ALL);
  const sessionGuard = useSessionGuard();
  const mfaGuard = useMFAGuard();
  const ipGuard = useIPGuard();
  const auditLogger = useAuditLogger();

  const hasAccess = useMemo(() => {
    let access = roleGuard.hasAccess && permissionGuard.hasAccess;

    if (options.requireMFA !== false) {
      access = access && !mfaGuard.needsMFA;
    }

    if (options.checkIP !== false) {
      access = access && ipGuard.isAllowed;
    }

    return access;
  }, [
    roleGuard.hasAccess,
    permissionGuard.hasAccess,
    mfaGuard.needsMFA,
    ipGuard.isAllowed,
    options.requireMFA,
    options.checkIP
  ]);

  // Log access attempt
  useEffect(() => {
    if (roleGuard.isAuthenticated) {
      auditLogger.logEvent(
        hasAccess ? AuditEventType.ACCESS_GRANTED : AuditEventType.ACCESS_DENIED,
        {
          required_role: options.requiredRole,
          required_permission: options.requiredPermission,
          user_roles: roleGuard.userRoles,
          user_permissions: permissionGuard.userPermissions,
          mfa_enabled: !mfaGuard.needsMFA,
          ip_allowed: ipGuard.isAllowed
        }
      );
    }
  }, [
    hasAccess,
    roleGuard.isAuthenticated,
    auditLogger,
    options.requiredRole,
    options.requiredPermission,
    roleGuard.userRoles,
    permissionGuard.userPermissions,
    mfaGuard.needsMFA,
    ipGuard.isAllowed
  ]);

  return {
    hasAccess,
    isAuthenticated: roleGuard.isAuthenticated,
    sessionGuard,
    roleGuard,
    permissionGuard,
    mfaGuard,
    ipGuard,
    auditLogger
  };
};
