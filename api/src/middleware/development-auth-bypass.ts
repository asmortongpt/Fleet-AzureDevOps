/**
 * Development Auth Bypass Middleware
 *
 * SECURITY: This middleware is ONLY active in development mode (NODE_ENV=development)
 * It sets a default user on req.user to bypass JWT authentication for local testing.
 *
 * This allows the frontend to work with VITE_SKIP_AUTH=true during development
 * while still making real API calls to the backend.
 *
 * ⚠️ WARNING: This middleware is NEVER used in production!
 */

import { Request, Response, NextFunction } from 'express'
import logger from '../config/logger'

export interface DevAuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    tenant_id: string
    scope_level?: string
    team_driver_ids?: string[]
    userId?: string
    tenantId?: string
    name?: string
    org_id?: string
  }
}

/**
 * Development-only auth bypass
 *
 * Sets a default development user to allow API testing without JWT tokens
 */
export const developmentAuthBypass = (
  req: DevAuthRequest,
  res: Response,
  next: NextFunction
) => {
  // CRITICAL SECURITY CHECK: Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    logger.error('❌ SECURITY VIOLATION: Development auth bypass attempted in non-development environment!')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  // Set a default development user
  req.user = {
    id: '00000000-0000-0000-0000-000000000001', // Dev user UUID
    email: 'dev@localhost',
    role: 'Admin', // Full permissions for development
    tenant_id: '00000000-0000-0000-0000-000000000001', // Default tenant
    scope_level: 'admin',
    name: 'Development User',
    userId: '00000000-0000-0000-0000-000000000001',
    tenantId: '00000000-0000-0000-0000-000000000001',
    org_id: '00000000-0000-0000-0000-000000000001'
  }

  logger.debug('🔓 Development auth bypass active - using default dev user')
  next()
}

/**
 * Check if development auth bypass should be active
 */
export const isDevelopmentBypassEnabled = (): boolean => {
  return process.env.NODE_ENV === 'development'
}
