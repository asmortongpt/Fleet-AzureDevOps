import { Request, Response, NextFunction } from 'express';

import { getUserRoles, getRoutePermissions } from '../services/permissionsService';
import { FedRAMPCompliantLogger } from '../utils/fedrampLogger';
import { Logger } from '../utils/logger';

// Ensure TypeScript strict mode is enabled in tsconfig.json

// Middleware for Role-Based Access Control
export const rbacMiddleware = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        Logger.warn('Unauthorized access attempt: User ID is missing');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Fetch user roles from the database or cache
      const userRoles = await getUserRoles(userId);
      if (!userRoles) {
        Logger.warn(`User with ID ${userId} has no roles assigned`);
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Fetch route permissions
      const routePermissions = getRoutePermissions(requiredPermissions);
      if (!routePermissions) {
        Logger.error(`Route permissions not found for the requested route`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      // Check if user roles include any of the required permissions
      const hasPermission = userRoles.some(role => routePermissions.includes(role));
      if (!hasPermission) {
        Logger.warn(`User with ID ${userId} does not have the required permissions`);
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Log access attempt for compliance
      FedRAMPCompliantLogger.logAccessAttempt(userId, req.path, true);

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      Logger.error(`Error in RBAC middleware: ${error.message}`);
      FedRAMPCompliantLogger.logError(error, req.user?.id, req.path);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};

// FedRAMP Compliance Notes:
// - All access attempts and errors are logged for auditing purposes
// - Sensitive information is not logged to ensure data protection
// - User roles and permissions are verified against a secure source
// - Error handling ensures that no sensitive information is exposed to the client