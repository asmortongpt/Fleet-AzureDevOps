/**
 * Enhanced Audit Middleware with NIST 800-53 Control Mapping
 * Maps audit events to specific NIST controls for compliance reporting
 */

import crypto from 'crypto'

import { Response, NextFunction } from 'express'

import pool from '../config/database'
import logger from '../config/logger'

import { AuthRequest } from './auth'

export interface AuditOptions {
  action:
    | 'CREATE'
    | 'READ'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'EXPORT'
    | 'CALCULATE'
    | 'APPROVE'
    | 'REJECT'
    | 'BULK_CREATE'
    | 'SEARCH'
    | 'QUERY'
    | 'EXECUTE'
    | 'CERTIFY'
    | 'UPLOAD'
    | 'DOWNLOAD'
    | 'CREATE_CATEGORY'
    | 'RAG_QUERY'
    | 'REQUEST_ELEVATION'
    | 'VIEW_ELEVATION_REQUESTS'
    | 'APPROVE_ELEVATION'
    | 'REVOKE_ELEVATION'
    | 'VIEW_ACTIVE_ELEVATIONS'
    | 'CHANGE_PASSWORD'
    | 'RESET_PASSWORD'
    | 'ENABLE_MFA'
    | 'DISABLE_MFA'
    | 'GRANT_PERMISSION'
    | 'REVOKE_PERMISSION'
  resourceType: string
  resourceId?: string
  nistControls?: string[] // NIST 800-53 controls this action supports
  complianceType?: 'FEDRAMP' | 'SOC2' | 'HIPAA' | 'GDPR' | 'DOT' | 'OSHA'
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
}

// Mapping of actions to NIST 800-53 controls
const ACTION_TO_NIST_CONTROLS: Record<string, string[]> = {
  LOGIN: ['AC-2', 'IA-2', 'AU-2', 'AU-3'],
  LOGOUT: ['AC-2', 'IA-2', 'AU-2'],
  CHANGE_PASSWORD: ['IA-5', 'AU-2', 'AU-3'],
  RESET_PASSWORD: ['IA-5', 'AU-2', 'AU-3'],
  ENABLE_MFA: ['IA-2', 'IA-8', 'AU-2'],
  DISABLE_MFA: ['IA-2', 'IA-8', 'AU-2'],
  GRANT_PERMISSION: ['AC-2', 'AC-3', 'AC-6', 'AU-2'],
  REVOKE_PERMISSION: ['AC-2', 'AC-3', 'AC-6', 'AU-2'],
  CREATE: ['AC-3', 'AU-2', 'AU-3'],
  READ: ['AC-3', 'AU-2'],
  UPDATE: ['AC-3', 'AU-2', 'AU-3', 'CM-3'],
  DELETE: ['AC-3', 'AU-2', 'AU-3'],
  EXPORT: ['AC-3', 'AU-2', 'MP-3'],
  REQUEST_ELEVATION: ['AC-6', 'AU-2', 'AU-3'],
  APPROVE_ELEVATION: ['AC-6', 'AU-2', 'AU-3'],
  REVOKE_ELEVATION: ['AC-6', 'AU-2'],
  UPLOAD: ['AC-3', 'AU-2', 'SI-10'],
  DOWNLOAD: ['AC-3', 'AU-2', 'MP-3'],
  CERTIFY: ['AC-3', 'AU-2', 'CM-3']
}

