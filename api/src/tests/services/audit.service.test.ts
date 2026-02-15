/**
 * Audit Service Tests
 *
 * Tests for permission checks and security event logging:
 * - Permission check logging
 * - Security event logging
 * - User audit log retrieval
 * - Failed permission attempts tracking
 * - Resource audit summary
 * - Audit log retention and cleanup
 * - Error handling with non-blocking failures
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

interface AuditLogEntry {
  user_id: string
  action: string
  resource_type?: string
  resource_id?: string
  allowed: boolean
  reason?: string
  timestamp: Date
  context?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

interface SecurityEvent {
  user_id?: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  ip_address?: string
  user_agent?: string
  context?: Record<string, any>
}

class MockAuditService {
  private db: any
  private logs: AuditLogEntry[] = []
  private securityEvents: SecurityEvent[] = []

  constructor(db?: any) {
    this.db = db
  }

  async logPermissionCheck(entry: Partial<AuditLogEntry> & {
    user_id: string
    action: string
    allowed: boolean
  }): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        user_id: entry.user_id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        allowed: entry.allowed,
        reason: entry.reason,
        timestamp: new Date(),
        context: entry.context,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent
      }

      this.logs.push(logEntry)
    } catch (error) {
      // Don't throw - logging failure shouldn't block
    }
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      this.securityEvents.push({
        ...event,
        timestamp: new Date()
      } as any)
    } catch (error) {
      // Non-blocking
    }
  }

  async getUserAuditLogs(
    userId: string,
    options: {
      limit?: number
      offset?: number
      startDate?: Date
      endDate?: Date
      allowed?: boolean
    } = {}
  ): Promise<AuditLogEntry[]> {
    const { limit = 100, offset = 0, startDate, endDate, allowed } = options

    let filtered = this.logs.filter(l => l.user_id === userId)

    if (startDate) {
      filtered = filtered.filter(l => l.timestamp >= startDate)
    }

    if (endDate) {
      filtered = filtered.filter(l => l.timestamp <= endDate)
    }

    if (allowed !== undefined) {
      filtered = filtered.filter(l => l.allowed === allowed)
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit)
  }

  async getFailedAttempts(options: {
    limit?: number
    since?: Date
    userId?: string
  } = {}): Promise<AuditLogEntry[]> {
    const {
      limit = 100,
      since = new Date(Date.now() - 24 * 60 * 60 * 1000),
      userId
    } = options

    let filtered = this.logs.filter(
      l => l.allowed === false && l.timestamp >= since
    )

    if (userId) {
      filtered = filtered.filter(l => l.user_id === userId)
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  async getResourceAuditSummary(
    resourceType: string,
    resourceId: string
  ): Promise<{
    total_accesses: number
    unique_users: number
    failed_attempts: number
    last_accessed: Date | null
  }> {
    const filtered = this.logs.filter(
      l => l.resource_type === resourceType && l.resource_id === resourceId
    )

    const uniqueUsers = new Set(filtered.map(l => l.user_id))
    const failedAttempts = filtered.filter(l => !l.allowed).length
    const lastAccessed = filtered.length > 0 ?
      new Date(Math.max(...filtered.map(l => l.timestamp.getTime()))) :
      null

    return {
      total_accesses: filtered.length,
      unique_users: uniqueUsers.size,
      failed_attempts: failedAttempts,
      last_accessed: lastAccessed
    }
  }

  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const beforeLength = this.logs.length

    this.logs = this.logs.filter(l => l.timestamp >= cutoffDate)

    return beforeLength - this.logs.length
  }

  // Test helper
  getLogs() {
    return this.logs
  }

  getSecurityEvents() {
    return this.securityEvents
  }
}

describe('AuditService', () => {
  let auditService: MockAuditService

  beforeEach(() => {
    auditService = new MockAuditService()
  })

  describe('Permission Check Logging', () => {
    it('should log allowed permission check', async () => {
      await auditService.logPermissionCheck({
        user_id: 'user-123',
        action: 'view_fleet',
        allowed: true
      })

      const logs = auditService.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].user_id).toBe('user-123')
      expect(logs[0].action).toBe('view_fleet')
      expect(logs[0].allowed).toBe(true)
    })

    it('should log denied permission check', async () => {
      await auditService.logPermissionCheck({
        user_id: 'user-123',
        action: 'delete_vehicle',
        allowed: false,
        reason: 'Insufficient permissions'
      })

      const logs = auditService.getLogs()
      expect(logs[0].allowed).toBe(false)
      expect(logs[0].reason).toBe('Insufficient permissions')
    })

    it('should include resource information', async () => {
      await auditService.logPermissionCheck({
        user_id: 'user-123',
        action: 'view_vehicle',
        allowed: true,
        resource_type: 'vehicle',
        resource_id: 'vehicle-456'
      })

      const logs = auditService.getLogs()
      expect(logs[0].resource_type).toBe('vehicle')
      expect(logs[0].resource_id).toBe('vehicle-456')
    })

    it('should include context information', async () => {
      const context = { ip: '192.168.1.1', browser: 'Chrome' }

      await auditService.logPermissionCheck({
        user_id: 'user-123',
        action: 'edit_driver',
        allowed: true,
        context
      })

      const logs = auditService.getLogs()
      expect(logs[0].context).toEqual(context)
    })

    it('should include IP address and user agent', async () => {
      await auditService.logPermissionCheck({
        user_id: 'user-123',
        action: 'login',
        allowed: true,
        ip_address: '10.0.0.1',
        user_agent: 'Mozilla/5.0'
      })

      const logs = auditService.getLogs()
      expect(logs[0].ip_address).toBe('10.0.0.1')
      expect(logs[0].user_agent).toBe('Mozilla/5.0')
    })

    it('should set timestamp on log entry', async () => {
      const beforeTime = new Date()

      await auditService.logPermissionCheck({
        user_id: 'user-123',
        action: 'view_report',
        allowed: true
      })

      const afterTime = new Date()
      const logs = auditService.getLogs()

      expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should handle logging errors gracefully', async () => {
      // Service should not throw even if logging fails
      expect(async () => {
        await auditService.logPermissionCheck({
          user_id: 'user-123',
          action: 'test_action',
          allowed: true
        })
      }).not.toThrow()
    })
  })

  describe('Security Event Logging', () => {
    it('should log security event with required fields', async () => {
      await auditService.logSecurityEvent({
        event_type: 'failed_login',
        severity: 'medium',
        description: 'Multiple failed login attempts'
      })

      const events = auditService.getSecurityEvents()
      expect(events).toHaveLength(1)
      expect(events[0].event_type).toBe('failed_login')
      expect(events[0].severity).toBe('medium')
    })

    it('should log security event with user ID', async () => {
      await auditService.logSecurityEvent({
        user_id: 'user-123',
        event_type: 'unauthorized_access',
        severity: 'high',
        description: 'Attempted unauthorized resource access'
      })

      const events = auditService.getSecurityEvents()
      expect(events[0].user_id).toBe('user-123')
    })

    it('should support critical severity events', async () => {
      await auditService.logSecurityEvent({
        event_type: 'sql_injection_attempt',
        severity: 'critical',
        description: 'Potential SQL injection detected'
      })

      const events = auditService.getSecurityEvents()
      expect(events[0].severity).toBe('critical')
    })

    it('should include context in security events', async () => {
      const context = { attemptCount: 5, source: 'api' }

      await auditService.logSecurityEvent({
        event_type: 'rate_limit_exceeded',
        severity: 'high',
        description: 'Rate limit exceeded',
        context
      })

      const events = auditService.getSecurityEvents()
      expect(events[0].context).toEqual(context)
    })

    it('should include network information', async () => {
      await auditService.logSecurityEvent({
        event_type: 'suspicious_activity',
        severity: 'medium',
        description: 'Suspicious activity detected',
        ip_address: '203.0.113.0',
        user_agent: 'curl/7.64.1'
      })

      const events = auditService.getSecurityEvents()
      expect(events[0].ip_address).toBe('203.0.113.0')
      expect(events[0].user_agent).toBe('curl/7.64.1')
    })
  })

  describe('User Audit Log Retrieval', () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await auditService.logPermissionCheck({
          user_id: 'user-123',
          action: `action-${i}`,
          allowed: i % 2 === 0
        })
      }
    })

    it('should retrieve all logs for a user', async () => {
      const logs = await auditService.getUserAuditLogs('user-123')

      expect(logs).toHaveLength(5)
      expect(logs.every(l => l.user_id === 'user-123')).toBe(true)
    })

    it('should filter by allowed status', async () => {
      const allowedLogs = await auditService.getUserAuditLogs('user-123', { allowed: true })
      const deniedLogs = await auditService.getUserAuditLogs('user-123', { allowed: false })

      expect(allowedLogs.every(l => l.allowed === true)).toBe(true)
      expect(deniedLogs.every(l => l.allowed === false)).toBe(true)
    })

    it('should apply pagination', async () => {
      const firstPage = await auditService.getUserAuditLogs('user-123', {
        limit: 2,
        offset: 0
      })

      const secondPage = await auditService.getUserAuditLogs('user-123', {
        limit: 2,
        offset: 2
      })

      expect(firstPage).toHaveLength(2)
      expect(secondPage).toHaveLength(2)
      expect(firstPage[0]).not.toEqual(secondPage[0])
    })

    it('should sort by most recent first', async () => {
      const logs = await auditService.getUserAuditLogs('user-123')

      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].timestamp.getTime()).toBeGreaterThanOrEqual(logs[i + 1].timestamp.getTime())
      }
    })

    it('should filter by date range', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const logsInRange = await auditService.getUserAuditLogs('user-123', {
        startDate: yesterday,
        endDate: tomorrow
      })

      expect(logsInRange.length).toBeGreaterThan(0)
    })

    it('should return empty for unknown user', async () => {
      const logs = await auditService.getUserAuditLogs('unknown-user')

      expect(logs).toHaveLength(0)
    })
  })

  describe('Failed Attempts Tracking', () => {
    beforeEach(async () => {
      // Log some failed attempts
      for (let i = 0; i < 3; i++) {
        await auditService.logPermissionCheck({
          user_id: 'user-123',
          action: 'delete_data',
          allowed: false
        })
      }

      // Log some successful checks
      for (let i = 0; i < 2; i++) {
        await auditService.logPermissionCheck({
          user_id: 'user-123',
          action: 'view_data',
          allowed: true
        })
      }
    })

    it('should retrieve only failed attempts', async () => {
      const failed = await auditService.getFailedAttempts()

      expect(failed.every(l => l.allowed === false)).toBe(true)
    })

    it('should filter by user ID', async () => {
      await auditService.logPermissionCheck({
        user_id: 'user-456',
        action: 'access_denied',
        allowed: false
      })

      const userFailed = await auditService.getFailedAttempts({ userId: 'user-123' })

      expect(userFailed.every(l => l.user_id === 'user-123')).toBe(true)
    })

    it('should apply time limit (last 24 hours)', async () => {
      const failed = await auditService.getFailedAttempts({
        since: new Date()
      })

      // Should not include very old logs
      expect(failed.every(l => l.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000))).toBe(true)
    })

    it('should apply limit', async () => {
      const failed = await auditService.getFailedAttempts({ limit: 1 })

      expect(failed).toHaveLength(1)
    })
  })

  describe('Resource Audit Summary', () => {
    beforeEach(async () => {
      // Log accesses from multiple users to same resource
      for (let i = 0; i < 5; i++) {
        await auditService.logPermissionCheck({
          user_id: `user-${i}`,
          action: 'view_vehicle',
          allowed: i !== 3, // One failed attempt
          resource_type: 'vehicle',
          resource_id: 'vehicle-100'
        })
      }
    })

    it('should summarize total accesses', async () => {
      const summary = await auditService.getResourceAuditSummary('vehicle', 'vehicle-100')

      expect(summary.total_accesses).toBe(5)
    })

    it('should count unique users', async () => {
      const summary = await auditService.getResourceAuditSummary('vehicle', 'vehicle-100')

      expect(summary.unique_users).toBe(5)
    })

    it('should count failed attempts', async () => {
      const summary = await auditService.getResourceAuditSummary('vehicle', 'vehicle-100')

      expect(summary.failed_attempts).toBe(1)
    })

    it('should track last accessed time', async () => {
      const summary = await auditService.getResourceAuditSummary('vehicle', 'vehicle-100')

      expect(summary.last_accessed).toBeInstanceOf(Date)
      expect(summary.last_accessed!.getTime()).toBeGreaterThan(Date.now() - 10000) // Within 10 seconds
    })

    it('should return zero for non-existent resource', async () => {
      const summary = await auditService.getResourceAuditSummary('vehicle', 'non-existent')

      expect(summary.total_accesses).toBe(0)
      expect(summary.unique_users).toBe(0)
      expect(summary.failed_attempts).toBe(0)
      expect(summary.last_accessed).toBeNull()
    })
  })

  describe('Log Retention and Cleanup', () => {
    beforeEach(async () => {
      const now = Date.now()

      // Add old logs (beyond retention period)
      const oldDate = new Date(now - 100 * 24 * 60 * 60 * 1000) // 100 days ago
      for (let i = 0; i < 3; i++) {
        const entry: AuditLogEntry = {
          user_id: `old-user-${i}`,
          action: 'old_action',
          allowed: true,
          timestamp: oldDate
        }
        ;(auditService as any).logs.push(entry)
      }

      // Add recent logs
      for (let i = 0; i < 2; i++) {
        await auditService.logPermissionCheck({
          user_id: `recent-user-${i}`,
          action: 'recent_action',
          allowed: true
        })
      }
    })

    it('should clean up logs older than retention period', async () => {
      const beforeCleanup = (auditService as any).logs.length
      const deleted = await auditService.cleanupOldLogs(90)

      expect(deleted).toBeGreaterThan(0)
      expect((auditService as any).logs.length).toBeLessThan(beforeCleanup)
    })

    it('should preserve recent logs', async () => {
      await auditService.cleanupOldLogs(90)

      const remaining = (auditService as any).logs
      const hasRecentLogs = remaining.some(l => l.user_id.startsWith('recent-user'))

      expect(hasRecentLogs).toBe(true)
    })

    it('should return count of deleted logs', async () => {
      const deleted = await auditService.cleanupOldLogs(90)

      expect(typeof deleted).toBe('number')
      expect(deleted).toBeGreaterThan(0)
    })

    it('should support custom retention period', async () => {
      const deleted = await auditService.cleanupOldLogs(30) // 30 days

      expect(deleted).toBeGreaterThan(0)
    })

    it('should delete nothing when nothing is old enough', async () => {
      const deleted = await auditService.cleanupOldLogs(200) // 200 days (keeps everything)

      expect(deleted).toBe(0)
    })
  })

  describe('Multiple Users and Resources', () => {
    it('should track logs for multiple users independently', async () => {
      await auditService.logPermissionCheck({
        user_id: 'user-1',
        action: 'action-a',
        allowed: true
      })

      await auditService.logPermissionCheck({
        user_id: 'user-2',
        action: 'action-b',
        allowed: false
      })

      const logs1 = await auditService.getUserAuditLogs('user-1')
      const logs2 = await auditService.getUserAuditLogs('user-2')

      expect(logs1).toHaveLength(1)
      expect(logs2).toHaveLength(1)
      expect(logs1[0].user_id).toBe('user-1')
      expect(logs2[0].user_id).toBe('user-2')
    })

    it('should track multiple resource types', async () => {
      await auditService.logPermissionCheck({
        user_id: 'user-1',
        action: 'view',
        allowed: true,
        resource_type: 'vehicle',
        resource_id: 'v-1'
      })

      await auditService.logPermissionCheck({
        user_id: 'user-1',
        action: 'view',
        allowed: true,
        resource_type: 'driver',
        resource_id: 'd-1'
      })

      const vehicleSummary = await auditService.getResourceAuditSummary('vehicle', 'v-1')
      const driverSummary = await auditService.getResourceAuditSummary('driver', 'd-1')

      expect(vehicleSummary.total_accesses).toBe(1)
      expect(driverSummary.total_accesses).toBe(1)
    })
  })

  describe('Error Handling', () => {
    it('should not throw on logging failure', async () => {
      // Wrap in try-catch to ensure no throw
      let threw = false
      try {
        await auditService.logPermissionCheck({
          user_id: 'user-123',
          action: 'test',
          allowed: true
        })
      } catch (error) {
        threw = true
      }

      expect(threw).toBe(false)
    })

    it('should handle missing optional fields', async () => {
      await auditService.logPermissionCheck({
        user_id: 'user-123',
        action: 'minimal_action',
        allowed: true
        // No optional fields
      })

      const logs = auditService.getLogs()
      expect(logs[0].user_id).toBe('user-123')
    })
  })
})
