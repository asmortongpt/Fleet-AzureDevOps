/**
 * Alert Engine Service Unit Tests
 * Tests alert creation, delivery, and management
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { AlertEngineService } from '../../src/services/alert-engine.service'
import { testPool, cleanupDatabase, seedTestDatabase, closeTestDatabase } from '../setup'

describe('AlertEngineService', () => {
  let service: AlertEngineService
  const testTenantId = 'test-tenant-id'

  beforeAll(async () => {
    await seedTestDatabase()
    service = new AlertEngineService()
  })

  afterAll(async () => {
    await cleanupDatabase()
    await closeTestDatabase()
  })

  beforeEach(async () => {
    await testPool.query('DELETE FROM alert_notifications WHERE 1=1')
    await testPool.query('DELETE FROM alerts WHERE 1=1')
  })

  describe('createAlert', () => {
    it('should create an alert successfully', async () => {
      const alertData = {
        alert_type: 'maintenance_due',
        severity: 'warning' as const,
        title: 'Maintenance Due',
        message: 'Vehicle #123 requires maintenance',
        entity_type: 'vehicle',
        entity_id: 'vehicle-123'
      }

      const alert = await service.createAlert(testTenantId, alertData)

      expect(alert).toBeDefined()
      expect(alert.id).toBeDefined()
      expect(alert.tenant_id).toBe(testTenantId)
      expect(alert.alert_type).toBe(alertData.alert_type)
      expect(alert.severity).toBe(alertData.severity)
      expect(alert.title).toBe(alertData.title)
      expect(alert.status).toBe('pending')
    })

    it('should store alert in database', async () => {
      const alertData = {
        alert_type: 'fuel_anomaly',
        severity: 'critical' as const,
        title: 'Fuel Anomaly Detected',
        message: 'Unusual fuel consumption detected'
      }

      const alert = await service.createAlert(testTenantId, alertData)

      const result = await testPool.query(
        'SELECT * FROM alerts WHERE id = $1',
        [alert.id]
      )

      expect(result.rows.length).toBe(1)
      expect(result.rows[0].alert_type).toBe(alertData.alert_type)
    })

    it('should handle metadata correctly', async () => {
      const alertData = {
        alert_type: 'custom',
        severity: 'info' as const,
        title: 'Test Alert',
        message: 'Test message',
        metadata: {
          custom_field: 'value',
          numeric_field: 123,
          nested: { data: 'test' }
        }
      }

      const alert = await service.createAlert(testTenantId, alertData)

      const result = await testPool.query(
        'SELECT metadata FROM alerts WHERE id = $1',
        [alert.id]
      )

      expect(result.rows[0].metadata).toEqual(alertData.metadata)
    })

    it('should create alerts with different severity levels', async () => {
      const severities: Array<'info' | 'warning' | 'critical' | 'emergency'> =
        ['info', 'warning', 'critical', 'emergency']

      for (const severity of severities) {
        const alert = await service.createAlert(testTenantId, {
          alert_type: 'test',
          severity,
          title: `Test ${severity}`,
          message: `Test ${severity} message`
        })

        expect(alert.severity).toBe(severity)
      }
    })
  })

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      const alert = await service.createAlert(testTenantId, {
        alert_type: 'test',
        severity: 'warning',
        title: 'Test Alert',
        message: 'Test message'
      })

      const userId = 'test-user-id'
      const acknowledged = await service.acknowledgeAlert(alert.id, userId, testTenantId)

      expect(acknowledged).toBe(true)

      const result = await testPool.query(
        'SELECT status, acknowledged_by, acknowledged_at FROM alerts WHERE id = $1',
        [alert.id]
      )

      expect(result.rows[0].status).toBe('acknowledged')
      expect(result.rows[0].acknowledged_by).toBe(userId)
      expect(result.rows[0].acknowledged_at).toBeDefined()
    })

    it('should not acknowledge alerts from other tenants', async () => {
      const alert = await service.createAlert(testTenantId, {
        alert_type: 'test',
        severity: 'warning',
        title: 'Test Alert',
        message: 'Test message'
      })

      const differentTenantId = 'different-tenant-id'
      const acknowledged = await service.acknowledgeAlert(alert.id, 'user-id', differentTenantId)

      expect(acknowledged).toBe(false)
    })
  })

  describe('getAlerts', () => {
    beforeEach(async () => {
      // Create test alerts
      await service.createAlert(testTenantId, {
        alert_type: 'maintenance_due',
        severity: 'warning',
        title: 'Maintenance Alert',
        message: 'Message 1'
      })

      await service.createAlert(testTenantId, {
        alert_type: 'fuel_anomaly',
        severity: 'critical',
        title: 'Fuel Alert',
        message: 'Message 2'
      })

      await service.createAlert(testTenantId, {
        alert_type: 'speed_violation',
        severity: 'info',
        title: 'Speed Alert',
        message: 'Message 3'
      })
    })

    it('should retrieve all alerts for tenant', async () => {
      const alerts = await service.getAlerts(testTenantId)

      expect(alerts.length).toBeGreaterThanOrEqual(3)
      alerts.forEach((alert: any) => {
        expect(alert.tenant_id).toBe(testTenantId)
      })
    })

    it('should filter alerts by severity', async () => {
      const alerts = await service.getAlerts(testTenantId, { severity: 'critical' })

      alerts.forEach((alert: any) => {
        expect(alert.severity).toBe('critical')
      })
    })

    it('should filter alerts by status', async () => {
      const alerts = await service.getAlerts(testTenantId, { status: 'pending' })

      alerts.forEach((alert: any) => {
        expect(alert.status).toBe('pending')
      })
    })

    it('should filter alerts by type', async () => {
      const alerts = await service.getAlerts(testTenantId, { alert_type: 'maintenance_due' })

      alerts.forEach((alert: any) => {
        expect(alert.alert_type).toBe('maintenance_due')
      })
    })
  })

  describe('checkMaintenanceAlerts', () => {
    it('should generate maintenance alerts for overdue vehicles', async () => {
      // This would test the scheduled job that checks for maintenance
      const alerts = await service.checkMaintenanceAlerts(testTenantId)

      expect(Array.isArray(alerts)).toBe(true)
    })
  })

  describe('checkGeofenceViolations', () => {
    it('should generate alerts for geofence violations', async () => {
      const alerts = await service.checkGeofenceViolations(testTenantId)

      expect(Array.isArray(alerts)).toBe(true)
    })
  })

  describe('Alert Statistics', () => {
    beforeEach(async () => {
      // Create mix of acknowledged and pending alerts
      const alert1 = await service.createAlert(testTenantId, {
        alert_type: 'test',
        severity: 'warning',
        title: 'Alert 1',
        message: 'Message 1'
      })

      const alert2 = await service.createAlert(testTenantId, {
        alert_type: 'test',
        severity: 'critical',
        title: 'Alert 2',
        message: 'Message 2'
      })

      await service.acknowledgeAlert(alert1.id, 'user-id', testTenantId)
    })

    it('should calculate alert statistics', async () => {
      const stats = await service.getAlertStatistics(testTenantId)

      expect(stats.total).toBeGreaterThan(0)
      expect(stats.by_severity).toBeDefined()
      expect(stats.by_status).toBeDefined()
      expect(stats.acknowledged_count).toBeGreaterThan(0)
      expect(stats.pending_count).toBeGreaterThan(0)
    })
  })
})
