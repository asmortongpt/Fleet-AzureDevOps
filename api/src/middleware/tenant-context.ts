/**
 * Tenant Context Middleware
 * CRITICAL SECURITY: Sets PostgreSQL session variable for Row-Level Security (RLS)
 *
 * This middleware MUST run after authenticateJWT and before any database queries.
 * It sets the app.current_tenant_id session variable that RLS policies use to
 * filter data and enforce multi-tenant isolation.
 *
 * Security Requirements:
 * - Must run on EVERY request that accesses tenant-scoped data
 * - Must extract tenant_id from authenticated JWT token
 * - Must set PostgreSQL session variable before any queries execute
 * - Must handle errors gracefully and securely
 *
 * Related Files:
 * - api/db/migrations/032_enable_rls.sql - RLS policy definitions
 * - api/db/migrations/033_fix_nullable_tenant_id.sql - NOT NULL constraints
 * - api/src/middleware/auth.ts - JWT authentication (runs before this)
 *
 * Compliance:
 * - FedRAMP AC-3 (Access Enforcement)
 * - SOC 2 CC6.3 (Logical and Physical Access Controls)
 * - Multi-tenancy isolation requirement
 */

import { Request, Response, NextFunction } from 'express'
import pool from '../config/database'
import { AuthRequest } from './auth'
import logger from '../utils/logger'

/**
 * Sets the tenant context for the current database session.
 * This enables Row-Level Security policies to filter data by tenant.
 *
 * Flow:
 * 1. Extract tenant_id from authenticated user (req.user.tenant_id)
 * 2. Execute: SET LOCAL app.current_tenant_id = '<tenant_uuid>'
 * 3. All subsequent queries in this transaction are filtered by tenant
 * 4. Session variable is automatically cleared at transaction end
 *
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function
 */
export const setTenantContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip if user is not authenticated (will be caught by authenticateJWT)
  if (!req.user) {
    logger.warn('⚠️  TENANT CONTEXT - No authenticated user, skipping tenant context')
    return next()
  }

  // Validate tenant_id exists in JWT token
  if (!req.user.tenant_id) {
    console.error('❌ TENANT CONTEXT - No tenant_id in JWT token', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    })

    return res.status(403).json({
      error: 'Invalid authentication token',
      details: 'Tenant information missing. Please re-authenticate.',
      code: 'MISSING_TENANT_ID'
    })
  }

  // Validate tenant_id is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(req.user.tenant_id)) {
    console.error('❌ TENANT CONTEXT - Invalid tenant_id format', {
      tenantId: req.user.tenant_id,
      userId: req.user.id
    })

    return res.status(403).json({
      error: 'Invalid authentication token',
      details: 'Tenant identifier is malformed. Please re-authenticate.',
      code: 'INVALID_TENANT_ID_FORMAT'
    })
  }

  try {
    // Get a connection from the pool
    const client = await pool.connect()

    try {
      // Set the session variable for this transaction
      // Using SET LOCAL ensures the variable is cleared after the transaction
      // This is critical for connection pooling security
      await client.query(
        'SET LOCAL app.current_tenant_id = $1',
        [req.user.tenant_id]
      )

      console.log('✅ TENANT CONTEXT - Session variable set', {
        tenantId: req.user.tenant_id,
        userId: req.user.id,
        method: req.method,
        path: req.path
      })

      // Store the client on the request object for the route handlers to use
      // This ensures all queries in this request use the same connection
      // with the tenant context set
      ;(req as any).dbClient = client

      // Release the client back to the pool after the response is sent
      res.on('finish', () => {
        if ((req as any).dbClient) {
          ;(req as any).dbClient.release()
          ;(req as any).dbClient = null
        }
      })

      // Release on error as well
      res.on('close', () => {
        if ((req as any).dbClient) {
          ;(req as any).dbClient.release()
          ;(req as any).dbClient = null
        }
      })

      next()
    } catch (queryError) {
      // Release client on error
      client.release()
      throw queryError
    }
  } catch (error) {
    console.error('❌ TENANT CONTEXT - Failed to set session variable', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId: req.user.tenant_id,
      userId: req.user.id,
      stack: error instanceof Error ? error.stack : undefined
    })

    return res.status(500).json({
      error: 'Database configuration error',
      details: 'Unable to establish tenant context. Please try again.',
      code: 'TENANT_CONTEXT_ERROR'
    })
  }
}

/**
 * Verifies that the tenant context is properly set.
 * Used for debugging and validation in development/testing.
 *
 * @param req - Express request object
 * @returns Current tenant ID or null if not set
 */
