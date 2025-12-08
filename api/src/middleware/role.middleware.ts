import { Request, Response, NextFunction } from 'express'

import logger from '../utils/logger'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    tenant_id: string
  }
}

/**
 * Role-based access control middleware
 * Checks if the authenticated user has one of the required roles
 *
 * @param roles - Array of allowed role names
 * @returns Express middleware function
 */
export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('❌ ROLE CHECK - No authenticated user')
      return res.status(401).json({ error: 'Authentication required' })
    }

    // SECURITY: Enforce RBAC for ALL HTTP methods (CWE-862)
    // Check if user's role is in the allowed roles array
    if (!roles.includes(req.user.role)) {
      logger.warn('❌ ROLE CHECK - Permission denied:', {
        method: req.method,
        path: req.path,
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles
      })
      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredRoles: roles,
        userRole: req.user.role
      })
    }

    logger.info('✅ ROLE CHECK - Permission granted:', {
      method: req.method,
      path: req.path,
      userId: req.user.id,
      userRole: req.user.role
    })

    next()
  }
}
