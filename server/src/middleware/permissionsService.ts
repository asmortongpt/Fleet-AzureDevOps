/**
 * Permissions Service Middleware
 * Provides permission checking utilities for route handlers
 */

import { Request, Response, NextFunction } from 'express';
import { getUserRoles, hasPermission } from '../lib/authService';
import { logger } from '../lib/logger';

/**
 * Check if user has required permissions for a route
 */
export async function checkPermissions(
  req: Request,
  requiredPermissions: string[]
): Promise<boolean> {
  if (!req.user?.id) {
    return false;
  }

  const userId = req.user.id;
  const tenantId = req.user.tenantId || req.tenantId;

  for (const permission of requiredPermissions) {
    const hasAccess = await hasPermission(userId, permission, tenantId);
    if (!hasAccess) {
      return false;
    }
  }

  return true;
}

/**
 * Middleware factory to require specific permissions
 */
export function requirePermissions(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const hasAccess = await checkPermissions(req, permissions);

      if (!hasAccess) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          requiredPermissions: permissions,
          path: req.path
        });
        res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error checking permissions', { error, permissions });
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(
  userId: string | number,
  roles: string[],
  tenantId?: string | number
): Promise<boolean> {
  try {
    const userRoles = await getUserRoles(userId, tenantId);
    return roles.some(role => userRoles.includes(role));
  } catch (error) {
    logger.error('Error checking roles', { userId, roles, error });
    return false;
  }
}

/**
 * Middleware factory to require specific roles
 */
export function requireRoles(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const tenantId = req.user.tenantId || req.tenantId;
      const hasRole = await hasAnyRole(req.user.id, roles, tenantId);

      if (!hasRole) {
        logger.warn('Role check failed', {
          userId: req.user.id,
          requiredRoles: roles,
          path: req.path
        });
        res.status(403).json({ error: 'Forbidden: Insufficient role' });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error checking roles', { error, roles });
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