export const auditLogEnhanced = (options: AuditOptions) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    const originalSend = res.json.bind(res)

    res.json = function (body: Record<string, unknown>) {
      // Log after response (don't block the request)
      setImmediate(async () => {
        try {
          const responseTime = Date.now() - startTime
          const outcome = res.statusCode < 400 ? 'success' : 'failure'
          const resourceId = options.resourceId || body?.id || req.params.id || null

          // Determine NIST controls
          const nistControls = options.nistControls || ACTION_TO_NIST_CONTROLS[options.action] || ['AU-2']

          // Determine severity
          const severity = options.severity || (res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO')

          // Create correlation ID for distributed tracing
          const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID()

          // Create hash for integrity (FedRAMP AU-9)
          const hash = crypto
            .createHash('sha256')
            .update(
              JSON.stringify({
                user_id: req.user?.id,
                action: options.action,
                resourceType: options.resourceType,
                resourceId,
                timestamp: new Date().toISOString(),
                correlationId
              })
            )
            .digest('hex')

          // Insert comprehensive audit log
          await pool.query(
            `INSERT INTO audit_logs (
              tenant_id, user_id, action, action_display_name, method, endpoint,
              resource_type, resource_id, resource_name, resource_attributes,
              result_status, result_code, result_message, severity,
              correlation_id, session_id, ip_address, user_agent,
              checksum, event_timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
            [
              req.user?.tenant_id || null,
              req.user?.id || null,
              options.action,
              getActionDisplayName(options.action),
              req.method,
              req.originalUrl,
              options.resourceType,
              resourceId,
              body?.name || null,
              JSON.stringify({
                query: req.query,
                body: shouldLogBody(options.action) ? req.body : undefined,
                nist_controls: nistControls,
                compliance_type: options.complianceType,
                response_time_ms: responseTime
              }),
              outcome,
              res.statusCode,
              res.statusCode >= 400 ? body?.error || body?.message : null,
              severity,
              correlationId,
              req.session?.id || null,
              req.ip,
              req.get('User-Agent'),
              hash,
              new Date()
            ]
          )

          // Log to compliance audit trail if compliance type specified
          if (options.complianceType) {
            await pool.query(
              `INSERT INTO compliance_audit_trail (
                tenant_id, user_id, compliance_type, event_type, event_description,
                related_resource_type, related_resource_id, metadata
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                req.user?.tenant_id || null,
                req.user?.id || null,
                options.complianceType,
                options.action,
                `${getActionDisplayName(options.action)} on ${options.resourceType}`,
                options.resourceType,
                resourceId,
                JSON.stringify({
                  nist_controls: nistControls,
                  endpoint: req.originalUrl,
                  result: outcome,
                  status_code: res.statusCode
                })
              ]
            )
          }

          // Log security incidents for suspicious activities
          if (res.statusCode === 403 || res.statusCode === 401) {
            await logSecurityIncident({
              incidentType: res.statusCode === 403 ? 'unauthorized_access' : 'authentication_failure',
              severity: 'WARNING',
              userId: req.user?.id,
              tenantId: req.user?.tenant_id,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              requestPath: req.originalUrl,
              requestMethod: req.method,
              details: {
                action: options.action,
                resourceType: options.resourceType,
                resourceId,
                statusCode: res.statusCode
              }
            })
          }
        } catch (error) {
          logger.error('Audit logging error:', { error })
          // Don't fail the request if audit logging fails
        }
      })

      return originalSend(body)
    }

    next()
  }
}

/**
 * Get human-readable action display name
 */
function getActionDisplayName(action: string): string {
  const displayNames: Record<string, string> = {
    CREATE: 'Create Resource',
    READ: 'View Resource',
    UPDATE: 'Update Resource',
    DELETE: 'Delete Resource',
    LOGIN: 'User Login',
    LOGOUT: 'User Logout',
    EXPORT: 'Export Data',
    UPLOAD: 'Upload File',
    DOWNLOAD: 'Download File',
    CHANGE_PASSWORD: 'Change Password',
    RESET_PASSWORD: 'Reset Password',
    ENABLE_MFA: 'Enable Multi-Factor Authentication',
    DISABLE_MFA: 'Disable Multi-Factor Authentication',
    GRANT_PERMISSION: 'Grant Permission',
    REVOKE_PERMISSION: 'Revoke Permission',
    REQUEST_ELEVATION: 'Request Elevated Access',
    APPROVE_ELEVATION: 'Approve Elevated Access',
    REVOKE_ELEVATION: 'Revoke Elevated Access'
  }

  return displayNames[action] || action
}

/**
 * Determine if request body should be logged
 */
function shouldLogBody(action: string): boolean {
  const noLogActions = ['READ', 'QUERY', 'SEARCH', 'DOWNLOAD', 'EXPORT']
  return !noLogActions.includes(action)
}

/**
 * Log security incident
 */
