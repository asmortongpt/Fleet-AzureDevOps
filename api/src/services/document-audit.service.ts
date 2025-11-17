/**
 * Document Audit Service
 * Comprehensive audit logging for all document system operations
 */

import pool from '../config/database'
import {
  DocumentAuditLog,
  AuditLogOptions,
  EntityType,
  AuditResult
} from '../types/document-storage.types'

export class DocumentAuditService {
  /**
   * Log an audit event
   */
  async logEvent(options: AuditLogOptions): Promise<DocumentAuditLog> {
    try {
      const result = await pool.query(
        `INSERT INTO document_audit_log (
          tenant_id, document_id, folder_id, user_id, action, entity_type,
          old_values, new_values, ip_address, user_agent, session_id,
          result, error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          options.tenantId,
          options.documentId || null,
          options.folderId || null,
          options.userId || null,
          options.action,
          options.entityType,
          JSON.stringify(options.oldValues || {}),
          JSON.stringify(options.newValues || {}),
          options.ipAddress || null,
          options.userAgent || null,
          options.sessionId || null,
          options.result || AuditResult.SUCCESS,
          options.errorMessage || null,
          JSON.stringify(options.metadata || {})
        ]
      )

      return result.rows[0]
    } catch (error) {
      console.error('❌ Failed to log audit event:', error)
      // Don't throw - audit logging should not break main operations
      return {} as DocumentAuditLog
    }
  }

  /**
   * Log document action
   */
  async logDocumentAction(
    tenantId: string,
    documentId: string,
    userId: string,
    action: string,
    details?: {
      oldValues?: Record<string, any>
      newValues?: Record<string, any>
      ipAddress?: string
      userAgent?: string
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    await this.logEvent({
      tenantId,
      documentId,
      userId,
      action,
      entityType: EntityType.DOCUMENT,
      oldValues: details?.oldValues,
      newValues: details?.newValues,
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent,
      metadata: details?.metadata
    })
  }

  /**
   * Log folder action
   */
  async logFolderAction(
    tenantId: string,
    folderId: string,
    userId: string,
    action: string,
    details?: {
      oldValues?: Record<string, any>
      newValues?: Record<string, any>
      ipAddress?: string
      userAgent?: string
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    await this.logEvent({
      tenantId,
      folderId,
      userId,
      action,
      entityType: EntityType.FOLDER,
      oldValues: details?.oldValues,
      newValues: details?.newValues,
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent,
      metadata: details?.metadata
    })
  }

  /**
   * Get audit logs for a document
   */
  async getDocumentAuditLog(
    documentId: string,
    tenantId: string,
    options?: {
      limit?: number
      offset?: number
      action?: string
      userId?: string
    }
  ): Promise<{ logs: DocumentAuditLog[]; total: number }> {
    try {
      let query = `
        SELECT
          dal.*,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email
        FROM document_audit_log dal
        LEFT JOIN users u ON dal.user_id = u.id
        WHERE dal.document_id = $1 AND dal.tenant_id = $2
      `

      const params: any[] = [documentId, tenantId]
      let paramCount = 2

      if (options?.action) {
        paramCount++
        query += ` AND dal.action = $${paramCount}`
        params.push(options.action)
      }

      if (options?.userId) {
        paramCount++
        query += ` AND dal.user_id = $${paramCount}`
        params.push(options.userId)
      }

      // Get total count
      const countResult = await pool.query(
        query.replace('SELECT dal.*', 'SELECT COUNT(*) as count'),
        params
      )
      const total = parseInt(countResult.rows[0].count)

      // Add ordering and pagination
      query += ` ORDER BY dal.created_at DESC`

      if (options?.limit) {
        paramCount++
        query += ` LIMIT $${paramCount}`
        params.push(options.limit)
      }

      if (options?.offset) {
        paramCount++
        query += ` OFFSET $${paramCount}`
        params.push(options.offset)
      }

      const result = await pool.query(query, params)

      return {
        logs: result.rows,
        total
      }
    } catch (error) {
      console.error('❌ Failed to get document audit log:', error)
      throw error
    }
  }

  /**
   * Get audit logs for a folder
   */
  async getFolderAuditLog(
    folderId: string,
    tenantId: string,
    options?: {
      limit?: number
      offset?: number
      action?: string
      userId?: string
    }
  ): Promise<{ logs: DocumentAuditLog[]; total: number }> {
    try {
      let query = `
        SELECT
          dal.*,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email
        FROM document_audit_log dal
        LEFT JOIN users u ON dal.user_id = u.id
        WHERE dal.folder_id = $1 AND dal.tenant_id = $2
      `

      const params: any[] = [folderId, tenantId]
      let paramCount = 2

      if (options?.action) {
        paramCount++
        query += ` AND dal.action = $${paramCount}`
        params.push(options.action)
      }

      if (options?.userId) {
        paramCount++
        query += ` AND dal.user_id = $${paramCount}`
        params.push(options.userId)
      }

      // Get total count
      const countResult = await pool.query(
        query.replace('SELECT dal.*', 'SELECT COUNT(*) as count'),
        params
      )
      const total = parseInt(countResult.rows[0].count)

      // Add ordering and pagination
      query += ` ORDER BY dal.created_at DESC`

      if (options?.limit) {
        paramCount++
        query += ` LIMIT $${paramCount}`
        params.push(options.limit)
      }

      if (options?.offset) {
        paramCount++
        query += ` OFFSET $${paramCount}`
        params.push(options.offset)
      }

      const result = await pool.query(query, params)

      return {
        logs: result.rows,
        total
      }
    } catch (error) {
      console.error('❌ Failed to get folder audit log:', error)
      throw error
    }
  }

  /**
   * Get audit logs for a tenant (all operations)
   */
  async getTenantAuditLog(
    tenantId: string,
    options?: {
      limit?: number
      offset?: number
      action?: string
      entityType?: EntityType
      userId?: string
      dateFrom?: Date
      dateTo?: Date
    }
  ): Promise<{ logs: DocumentAuditLog[]; total: number }> {
    try {
      let query = `
        SELECT
          dal.*,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email,
          d.file_name as document_name,
          df.folder_name as folder_name
        FROM document_audit_log dal
        LEFT JOIN users u ON dal.user_id = u.id
        LEFT JOIN documents d ON dal.document_id = d.id
        LEFT JOIN document_folders df ON dal.folder_id = df.id
        WHERE dal.tenant_id = $1
      `

      const params: any[] = [tenantId]
      let paramCount = 1

      if (options?.action) {
        paramCount++
        query += ` AND dal.action = $${paramCount}`
        params.push(options.action)
      }

      if (options?.entityType) {
        paramCount++
        query += ` AND dal.entity_type = $${paramCount}`
        params.push(options.entityType)
      }

      if (options?.userId) {
        paramCount++
        query += ` AND dal.user_id = $${paramCount}`
        params.push(options.userId)
      }

      if (options?.dateFrom) {
        paramCount++
        query += ` AND dal.created_at >= $${paramCount}`
        params.push(options.dateFrom)
      }

      if (options?.dateTo) {
        paramCount++
        query += ` AND dal.created_at <= $${paramCount}`
        params.push(options.dateTo)
      }

      // Get total count
      const countResult = await pool.query(
        query.replace('SELECT dal.*', 'SELECT COUNT(*) as count'),
        params
      )
      const total = parseInt(countResult.rows[0].count)

      // Add ordering and pagination
      query += ` ORDER BY dal.created_at DESC`

      if (options?.limit) {
        paramCount++
        query += ` LIMIT $${paramCount}`
        params.push(options.limit)
      }

      if (options?.offset) {
        paramCount++
        query += ` OFFSET $${paramCount}`
        params.push(options.offset)
      }

      const result = await pool.query(query, params)

      return {
        logs: result.rows,
        total
      }
    } catch (error) {
      console.error('❌ Failed to get tenant audit log:', error)
      throw error
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    total_events: number
    by_action: Array<{ action: string; count: number }>
    by_entity_type: Array<{ entity_type: string; count: number }>
    by_user: Array<{ user_id: string; user_name: string; count: number }>
    by_result: Array<{ result: string; count: number }>
  }> {
    try {
      let whereClause = 'WHERE dal.tenant_id = $1'
      const params: any[] = [tenantId]
      let paramCount = 1

      if (dateFrom) {
        paramCount++
        whereClause += ` AND dal.created_at >= $${paramCount}`
        params.push(dateFrom)
      }

      if (dateTo) {
        paramCount++
        whereClause += ` AND dal.created_at <= $${paramCount}`
        params.push(dateTo)
      }

      const [total, byAction, byEntityType, byUser, byResult] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) as total_events FROM document_audit_log dal ${whereClause}`,
          params
        ),
        pool.query(
          `SELECT action, COUNT(*) as count
           FROM document_audit_log dal
           ${whereClause}
           GROUP BY action
           ORDER BY count DESC`,
          params
        ),
        pool.query(
          `SELECT entity_type, COUNT(*) as count
           FROM document_audit_log dal
           ${whereClause}
           GROUP BY entity_type
           ORDER BY count DESC`,
          params
        ),
        pool.query(
          `SELECT
             dal.user_id,
             u.first_name || ' ' || u.last_name as user_name,
             COUNT(*) as count
           FROM document_audit_log dal
           LEFT JOIN users u ON dal.user_id = u.id
           ${whereClause}
           GROUP BY dal.user_id, u.first_name, u.last_name
           ORDER BY count DESC
           LIMIT 10`,
          params
        ),
        pool.query(
          `SELECT result, COUNT(*) as count
           FROM document_audit_log dal
           ${whereClause}
           GROUP BY result
           ORDER BY count DESC`,
          params
        )
      ])

      return {
        total_events: parseInt(total.rows[0].total_events) || 0,
        by_action: byAction.rows,
        by_entity_type: byEntityType.rows,
        by_user: byUser.rows,
        by_result: byResult.rows
      }
    } catch (error) {
      console.error('❌ Failed to get audit statistics:', error)
      throw error
    }
  }

  /**
   * Delete old audit logs (for cleanup/archival)
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const result = await pool.query(
        `DELETE FROM document_audit_log
         WHERE created_at < $1`,
        [cutoffDate]
      )

      console.log(`✅ Deleted ${result.rowCount} old audit log entries`)
      return result.rowCount || 0
    } catch (error) {
      console.error('❌ Failed to delete old audit logs:', error)
      throw error
    }
  }
}

export default new DocumentAuditService()
