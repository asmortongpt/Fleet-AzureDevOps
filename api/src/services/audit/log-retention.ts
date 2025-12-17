/**
 * Log Retention Service
 * Manages audit log retention policies and compliance requirements
 *
 * Features:
 * - Configurable retention periods (7 years default)
 * - Tiered storage strategy (hot/warm/cold)
 * - Automatic archival and purging
 * - Retention policy enforcement
 * - Compliance reporting (HIPAA, SOC 2, etc.)
 * - Data disposal with verification
 */

import { Pool } from 'pg'
import { EventEmitter } from 'events'

export enum RetentionTier {
  HOT = 'HOT',      // Recent logs (0-90 days) - Fast access
  WARM = 'WARM',    // Active logs (90 days - 1 year) - Moderate access
  COLD = 'COLD'     // Archive logs (1-7 years) - Infrequent access
}

export interface RetentionPolicy {
  id: string
  name: string
  description: string
  resourceType: string
  retentionDays: number
  tier: RetentionTier
  compression: boolean
  encryption: boolean
  automaticPurge: boolean
  deleteAfterDays?: number
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RetentionEvent {
  id: string
  policyId: string
  action: 'ARCHIVE' | 'PURGE' | 'RESTORE' | 'VERIFY'
  recordsAffected: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  startedAt: Date
  completedAt?: Date
  error?: string
}

export interface ComplianceReport {
  reportId: string
  generatedAt: Date
  period: { start: Date; end: Date }
  totalRecords: number
  recordsByTier: Record<RetentionTier, number>
  policyCompliance: Array<{
    policyId: string
    policyName: string
    compliant: boolean
    explanation: string
  }>
  retentionEvents: number
  purgedRecords: number
}

/**
 * Log Retention Service
 */
export class LogRetention extends EventEmitter {
  private db: Pool
  private policies: Map<string, RetentionPolicy> = new Map()

  // Default retention policies
  private defaultPolicies: RetentionPolicy[] = [
    {
      id: 'default-security',
      name: 'Default Security Events',
      description: 'Standard 7-year retention for security-related events',
      resourceType: 'SECURITY_EVENT',
      retentionDays: 365 * 7, // 7 years
      tier: RetentionTier.WARM,
      compression: true,
      encryption: true,
      automaticPurge: true,
      deleteAfterDays: 365 * 7,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'default-audit',
      name: 'Default Audit Logs',
      description: 'Standard 7-year retention for audit logs',
      resourceType: 'AUDIT_LOG',
      retentionDays: 365 * 7,
      tier: RetentionTier.WARM,
      compression: true,
      encryption: true,
      automaticPurge: true,
      deleteAfterDays: 365 * 7,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'default-access',
      name: 'Default Access Logs',
      description: 'Standard 90-day retention for access logs',
      resourceType: 'ACCESS_LOG',
      retentionDays: 90,
      tier: RetentionTier.HOT,
      compression: false,
      encryption: true,
      automaticPurge: true,
      deleteAfterDays: 90,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  constructor(db: Pool) {
    super()
    this.db = db
    this.initializePolicies()
  }

  /**
   * Initialize retention policies
   */
  private initializePolicies(): void {
    this.defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy)
    })
  }

