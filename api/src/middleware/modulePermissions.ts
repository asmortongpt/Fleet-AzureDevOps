/**
 * Module-Based Permission Middleware
 * Express middleware for module and action-based RBAC enforcement
 * Works alongside the existing fine-grained permission system
 */

import { Request, Response, NextFunction } from 'express';
import { permissionEngine } from '../permissions/engine';
import { auditService } from '../services/auditService';
import { User } from '../permissions/types';

/**
 * Require user to have access to a specific module
 */
export function requireModule(moduleName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User;

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { modules } = await permissionEngine.visibleModules(user);

      const hasAccess = modules.includes(moduleName);

      // Audit the check
      await auditService.logPermissionCheck({
        user_id: user.id,
        action: `module.${moduleName}`,
        resource_type: 'module',
        allowed: hasAccess,
        reason: hasAccess ? 'Access granted' : 'Module not accessible to user roles',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        context: {
          module: moduleName,
          userRoles: user.roles
        }
      });

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this module',
          required_module: moduleName
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireModule middleware:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check module permission'
      });
    }
  };
}

/**
 * Require user to have permission for a specific action
 */
export function requireAction(actionName: string, resourceGetter?: (req: Request) => any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User;

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Get resource if getter provided
      const resource = resourceGetter ? resourceGetter(req) : null;

      const result = await permissionEngine.can(user, actionName, resource, {
        resourceType: req.params.resourceType || req.baseUrl.split('/').pop()
      });

      // Audit the check
      await auditService.logPermissionCheck({
        user_id: user.id,
        action: actionName,
        resource_type: resource?.type || req.params.resourceType,
        resource_id: resource?.id || req.params.id,
        allowed: result.allowed,
        reason: result.reason,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        context: {
          conditions: result.conditions,
          userRoles: user.roles
        }
      });

      if (!result.allowed) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to perform this action',
          action: actionName,
          reason: result.reason
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireAction middleware:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check action permission'
      });
    }
  };
}

/**
 * Filter response data based on field-level permissions
 */
export function filterResponse(resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User;

      if (!user) {
        return next();
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to filter data
      res.json = function (data: any) {
        // Only filter if data exists and is an object or array
        if (!data || (typeof data !== 'object')) {
          return originalJson(data);
        }

        // Filter fields
        permissionEngine.filterFields(user, resourceType, data)
          .then(({ filteredData, redactedFields, anonymizedFields }) => {
            // Add metadata about filtering if fields were redacted
            if (redactedFields.length > 0 || anonymizedFields.length > 0) {
              const metadata = {
                _meta: {
                  redacted_fields: redactedFields,
                  anonymized_fields: anonymizedFields,
                  message: 'Some fields have been filtered based on your permissions'
                }
              };

              // If data is an object, add metadata
              if (!Array.isArray(filteredData)) {
                Object.assign(filteredData, metadata);
              }
            }

            return originalJson(filteredData);
          })
          .catch(error => {
            console.error('Error filtering response:', error);
            return originalJson(data); // Fail open - return original data
          });

        return res;
      };

      next();
    } catch (error) {
      console.error('Error in filterResponse middleware:', error);
      next();
    }
  };
}

/**
 * Attach user's permissions to request object
 */
export async function attachPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;

    if (!user) {
      return next();
    }

    // Get visible modules
    const { modules } = await permissionEngine.visibleModules(user);

    // Attach to request
    (req as any).permissions = {
      modules,
      roles: user.roles
    };

    next();
  } catch (error) {
    console.error('Error in attachPermissions middleware:', error);
    next(); // Don't block request if permission attachment fails
  }
}

/**
 * Require specific role (shorthand for common checks)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const hasRole = user.roles.some(role => roles.includes(role));

    if (!hasRole) {
      // Audit failed role check
      auditService.logPermissionCheck({
        user_id: user.id,
        action: 'role.check',
        allowed: false,
        reason: 'Required roles: ${roles.join(', ')}',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        context: {
          requiredRoles: roles,
          userRoles: user.roles
        }
      }).catch(console.error);

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        required_roles: roles
      });
    }

    next();
  };
}

/**
 * Admin only shorthand
 */
export const requireAdmin = requireRole('Admin');

/**
 * Apply record-level filters to query
 */
export async function applyRecordFilters(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as User;

    if (!user) {
      return next();
    }

    const resourceType = req.params.resourceType || req.baseUrl.split('/').pop() || 'unknown';

    // Get existing query from request
    const baseQuery = (req as any).query || {};

    // Apply filters
    const filteredQuery = await permissionEngine.applyRecordFilter(
      baseQuery,
      user,
      resourceType
    );

    // Store filtered query
    (req as any).filteredQuery = filteredQuery;

    next();
  } catch (error) {
    console.error('Error applying record filters:', error);
    next(); // Don't block request
  }
}
