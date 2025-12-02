import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import pool from '../config/database'
import crypto from 'crypto'
import logger from '../utils/logger'

export interface AuditOptions {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'CALCULATE' | 'APPROVE' | 'REJECT' | 'BULK_CREATE' | 'SEARCH' | 'QUERY' | 'EXECUTE' | 'CERTIFY' | 'UPLOAD' | 'DOWNLOAD' | 'CREATE_CATEGORY' | 'RAG_QUERY' | 'REQUEST_ELEVATION' | 'VIEW_ELEVATION_REQUESTS' | 'APPROVE_ELEVATION' | 'REVOKE_ELEVATION' | 'VIEW_ACTIVE_ELEVATIONS'
  resourceType: string
  resourceId?: string
}

export const auditLog = (options: AuditOptions) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.json.bind(res)

    res.json = function (body: any) {
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
              tenant_id, user_id, action, resource_type, resource_id,
              details, ip_address, user_agent, outcome, error_message, hash
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              req.user?.tenant_id || null,
              req.user?.id || null,
              options.action,
              options.resourceType,
              resourceId,
              JSON.stringify({
                method: req.method,
                path: req.path,
                query: req.query,
                body: options.action !== 'READ' ? req.body : undefined // Don't log body for reads
              }),
              req.ip,
              req.get('User-Agent'),
              outcome,
              res.statusCode >= 400 ? body?.error || body?.message : null,
              hash
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
  details: any,
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
      tenant_id, user_id, action, resource_type, resource_id,
      details, ip_address, user_agent, outcome, error_message, hash
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      tenantId,
      userId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(details),
      ipAddress,
      userAgent,
      outcome,
      errorMessage,
      hash
    ]
  )
}