async function logSecurityIncident(incident: {
  incidentType: string
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  userId?: string | null
  tenantId?: string | null
  ipAddress?: string
  userAgent?: string
  requestPath?: string
  requestMethod?: string
  details: any
}) {
  try {
    await pool.query(
      `INSERT INTO security_incidents (
        id, incident_type, severity, user_id, tenant_id,
        ip_address, user_agent, request_path, request_method, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        crypto.randomUUID(),
        incident.incidentType,
        incident.severity,
        incident.userId || null,
        incident.tenantId || null,
        incident.ipAddress,
        incident.userAgent,
        incident.requestPath,
        incident.requestMethod,
        JSON.stringify(incident.details)
      ]
    )
  } catch (error) {
    logger.error('Error logging security incident:', error)
  }
}

/**
 * Helper to create audit log entry directly (for login/logout)
 */
export async function createAuditLogEnhanced(
  tenantId: string | null,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: Record<string, unknown> | null,
  ipAddress: string | null,
  userAgent: string | null,
  outcome: 'success' | 'failure',
  errorMessage: string | null = null,
  nistControls: string[] = ['AU-2']
) {
  const correlationId = crypto.randomUUID()
  const hash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        userId,
        action,
        resourceType,
        resourceId,
        timestamp: new Date().toISOString(),
        correlationId
      })
    )
    .digest('hex')

  await pool.query(
    `INSERT INTO audit_logs (
      tenant_id, user_id, action, action_display_name, resource_type, resource_id,
      resource_attributes, ip_address, user_agent, result_status, result_message,
      correlation_id, checksum, severity
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      tenantId,
      userId,
      action,
      getActionDisplayName(action),
      resourceType,
      resourceId,
      JSON.stringify({ ...details, nist_controls: nistControls }),
      ipAddress,
      userAgent,
      outcome,
      errorMessage,
      correlationId,
      hash,
      outcome === 'failure' ? 'WARNING' : 'INFO'
    ]
  )
}

/**
 * Query audit logs by NIST control
 */
export async function getAuditLogsByNISTControl(
  controlId: string,
  startDate: Date,
  endDate: Date,
  tenantId?: string
): Promise<any[]> {
  try {
    const query = `
      SELECT * FROM audit_logs
      WHERE event_timestamp BETWEEN $1 AND $2
      AND resource_attributes @> $3
      ${tenantId ? 'AND tenant_id = $4' : ''}
      ORDER BY event_timestamp DESC
      LIMIT 1000
    `

    const params = tenantId
      ? [startDate, endDate, JSON.stringify({ nist_controls: [controlId] }), tenantId]
      : [startDate, endDate, JSON.stringify({ nist_controls: [controlId] })]

    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    logger.error('Error querying audit logs by NIST control:', error)
    return []
  }
}

/**
 * Get audit compliance summary
 */
export async function getAuditComplianceSummary(tenantId?: string): Promise<{
  total_events: number
  events_by_control: Record<string, number>
  events_by_severity: Record<string, number>
  recent_critical_events: number
}> {
  try {
    const query = `
      SELECT
        COUNT(*) as total_events,
        jsonb_array_elements_text(resource_attributes -> 'nist_controls') as nist_control,
        severity,
        COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND event_timestamp > NOW() - INTERVAL '24 hours') as recent_critical
      FROM audit_logs
      WHERE event_timestamp > NOW() - INTERVAL '30 days'
      ${tenantId ? 'AND tenant_id = $1' : ''}
      GROUP BY nist_control, severity
    `

    const params = tenantId ? [tenantId] : []
    const result = await pool.query(query, params)

    const eventsByControl: Record<string, number> = {}
    const eventsBySeverity: Record<string, number> = {}
    let totalEvents = 0
    let recentCritical = 0

    result.rows.forEach(row => {
      const control = row.nist_control
      const severity = row.severity
      const count = parseInt(row.count) || 0

      if (control) {
        eventsByControl[control] = (eventsByControl[control] || 0) + count
      }
      if (severity) {
        eventsBySeverity[severity] = (eventsBySeverity[severity] || 0) + count
      }
      totalEvents += count
      recentCritical += parseInt(row.recent_critical) || 0
    })

    return {
      total_events: totalEvents,
      events_by_control: eventsByControl,
      events_by_severity: eventsBySeverity,
      recent_critical_events: recentCritical
    }
  } catch (error) {
    logger.error('Error getting audit compliance summary:', error)
    return {
      total_events: 0,
      events_by_control: {},
      events_by_severity: {},
      recent_critical_events: 0
    }
  }
}

export default auditLogEnhanced