export const getCurrentTenantId = async (
  req: AuthRequest
): Promise<string | null> => {
  if (!req.user) {
    return null
  }

  try {
    const client = (req as any).dbClient || pool
    const result = await client.query(
      "SELECT current_setting('app.current_tenant_id', true) as tenant_id"
    )

    return result.rows[0]?.tenant_id || null
  } catch (error) {
    logger.error('❌ Failed to get current tenant ID', { error: error })
    return null
  }
}

/**
 * Development/testing helper to verify tenant isolation is working.
 * This middleware should NOT be used in production routes.
 *
 * Usage:
 * app.get('/debug/tenant-context', authenticateJWT, setTenantContext, debugTenantContext)
 */
export const debugTenantContext = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const client = (req as any).dbClient || pool

    // Get current tenant context
    const contextResult = await client.query(
      "SELECT current_setting('app.current_tenant_id', true) as tenant_id"
    )

    // Get RLS status for a sample table
    const rlsResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND rowsecurity = true
      LIMIT 5
    `)

    // Get policy information
    const policiesResult = await client.query(`
      SELECT
        tablename,
        policyname,
        cmd,
        CASE
          WHEN roles = '{fleet_webapp_user}' THEN 'fleet_webapp_user'
          ELSE roles::text
        END as roles
      FROM pg_policies
      WHERE schemaname = 'public'
      AND policyname LIKE 'tenant_isolation_%'
      LIMIT 10
    `)

    // Count accessible vehicles (test query)
    const vehiclesResult = await client.query(
      'SELECT COUNT(*) as vehicle_count FROM vehicles'
    )

    res.json({
      success: true,
      tenantContext: {
        jwtTenantId: req.user?.tenant_id,
        sessionTenantId: contextResult.rows[0]?.tenant_id,
        match: req.user?.tenant_id === contextResult.rows[0]?.tenant_id
      },
      rlsEnabled: {
        tablesWithRLS: rlsResult.rows.length,
        sampleTables: rlsResult.rows
      },
      policies: {
        count: policiesResult.rows.length,
        samplePolicies: policiesResult.rows
      },
      testQuery: {
        accessibleVehicles: vehiclesResult.rows[0]?.vehicle_count || 0,
        note: 'This should only show vehicles for the current tenant'
      },
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        tenantId: req.user?.tenant_id
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development'
        ? error instanceof Error ? error.stack : undefined
        : undefined
    })
  }
}

/**
 * Middleware to ensure tenant context is set before executing queries.
 * This is a safety check that can be added to critical routes.
 */
export const requireTenantContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const client = (req as any).dbClient || pool
    const result = await client.query(
      "SELECT current_setting('app.current_tenant_id', true) as tenant_id"
    )

    const sessionTenantId = result.rows[0]?.tenant_id

    if (!sessionTenantId) {
      console.error('❌ TENANT CONTEXT - Session variable not set', {
        userId: req.user?.id,
        jwtTenantId: req.user?.tenant_id,
        path: req.path
      })

      return res.status(500).json({
        error: 'Tenant context not initialized',
        details: 'Internal security configuration error',
        code: 'TENANT_CONTEXT_NOT_SET'
      })
    }

    // Verify JWT tenant matches session tenant (defense in depth)
    if (req.user?.tenant_id !== sessionTenantId) {
      console.error('❌ TENANT CONTEXT - Mismatch detected', {
        jwtTenantId: req.user?.tenant_id,
        sessionTenantId,
        userId: req.user?.id
      })

      return res.status(500).json({
        error: 'Tenant context mismatch',
        details: 'Security validation failed',
        code: 'TENANT_CONTEXT_MISMATCH'
      })
    }

    next()
  } catch (error) {
    logger.error('❌ TENANT CONTEXT - Validation failed', { error: error })

    return res.status(500).json({
      error: 'Tenant context validation error',
      code: 'TENANT_CONTEXT_VALIDATION_ERROR'
    })
  }
}

/**
 * Export helper function for direct use in services/DAL
 * This allows setting tenant context outside of Express middleware
 *
 * Usage in services:
 * ```typescript
 * import { setTenantContextDirect } from '../middleware/tenant-context'
import logger from '../utils/logger'
 *
 * const client = await pool.connect()
 * await setTenantContextDirect(client, tenantId)
 * // ... perform queries
 * client.release()
 * ```
 */
export const setTenantContextDirect = async (
  client: any,
  tenantId: string
): Promise<void> => {
  await client.query('SET LOCAL app.current_tenant_id = $1', [tenantId])
}

export default {
  setTenantContext,
  getCurrentTenantId,
  debugTenantContext,
  requireTenantContext,
  setTenantContextDirect
}