  /**
   * Create retention policy
   */
  async createPolicy(policy: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<RetentionPolicy> {
    const id = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const newPolicy: RetentionPolicy = {
      ...policy,
      id,
      createdAt: now,
      updatedAt: now
    }

    try {
      await this.db.query(
        `INSERT INTO retention_policies
         (id, name, description, resource_type, retention_days, tier,
          compression, encryption, automatic_purge, delete_after_days, enabled, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          newPolicy.id,
          newPolicy.name,
          newPolicy.description,
          newPolicy.resourceType,
          newPolicy.retentionDays,
          newPolicy.tier,
          newPolicy.compression,
          newPolicy.encryption,
          newPolicy.automaticPurge,
          newPolicy.deleteAfterDays || null,
          newPolicy.enabled,
          newPolicy.createdAt,
          newPolicy.updatedAt
        ]
      )

      this.policies.set(id, newPolicy)
      this.emit('policy:created', newPolicy)

      return newPolicy
    } catch (error) {
      console.error('Failed to create retention policy:', error)
      throw new Error('Policy creation failed')
    }
  }

  /**
   * Get retention policy
   */
  getPolicy(policyId: string): RetentionPolicy | undefined {
    return this.policies.get(policyId)
  }

  /**
   * Get all policies
   */
  getAllPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values())
  }

  /**
   * Get policy by resource type
   */
  getPoliciesByResourceType(resourceType: string): RetentionPolicy[] {
    return Array.from(this.policies.values()).filter(p => p.resourceType === resourceType && p.enabled)
  }

  /**
   * Archive logs to cold storage
   */
  async archiveLogs(policyId: string, beforeDate: Date): Promise<RetentionEvent> {
    const policy = this.getPolicy(policyId)
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`)
    }

    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const event: RetentionEvent = {
      id: eventId,
      policyId,
      action: 'ARCHIVE',
      recordsAffected: 0,
      status: 'IN_PROGRESS',
      startedAt: new Date()
    }

    try {
      // Get records to archive
      const result = await this.db.query(
        `SELECT COUNT(*) as count FROM audit_logs
         WHERE resource_type = $1 AND timestamp < $2 AND tier != $3`,
        [policy.resourceType, beforeDate, RetentionTier.COLD]
      )

      const recordCount = parseInt(result.rows[0].count)

      if (recordCount > 0) {
        // Update tier to COLD
        await this.db.query(
          `UPDATE audit_logs
           SET tier = $1, archived_at = NOW()
           WHERE resource_type = $2 AND timestamp < $3 AND tier != $4`,
          [RetentionTier.COLD, policy.resourceType, beforeDate, RetentionTier.COLD]
        )

        event.recordsAffected = recordCount
      }

      event.status = 'COMPLETED'
      event.completedAt = new Date()

      // Log archival event
      await this.logRetentionEvent(event)
      this.emit('logs:archived', event)

      return event
    } catch (error) {
      console.error('Failed to archive logs:', error)
      event.status = 'FAILED'
      event.error = error instanceof Error ? error.message : 'Unknown error'
      await this.logRetentionEvent(event)
      throw new Error('Log archival failed')
    }
  }

  /**
   * Purge expired logs
   */
  async purgeLogs(policyId: string): Promise<RetentionEvent> {
    const policy = this.getPolicy(policyId)
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`)
    }

    if (!policy.automaticPurge || !policy.deleteAfterDays) {
      throw new Error('Policy does not allow automatic purging')
    }

    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const event: RetentionEvent = {
      id: eventId,
      policyId,
      action: 'PURGE',
      recordsAffected: 0,
      status: 'IN_PROGRESS',
      startedAt: new Date()
    }

    try {
      const cutoffDate = new Date(Date.now() - policy.deleteAfterDays * 24 * 60 * 60 * 1000)

      // Get records to purge
      const result = await this.db.query(
        `SELECT COUNT(*) as count FROM audit_logs
         WHERE resource_type = $1 AND timestamp < $2`,
        [policy.resourceType, cutoffDate]
      )

      const recordCount = parseInt(result.rows[0].count)

      if (recordCount > 0) {
        // Delete records
        await this.db.query(
          `DELETE FROM audit_logs
           WHERE resource_type = $1 AND timestamp < $2`,
          [policy.resourceType, cutoffDate]
        )

        event.recordsAffected = recordCount
      }

      event.status = 'COMPLETED'
      event.completedAt = new Date()

      // Log purge event
      await this.logRetentionEvent(event)
      this.emit('logs:purged', event)

      return event
    } catch (error) {
      console.error('Failed to purge logs:', error)
      event.status = 'FAILED'
      event.error = error instanceof Error ? error.message : 'Unknown error'
      await this.logRetentionEvent(event)
      throw new Error('Log purge failed')
    }
  }

  /**
   * Get retention statistics
   */
  async getRetentionStats(): Promise<{
    totalRecords: number
    recordsByTier: Record<RetentionTier, number>
    recordsByAge: {
      lessThan90Days: number
      days90To1Year: number
      days1To7Years: number
      moreThan7Years: number
    }
    estimatedStorageSize: number
  }> {
    try {
      // Total records by tier
      const tierResult = await this.db.query(
        `SELECT tier, COUNT(*) as count FROM audit_logs GROUP BY tier`
      )

      const recordsByTier: Record<RetentionTier, number> = {
        [RetentionTier.HOT]: 0,
        [RetentionTier.WARM]: 0,
        [RetentionTier.COLD]: 0
      }

      let totalRecords = 0
      tierResult.rows.forEach(row => {
        recordsByTier[row.tier] = parseInt(row.count)
        totalRecords += parseInt(row.count)
      })

      // Records by age
      const now = new Date()
      const ageResult = await this.db.query(
        `SELECT
           COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '90 days') as less_than_90,
           COUNT(*) FILTER (WHERE timestamp BETWEEN NOW() - INTERVAL '1 year' AND NOW() - INTERVAL '90 days') as days_90_to_1_year,
           COUNT(*) FILTER (WHERE timestamp BETWEEN NOW() - INTERVAL '7 years' AND NOW() - INTERVAL '1 year') as days_1_to_7_years,
           COUNT(*) FILTER (WHERE timestamp < NOW() - INTERVAL '7 years') as more_than_7_years
         FROM audit_logs`
      )

      const ageRow = ageResult.rows[0]

      return {
        totalRecords,
        recordsByTier,
        recordsByAge: {
          lessThan90Days: parseInt(ageRow.less_than_90),
          days90To1Year: parseInt(ageRow.days_90_to_1_year),
          days1To7Years: parseInt(ageRow.days_1_to_7_years),
          moreThan7Years: parseInt(ageRow.more_than_7_years)
        },
        estimatedStorageSize: totalRecords * 2048 // Approximate 2KB per record
      }
    } catch (error) {
      console.error('Failed to get retention statistics:', error)
      throw new Error('Statistics retrieval failed')
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    try {
      const stats = await this.getRetentionStats()
      const policies = this.getAllPolicies()

      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const policyCompliance = await Promise.all(
        policies.map(async (policy) => {
          const result = await this.db.query(
            `SELECT COUNT(*) as count FROM audit_logs
             WHERE resource_type = $1 AND timestamp > NOW() - INTERVAL '${policy.retentionDays} days'`,
            [policy.resourceType]
          )

          const recordCount = parseInt(result.rows[0].count)
          const compliant = recordCount > 0 || !policy.enabled

          return {
            policyId: policy.id,
            policyName: policy.name,
            compliant,
            explanation: compliant ? 'Policy is compliant' : 'Insufficient records for compliance'
          }
        })
      )

      const eventsResult = await this.db.query(
        `SELECT COUNT(*) as count FROM retention_events
         WHERE started_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      )

      const purgedResult = await this.db.query(
        `SELECT COUNT(*) as count FROM retention_events
         WHERE action = 'PURGE' AND status = 'COMPLETED'
         AND started_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      )

      return {
        reportId,
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        totalRecords: stats.totalRecords,
        recordsByTier: stats.recordsByTier,
        policyCompliance,
        retentionEvents: parseInt(eventsResult.rows[0].count),
        purgedRecords: parseInt(purgedResult.rows[0].count)
      }
    } catch (error) {
      console.error('Failed to generate compliance report:', error)
      throw new Error('Compliance report generation failed')
    }
  }

  /**
   * Private helper methods
   */

  private async logRetentionEvent(event: RetentionEvent): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO retention_events
         (id, policy_id, action, records_affected, status, started_at, completed_at, error)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          event.id,
          event.policyId,
          event.action,
          event.recordsAffected,
          event.status,
          event.startedAt,
          event.completedAt || null,
          event.error || null
        ]
      )
    } catch (error) {
      console.error('Failed to log retention event:', error)
    }
  }
}

export default LogRetention
