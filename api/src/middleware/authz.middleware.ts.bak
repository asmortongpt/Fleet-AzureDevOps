/**
 * Authorization Middleware
 *
 * Permission checking and role validation using AuthorizationService
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

import { AuditService, AuditCategory, AuditSeverity } from '../services/audit/AuditService';
import { AuthorizationService } from '../services/authz/AuthorizationService';

export class AuthzMiddleware {
  constructor(
    private authzService: AuthorizationService,
    private auditService: AuditService
  ) {}

  /**
   * Check if user has specific permission
   */
  requirePermission = (permission: string, resource?: any) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
          return;
        }

        const hasPermission = await this.authzService.hasPermission(
          req.user.userUuid,
          permission,
          resource || req.params
        );

        if (!hasPermission) {
          await this.auditService.log({
            userId: req.user.userId.toString(),
            action: 'permission_check',
            category: AuditCategory.AUTHORIZATION,
            severity: AuditSeverity.WARNING,
            result: 'failure',
            errorMessage: `Permission denied: ${permission}`,
            metadata: {
              ipAddress: req.ip || 'unknown',
              userAgent: req.headers['user-agent'] || 'unknown',
              requestId: req.headers['x-request-id'] as string
            }
          });

          res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({ success: false, error: { code: 'AUTHZ_ERROR', message: 'Authorization check failed' } });
      }
    };
  };

  /**
   * Require specific role
   */
  requireRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
          return;
        }

        const userRoles = await this.authzService.getUserRoles(req.user.userUuid);
        const hasRole = userRoles.some(role => roles.includes(role.name));

        if (!hasRole) {
          res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Required role not found' } });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({ success: false, error: { code: 'AUTHZ_ERROR', message: 'Role check failed' } });
      }
    };
  };
}

export function createAuthzMiddleware(pool: Pool, auditService: AuditService): AuthzMiddleware {
  const authzService = new AuthorizationService(pool, true, process.env.REDIS_URL);
  return new AuthzMiddleware(authzService, auditService);
}
