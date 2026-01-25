import crypto from 'crypto'

import { Response, NextFunction } from 'express'

import pool from '../config/database'
import logger from '../config/logger'

import { AuthRequest } from './auth'

export interface AuditOptions {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'CALCULATE' | 'APPROVE' | 'REJECT' | 'BULK_CREATE' | 'SEARCH' | 'QUERY' | 'EXECUTE' | 'CERTIFY' | 'UPLOAD' | 'DOWNLOAD' | 'CREATE_CATEGORY' | 'RAG_QUERY' | 'REQUEST_ELEVATION' | 'VIEW_ELEVATION_REQUESTS' | 'APPROVE_ELEVATION' | 'REVOKE_ELEVATION' | 'VIEW_ACTIVE_ELEVATIONS'
  resourceType: string
  resourceId?: string
}

export const auditLog = (options: AuditOptions) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.json.bind(res)

    res.json = function (body: Record<string, unknown>) {
      // Log after response (don't block the request)
      setImmediate(async () => {
        try {
          const outcome = res.statusCode < 400 ? 'success' : 'failure'
          const resourceId = options.resourceId || body?.id || req.params.id || null

          // Create hash for integrity (FedRAMP AU-9)
          const hash = crypto
            .createHash('sha256')
            .update(JSON.stringify({
              user_id: req.user?.id,
              action: options.action,
              resourceType: options.resourceType,
              resourceId,
              timestamp: new Date().toISOString()
            }))
            .digest('hex')

          await pool.query(
            `INSERT INTO audit_logs (
              tenant_id, user_id, action, entity_type, entity_id,
              metadata, ip_address, user_agent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              req.user?.tenant_id || null,
              req.user?.id || null,
              options.action,
              options.resourceType,
              typeof resourceId === 'string' && resourceId.length === 36 ? resourceId : null, // Ensure valid UUID or null
              JSON.stringify({
                method: req.method,
                path: req.path,
                query: req.query,
                body: options.action !== 'READ' ? req.body : undefined, // Don't log body for reads
                outcome,
                status: res.statusCode,
                errorMessage: res.statusCode >= 400 ? body?.error || body?.message : null,
                checksum: hash
              }),
              req.ip,
              req.get('User-Agent')
            ]
          )
        } catch (error) {
          logger.error('Audit logging error:', { error: error })
          // Don't fail the request if audit logging fails
        }
      })

      return originalSend(body)
    }

    next()
  }
}

// Helper to create audit log entry directly (for login/logout)
export async function createAuditLog(
  tenantId: string | null,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: Record<string, unknown> | null,
  ipAddress: string | null,
  userAgent: string | null,
  outcome: 'success' | 'failure',
  errorMessage: string | null = null
) {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      userId,
      action,
      resourceType,
      resourceId,
      timestamp: new Date().toISOString()
    }))
    .digest('hex')

  await pool.query(
    `INSERT INTO audit_logs (
      tenant_id, user_id, action, entity_type, entity_id,
      metadata, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      tenantId,
      userId,
      action,
      resourceType,
      typeof resourceId === 'string' && resourceId.length === 36 ? resourceId : null,
      JSON.stringify({
        ...(details || {}),
        outcome,
        errorMessage,
        checksum: hash
      }),
      ipAddress,
      userAgent
    ]
  )
}
