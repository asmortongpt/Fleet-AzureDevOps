/**
 * Audit Reports Service
 * Generates comprehensive audit reports and analysis
 *
 * Features:
 * - Executive summary reports
 * - Detailed activity analysis
 * - Anomaly detection
 * - Compliance reports (SOC 2, HIPAA, etc.)
 * - Timeline exports
 * - Alert generation
 */

import { Pool } from 'pg'
import { AuditLogger, AuditAction, AuditSeverity } from './audit-logger'

export enum ReportType {
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
  ACTIVITY_REPORT = 'ACTIVITY_REPORT',
  COMPLIANCE_REPORT = 'COMPLIANCE_REPORT',
  SECURITY_INCIDENT = 'SECURITY_INCIDENT',
  USER_ACTIVITY = 'USER_ACTIVITY',
  RESOURCE_ACCESS = 'RESOURCE_ACCESS',
  ANOMALY_REPORT = 'ANOMALY_REPORT'
}

export interface AuditReport {
  id: string
  type: ReportType
  title: string
  description: string
  generatedAt: Date
  period: { start: Date; end: Date }
  content: Record<string, any>
  metadata: {
    totalEvents: number
    uniqueUsers: number
    severityDistribution: Record<string, number>
    actionDistribution: Record<string, number>
  }
}

export interface SecurityAlert {
  id: string
  timestamp: Date
  severity: AuditSeverity
  type: string
  description: string
  affectedUsers: string[]
  affectedResources: Array<{ type: string; id: string }>
  recommendedActions: string[]
}

export interface AnomalyDetectionResult {
  anomalies: Array<{
    type: string
    severity: AuditSeverity
    description: string
    evidence: string[]
    confidence: number
  }>
  summary: string
}

/**
 * Audit Reports Service
 */
export class AuditReports {
  private db: Pool
  private auditLogger: AuditLogger

