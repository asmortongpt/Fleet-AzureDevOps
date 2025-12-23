/**
 * Tenant Validator Utility
 * CRITICAL SECURITY: Prevents cross-tenant reference attacks (IDOR/BOLA)
 *
 * This validator ensures that all foreign key references in request bodies
 * (vehicle_id, driver_id, facility_id, etc.) belong to the authenticated user's tenant.
 *
 * Attack Vector Prevention:
 * - Prevents users from submitting tenant_id directly in request body
 * - Validates all UUID foreign keys reference entities in the same tenant
 * - Blocks cross-tenant data exfiltration attempts
 *
 * Example Attack Scenario (PREVENTED):
 * 1. Attacker authenticates as Tenant A
 * 2. Attacker creates work order with vehicle_id from Tenant B
 * 3. Without validation: Work order created, linking Tenant A to Tenant B's vehicle
 * 4. With validation: Request rejected, attack blocked
 *
 * Compliance:
 * - FedRAMP AC-3 (Access Enforcement)
 * - SOC 2 CC6.3 (Logical and Physical Access Controls)
 * - OWASP Top 10: A01 Broken Access Control (IDOR/BOLA)
 * - CWE-639: Authorization Bypass Through User-Controlled Key
 */

import { Response, NextFunction } from 'express'
import { PoolClient } from 'pg'

import { AuthRequest } from '../middleware/auth'
import logger from '../utils/logger'

/**
 * Configuration for tenant validation
 */
export interface TenantValidationConfig {
  /**
   * Table to validate the reference against
   */
  table: string

  /**
   * Column name in the table (usually 'id')
   */
  column: string

  /**
   * Field name in the request body
   */
  field: string

  /**
   * Whether this field is required
   */
  required: boolean
}

/**
 * Validates that a UUID reference exists and belongs to the current tenant
 *
 * IMPORTANT: This function relies on RLS being enabled and tenant context being set.
 * If the row doesn't exist OR belongs to a different tenant, RLS will filter it out.
 *
 * @param client - Database client with tenant context set (from req.dbClient)
 * @param table - Table name to check
 * @param id - UUID to validate
 * @param tenantId - Expected tenant ID (for logging only, RLS enforces this)
 * @returns true if valid and accessible, false otherwise
 */
export async function validateTenantReference(
  client: PoolClient,
  table: string,
  id: string,
  tenantId: string
): Promise<boolean> {
  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    logger.warn('Invalid UUID format', { table, id })
    return false
  }

  try {
    // Query relies on RLS - if row isn't returned, it's either:
    // 1. Doesn't exist
    // 2. Belongs to a different tenant (filtered by RLS)
    // No need for WHERE tenant_id = ... because RLS handles it
    const result = await client.query(
      `SELECT id FROM ${table} WHERE id = $1 LIMIT 1`,
      [id]
    )

    if (result.rows.length === 0) {
      logger.warn('Reference validation failed - not found or wrong tenant', {
        table,
        id,
        tenantId
      })
      return false
    }

    logger.debug('Reference validated successfully', { table, id })
    return true
  } catch (error) {
    logger.error('Reference validation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      table,
      id
    })
    return false
  }
}

/**
 * Middleware factory to validate tenant references in request body
 *
 * Usage:
 * ```typescript
 * router.post('/work-orders',
 *   authenticateJWT,
 *   setTenantContext,
 *   validateTenantReferences([
 *     { table: 'vehicles', column: 'id', field: 'vehicle_id', required: true },
 *     { table: 'facilities', column: 'id', field: 'facility_id', required: false }
 *   ]),
 *   async (req, res) => { ... }
 * )
 * ```
 */
export function validateTenantReferences(configs: TenantValidationConfig[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Ensure tenant context is set
    const client = (req as any).dbClient
    if (!client) {
      logger.error('validateTenantReferences called without tenant context')
      res.status(500).json({
        error: 'Internal server error',
        details: 'Tenant context not initialized',
        code: 'MISSING_TENANT_CONTEXT'
      })
      return
    }

    if (!req.user?.tenant_id) {
      logger.error('validateTenantReferences called without authenticated user')
      res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_AUTH'
      })
      return
    }

    // Check each configured reference
    for (const config of configs) {
      const value = req.body[config.field]

      // Skip if not required and not provided
      if (!config.required && !value) {
        continue
      }

      // Fail if required and not provided
      if (config.required && !value) {
        logger.warn('Required reference missing', {
          field: config.field,
          userId: req.user.id,
          tenantId: req.user.tenant_id
        })
        res.status(400).json({
          error: 'Validation failed',
          details: `${config.field} is required`,
          code: 'MISSING_REQUIRED_REFERENCE'
        })
        return
      }

      // Validate the reference
      if (value) {
        const isValid = await validateTenantReference(
          client,
          config.table,
          value,
          req.user.tenant_id
        )

        if (!isValid) {
          logger.warn('Cross-tenant reference attempt blocked', {
            field: config.field,
            value,
            table: config.table,
            userId: req.user.id,
            tenantId: req.user.tenant_id,
            ip: req.ip,
            userAgent: req.get('user-agent')
          })

          res.status(403).json({
            error: 'Invalid reference',
            details: `${config.field} not found or access denied`,
            code: 'INVALID_TENANT_REFERENCE'
          })
          return
        }
      }
    }

    // All validations passed
    next()
  }
}

/**
 * Blocks tenant_id from being set in request body
 * The tenant_id MUST come from the authenticated user's JWT token, never from user input
 */
export function preventTenantIdOverride(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Check if request body contains tenant_id
  if (req.body && 'tenant_id' in req.body) {
    logger.warn('Attempted tenant_id override blocked', {
      userId: req.user?.id,
      authenticatedTenantId: req.user?.tenant_id,
      attemptedTenantId: req.body.tenant_id,
      ip: req.ip,
      path: req.path,
      method: req.method
    })

    res.status(400).json({
      error: 'Validation failed',
      details: 'tenant_id cannot be specified in request body',
      code: 'TENANT_ID_OVERRIDE_BLOCKED'
    })
    return
  }

  // Automatically set tenant_id from authenticated user
  if (req.user?.tenant_id) {
    req.body.tenant_id = req.user.tenant_id
  }

  next()
}

/**
 * Helper to inject tenant_id into request body from authenticated user
 * Use this before database inserts to ensure tenant_id is always set correctly
 */
export function injectTenantId(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.tenant_id) {
    logger.error('injectTenantId called without authenticated user')
    res.status(401).json({
      error: 'Authentication required',
      code: 'MISSING_AUTH'
    })
    return
  }

  // Prevent override if user tried to set it
  if (req.body && 'tenant_id' in req.body && req.body.tenant_id !== req.user.tenant_id) {
    logger.warn('Tenant ID override attempt blocked', {
      userId: req.user.id,
      authenticatedTenantId: req.user.tenant_id,
      attemptedTenantId: req.body.tenant_id
    })

    res.status(403).json({
      error: 'Access denied',
      details: 'Cannot override tenant ID',
      code: 'TENANT_ID_MISMATCH'
    })
    return
  }

  // Set tenant_id from authenticated user
  req.body.tenant_id = req.user.tenant_id
  next()
}

export default {
  validateTenantReference,
  validateTenantReferences,
  preventTenantIdOverride,
  injectTenantId
}