  constructor(db: Pool, auditLogger: AuditLogger) {
    this.db = db
    this.auditLogger = auditLogger
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(startDate: Date, endDate: Date): Promise<AuditReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const stats = await this.auditLogger.getAuditStatistics(startDate, endDate)

      // Calculate trend
      const priorStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))
      const priorStats = await this.auditLogger.getAuditStatistics(priorStart, startDate)

      const eventTrend = {
        current: stats.totalEvents,
        previous: priorStats.totalEvents,
        percentChange: priorStats.totalEvents > 0
          ? ((stats.totalEvents - priorStats.totalEvents) / priorStats.totalEvents) * 100
          : 0
      }

      const failureTrend = {
        current: stats.failureRate,
        previous: priorStats.failureRate,
        change: stats.failureRate - priorStats.failureRate
      }

      const report: AuditReport = {
        id: reportId,
        type: ReportType.EXECUTIVE_SUMMARY,
        title: 'Audit Activity - Executive Summary',
        description: `Executive summary of audit activities from ${startDate.toISOString()} to ${endDate.toISOString()}`,
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        content: {
          summary: {
            totalEvents: stats.totalEvents,
            uniqueUsers: stats.uniqueUsers,
            failureRate: (stats.failureRate * 100).toFixed(2) + '%',
            topEvents: Object.entries(stats.eventsByAction)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([action, count]) => ({ action, count }))
          },
          trends: {
            eventTrend,
            failureTrend
          },
          riskAssessment: {
            overallRisk: this.calculateRiskLevel(stats),
            criticalEvents: Object.entries(stats.eventsBySeverity)
              .filter(([severity]) => severity === AuditSeverity.CRITICAL)
              .reduce((sum, [, count]) => sum + count, 0),
            recommendations: this.generateRecommendations(stats)
          },
          topResources: stats.topResources.slice(0, 5)
        },
        metadata: {
          totalEvents: stats.totalEvents,
          uniqueUsers: stats.uniqueUsers,
          severityDistribution: stats.eventsBySeverity,
          actionDistribution: stats.eventsByAction
        }
      }

      await this.saveReport(report)
      return report
    } catch (error) {
      console.error('Failed to generate executive summary:', error)
      throw new Error('Report generation failed')
    }
  }

  /**
   * Generate user activity report
   */
  async generateUserActivityReport(userId: string, startDate: Date, endDate: Date): Promise<AuditReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const events = await this.auditLogger.getAuditLogs({
        userId,
        startDate,
        endDate,
        limit: 10000
      })

      const actionCounts: Record<string, number> = {}
      const resourceAccess: Record<string, number> = {}
      let successCount = 0
      let failureCount = 0

      events.forEach(event => {
        actionCounts[event.action] = (actionCounts[event.action] || 0) + 1
        if (event.resource.type && event.resource.id) {
          const key = `${event.resource.type}:${event.resource.id}`
          resourceAccess[key] = (resourceAccess[key] || 0) + 1
        }
        if (event.result.status === 'success') {
          successCount++
        } else {
          failureCount++
        }
      })

      const report: AuditReport = {
        id: reportId,
        type: ReportType.USER_ACTIVITY,
        title: `User Activity Report - ${userId}`,
        description: `Activity report for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        content: {
          userId,
          totalEvents: events.length,
          successRate: events.length > 0 ? (successCount / events.length * 100).toFixed(2) + '%' : '0%',
          actionSummary: actionCounts,
          resourceAccess: Object.entries(resourceAccess)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .reduce((acc, [key, count]) => {
              acc[key] = count
              return acc
            }, {} as Record<string, number>),
          timeline: {
            firstActivity: events.length > 0 ? events[events.length - 1].timestamp : null,
            lastActivity: events.length > 0 ? events[0].timestamp : null,
            dailyActivity: this.calculateDailyActivity(events)
          },
          riskIndicators: this.analyzeUserRisk(userId, events)
        },
        metadata: {
          totalEvents: events.length,
          uniqueUsers: 1,
          severityDistribution: this.groupBySeverity(events),
          actionDistribution: actionCounts
        }
      }

      await this.saveReport(report)
      return report
    } catch (error) {
      console.error('Failed to generate user activity report:', error)
      throw new Error('User activity report generation failed')
    }
  }

  /**
   * Generate resource access report
   */
  async generateResourceAccessReport(
    resourceType: string,
    resourceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AuditReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const events = await this.auditLogger.getAuditLogs({
        resourceType,
        resourceId,
        startDate,
        endDate,
        limit: 10000
      })

      const accessByUser: Record<string, number> = {}
      const accessByAction: Record<string, number> = {}
      const failedAccesses = events.filter(e => e.result.status === 'failure')

      events.forEach(event => {
        accessByUser[event.userId] = (accessByUser[event.userId] || 0) + 1
        accessByAction[event.action] = (accessByAction[event.action] || 0) + 1
      })

      const report: AuditReport = {
        id: reportId,
        type: ReportType.RESOURCE_ACCESS,
        title: `Resource Access Report - ${resourceType}/${resourceId}`,
        description: `Access audit for ${resourceType} ${resourceId}`,
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        content: {
          resource: { type: resourceType, id: resourceId },
          totalAccess: events.length,
          uniqueUsers: Object.keys(accessByUser).length,
          failedAccesses: failedAccesses.length,
          failureRate: events.length > 0 ? (failedAccesses.length / events.length * 100).toFixed(2) + '%' : '0%',
          accessByUser: Object.entries(accessByUser)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .reduce((acc, [user, count]) => {
              acc[user] = count
              return acc
            }, {} as Record<string, number>),
          accessByAction: accessByAction,
          failedAccessAttempts: failedAccesses.map(e => ({
            timestamp: e.timestamp,
            user: e.userId,
            action: e.action,
            reason: e.result.message
          })).slice(0, 10)
        },
        metadata: {
          totalEvents: events.length,
          uniqueUsers: Object.keys(accessByUser).length,
          severityDistribution: this.groupBySeverity(events),
          actionDistribution: accessByAction
        }
      }

      await this.saveReport(report)
      return report
    } catch (error) {
      console.error('Failed to generate resource access report:', error)
      throw new Error('Resource access report generation failed')
    }
  }

  /**
   * Detect anomalies in audit logs
   */
  async detectAnomalies(startDate: Date, endDate: Date): Promise<AnomalyDetectionResult> {
    try {
      const events = await this.auditLogger.getAuditLogs({
        startDate,
        endDate,
        limit: 10000
      })

      const anomalies = []

      // Detect unusual access patterns
      const accessPatterns = this.analyzeAccessPatterns(events)
      if (accessPatterns.anomalies.length > 0) {
        anomalies.push(...accessPatterns.anomalies)
      }

      // Detect failed login attempts
      const failedLogins = events.filter(
        e => e.action === AuditAction.AUTH_FAILURE &&
             e.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
      )
      if (failedLogins.length > 10) {
        anomalies.push({
          type: 'HIGH_FAILED_LOGIN_RATE',
          severity: AuditSeverity.WARNING,
          description: `${failedLogins.length} failed login attempts in last 24 hours`,
          evidence: failedLogins.slice(0, 5).map(e => `${e.timestamp}: ${e.userId}`),
          confidence: 0.95
        })
      }

      // Detect privilege escalation
      const roleChanges = events.filter(e => e.action === AuditAction.ROLE_ASSIGNED)
      if (roleChanges.length > 5) {
        anomalies.push({
          type: 'UNUSUAL_PRIVILEGE_CHANGES',
          severity: AuditSeverity.WARNING,
          description: `${roleChanges.length} role assignments detected`,
          evidence: roleChanges.slice(0, 5).map(e => `${e.timestamp}: ${e.userId}`),
          confidence: 0.8
        })
      }

      const summary = this.summarizeAnomalies(anomalies)

      return {
        anomalies: anomalies.sort((a, b) => b.confidence - a.confidence),
        summary
      }
    } catch (error) {
      console.error('Failed to detect anomalies:', error)
      throw new Error('Anomaly detection failed')
    }
  }

  /**
   * Generate security alerts
   */
  async generateSecurityAlerts(startDate: Date, endDate: Date): Promise<SecurityAlert[]> {
    try {
      const events = await this.auditLogger.getAuditLogs({
        startDate,
        endDate,
        limit: 10000
      })

      const alerts: SecurityAlert[] = []
      const criticalEvents = events.filter(e => e.severity === AuditSeverity.CRITICAL)

      criticalEvents.forEach(event => {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: event.timestamp,
          severity: event.severity,
          type: event.action,
          description: event.result.message,
          affectedUsers: [event.userId],
          affectedResources: [{ type: event.resource.type, id: event.resource.id }],
          recommendedActions: this.getRecommendedActions(event.action)
        })
      })

      return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    } catch (error) {
      console.error('Failed to generate security alerts:', error)
      throw new Error('Security alert generation failed')
    }
  }

  /**
   * Private helper methods
   */

  private calculateRiskLevel(stats: any): string {
    const failureRate = stats.failureRate
    const criticalCount = stats.eventsBySeverity[AuditSeverity.CRITICAL] || 0

    if (criticalCount > 0 || failureRate > 0.1) {
      return 'HIGH'
    } else if (failureRate > 0.05) {
      return 'MEDIUM'
    }
    return 'LOW'
  }

  private generateRecommendations(stats: any): string[] {
    const recommendations: string[] = []

    if (stats.failureRate > 0.1) {
      recommendations.push('Review and address high failure rate in access control')
    }

    if ((stats.eventsBySeverity[AuditSeverity.CRITICAL] || 0) > 0) {
      recommendations.push('Investigate critical severity events immediately')
    }

    if (stats.totalEvents === 0) {
      recommendations.push('Enable comprehensive audit logging')
    }

    if (!recommendations.length) {
      recommendations.push('Continue monitoring with current policies')
    }

    return recommendations
  }

  private calculateDailyActivity(events: any[]): Record<string, number> {
    const daily: Record<string, number> = {}

    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      daily[date] = (daily[date] || 0) + 1
    })

    return daily
  }

  private analyzeUserRisk(userId: string, events: any[]): any {
    const failureRate = events.filter(e => e.result.status === 'failure').length / events.length
    const hasAuthFailures = events.some(e => e.action === AuditAction.AUTH_FAILURE)
    const hasDataExports = events.some(e => e.action === AuditAction.DATA_EXPORT)

    return {
      riskScore: failureRate > 0.3 ? 'HIGH' : failureRate > 0.1 ? 'MEDIUM' : 'LOW',
      factors: {
        authFailures: hasAuthFailures,
        dataExports: hasDataExports,
        unusualTime: false
      }
    }
  }

  private groupBySeverity(events: any[]): Record<string, number> {
    const grouped: Record<string, number> = {}

    events.forEach(event => {
      grouped[event.severity] = (grouped[event.severity] || 0) + 1
    })

    return grouped
  }

  private analyzeAccessPatterns(events: any[]): any {
    const anomalies = []
    const accessByUser = new Map<string, any[]>()

    events.forEach(event => {
      if (!accessByUser.has(event.userId)) {
        accessByUser.set(event.userId, [])
      }
      accessByUser.get(event.userId)!.push(event)
    })

    // Detect unusual access frequency
    accessByUser.forEach((userEvents, userId) => {
      if (userEvents.length > 1000) {
        anomalies.push({
          type: 'EXCESSIVE_API_CALLS',
          severity: AuditSeverity.WARNING,
          description: `User ${userId} made ${userEvents.length} API calls`,
          evidence: userEvents.slice(0, 5).map(e => e.timestamp.toISOString()),
          confidence: 0.85
        })
      }
    })

    return { anomalies }
  }

  private summarizeAnomalies(anomalies: any[]): string {
    if (anomalies.length === 0) {
      return 'No anomalies detected'
    }

    const critical = anomalies.filter(a => a.severity === AuditSeverity.CRITICAL)
    const warnings = anomalies.filter(a => a.severity === AuditSeverity.WARNING)

    return `Detected ${critical.length} critical and ${warnings.length} warning anomalies`
  }

  private getRecommendedActions(action: AuditAction): string[] {
    const actionMap: Record<AuditAction, string[]> = {
      [AuditAction.AUTH_FAILURE]: ['Review account lockout policies', 'Check for brute force attempts'],
      [AuditAction.PERMISSION_DENIED]: ['Verify access control policies', 'Review role assignments'],
      [AuditAction.SESSION_REVOKED]: ['Check for suspicious activity', 'Review session logs'],
      [AuditAction.DATA_DELETE]: ['Verify deletion was authorized', 'Check data retention policies'],
      [AuditAction.ROLE_ASSIGNED]: ['Verify role assignment was authorized', 'Check for privilege escalation'],
      [AuditAction.PASSWORD_CHANGED]: ['Verify password change request', 'Check for compromised accounts'],
      [AuditAction.MFA_DISABLED]: ['Verify MFA disable request', 'Require re-authentication'],
      [AuditAction.ENCRYPTION_KEY_ROTATED]: ['Verify key rotation was scheduled', 'Check for unauthorized access'],
      [AuditAction.DATA_EXPORT]: ['Verify export was authorized', 'Check data classification'],
      // Default actions for others
      [AuditAction.USER_LOGIN]: ['Monitor login activity'],
      [AuditAction.USER_LOGOUT]: ['No action required'],
      [AuditAction.SESSION_CREATED]: ['Monitor session activity'],
      [AuditAction.DATA_CREATE]: ['Verify creation was authorized'],
      [AuditAction.DATA_READ]: ['No action required'],
      [AuditAction.DATA_UPDATE]: ['Verify update was authorized'],
      [AuditAction.MFA_ENABLED]: ['No action required'],
      [AuditAction.SECURITY_POLICY_UPDATED]: ['Review policy changes'],
      [AuditAction.SYSTEM_CONFIG_CHANGED]: ['Review configuration changes'],
      [AuditAction.PERMISSION_MODIFIED]: ['Review permission changes'],
      [AuditAction.AUDIT_LOG_ACCESSED]: ['Monitor audit log access'],
      [AuditAction.COMPLIANCE_CHECK]: ['No action required'],
      [AuditAction.REPORT_GENERATED]: ['No action required'],
      [AuditAction.DATA_RETENTION_ENFORCED]: ['No action required']
    }

    return actionMap[action] || ['Monitor for suspicious activity']
  }

  private async saveReport(report: AuditReport): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO audit_reports
         (id, type, title, description, generated_at, period_start, period_end, content)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          report.id,
          report.type,
          report.title,
          report.description,
          report.generatedAt,
          report.period.start,
          report.period.end,
          JSON.stringify(report.content)
        ]
      )
    } catch (error) {
      console.error('Failed to save report:', error)
    }
  }
}

export default AuditReports
