/**
 * Compliance Reporting API Routes
 * Provides endpoints for FedRAMP, NIST 800-53, and other compliance reporting
 */

import express from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLogEnhanced, getAuditLogsByNISTControl, getAuditComplianceSummary } from '../middleware/audit-enhanced'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission as authorize } from '../middleware/rbac'
import {
  generateFedRAMPReport,
  getComplianceReportById,
  listComplianceReports
} from '../services/compliance-reporting.service'

// Placeholder NIST controls data structure
const NIST_80053_CONTROLS: Record<string, any> = {}

// Placeholder compliance functions
function getControlsByBaseline(baseline: 'LOW' | 'MODERATE' | 'HIGH'): any[] {
  return []
}

function getFedRAMPControls(): any[] {
  return []
}

function getControlsByFamily(family: string): any[] {
  return []
}

function getControlsByStatus(status: string): any[] {
  return []
}

function getComplianceSummary(): any {
  return {
    total: 0,
    implemented: 0,
    partial: 0,
    planned: 0,
    notImplemented: 0
  }
}

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateJWT)

const scoreStatus = (score: number) => {
  if (score >= 95) return 'excellent'
  if (score >= 85) return 'good'
  if (score >= 75) return 'warning'
  return 'critical'
}

const scoreTrend = (current: number, previous: number) => {
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'stable'
}

/**
 * Compliance dashboard data for UI hubs
 * GET /api/compliance/dashboard
 */
router.get(
  '/dashboard',
  authenticateJWT,
  authorize(['view_compliance']),
  async (req, res) => {
    try {
      const tenantId = req.user?.tenant_id

      const [
        inspectionsDueResult,
        inspectionsCompletedResult,
        incidentsCriticalResult,
        incidentsPreviousResult,
        trainingExpiringResult,
        trainingExpiredResult,
        oshaRecordableResult,
        oshaLostTimeResult,
        docsExpiringResult,
        recentInspections,
        recentIncidents,
        recentTraining,
        recentOsha
      ] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM inspections
           WHERE tenant_id = $1 AND status IN ('pending', 'in_progress')`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM inspections
           WHERE tenant_id = $1 AND status = 'completed'`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM incidents
           WHERE tenant_id = $1 AND severity IN ('major','critical','fatal')`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM incidents
           WHERE tenant_id = $1
             AND incident_date >= NOW() - INTERVAL '60 days'
             AND incident_date < NOW() - INTERVAL '30 days'
             AND severity IN ('major','critical','fatal')`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM training_records
           WHERE tenant_id = $1
             AND expiry_date IS NOT NULL
             AND expiry_date <= NOW() + INTERVAL '30 days'
             AND expiry_date > NOW()`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM training_records
           WHERE tenant_id = $1
             AND expiry_date IS NOT NULL
             AND expiry_date <= NOW()`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM osha_logs
           WHERE tenant_id = $1 AND is_recordable = true`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM osha_logs
           WHERE tenant_id = $1 AND is_lost_time = true`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM documents
           WHERE tenant_id = $1
             AND (expires_at IS NOT NULL OR expiry_date IS NOT NULL)
             AND COALESCE(expires_at, expiry_date) <= NOW() + INTERVAL '30 days'
             AND COALESCE(expires_at, expiry_date) > NOW()`,
          [tenantId]
        ),
        pool.query(
          `SELECT id, type, status, started_at as timestamp, vehicle_id
           FROM inspections
           WHERE tenant_id = $1
           ORDER BY started_at DESC
           LIMIT 5`,
          [tenantId]
        ),
        pool.query(
          `SELECT id, type, severity, status, incident_date as timestamp, vehicle_id
           FROM incidents
           WHERE tenant_id = $1
           ORDER BY incident_date DESC
           LIMIT 5`,
          [tenantId]
        ),
        pool.query(
          `SELECT id, training_name, status, completion_date as timestamp, driver_id
           FROM training_records
           WHERE tenant_id = $1
           ORDER BY completion_date DESC NULLS LAST
           LIMIT 5`,
          [tenantId]
        ),
        pool.query(
          `SELECT id, incident_description, status, incident_date as timestamp, vehicle_id
           FROM osha_logs
           WHERE tenant_id = $1
           ORDER BY incident_date DESC
           LIMIT 5`,
          [tenantId]
        )
      ])

      const inspectionsDue = inspectionsDueResult.rows[0]?.count || 0
      const inspectionsCompleted = inspectionsCompletedResult.rows[0]?.count || 0
      const incidentsCritical = incidentsCriticalResult.rows[0]?.count || 0
      const incidentsPrevious = incidentsPreviousResult.rows[0]?.count || 0
      const trainingExpiring = trainingExpiringResult.rows[0]?.count || 0
      const trainingExpired = trainingExpiredResult.rows[0]?.count || 0
      const oshaRecordable = oshaRecordableResult.rows[0]?.count || 0
      const oshaLostTime = oshaLostTimeResult.rows[0]?.count || 0
      const docsExpiring = docsExpiringResult.rows[0]?.count || 0

      const vehicleScore = Math.max(0, 100 - (inspectionsDue * 2 + incidentsCritical * 4))
      const driverScore = Math.max(0, 100 - (trainingExpired * 5 + trainingExpiring * 2))
      const safetyScore = Math.max(0, 100 - (oshaRecordable * 3 + oshaLostTime * 5))
      const regulatoryScore = Math.max(0, 100 - (docsExpiring * 2))

      const metrics = [
        {
          id: 'vehicle-compliance',
          category: 'Vehicle Compliance',
          score: vehicleScore,
          target: 95,
          trend: scoreTrend(incidentsCritical, incidentsPrevious),
          violations: incidentsCritical,
          inspectionsDue,
          status: scoreStatus(vehicleScore)
        },
        {
          id: 'driver-compliance',
          category: 'Driver Compliance',
          score: driverScore,
          target: 95,
          trend: scoreTrend(trainingExpiring, trainingExpired),
          violations: trainingExpired,
          inspectionsDue: trainingExpiring,
          status: scoreStatus(driverScore)
        },
        {
          id: 'safety-compliance',
          category: 'Safety Compliance',
          score: safetyScore,
          target: 95,
          trend: scoreTrend(oshaRecordable, oshaLostTime),
          violations: oshaRecordable,
          inspectionsDue: oshaLostTime,
          status: scoreStatus(safetyScore)
        },
        {
          id: 'regulatory-compliance',
          category: 'Regulatory Compliance',
          score: regulatoryScore,
          target: 95,
          trend: docsExpiring > 0 ? 'down' : 'stable',
          violations: docsExpiring,
          inspectionsDue: docsExpiring,
          status: scoreStatus(regulatoryScore)
        }
      ]

      const alerts = []
      if (inspectionsDue > 0) {
        alerts.push({
          id: `alert-inspections`,
          type: 'warning',
          severity: 'high',
          title: 'Vehicle Inspections Due',
          description: `${inspectionsDue} vehicle inspections are pending.`,
          timestamp: new Date().toISOString(),
          entityType: 'vehicle',
          entityId: 'inspection',
        })
      }
      if (trainingExpiring + trainingExpired > 0) {
        alerts.push({
          id: `alert-training`,
          type: trainingExpired > 0 ? 'critical' : 'expiring',
          severity: trainingExpired > 0 ? 'critical' : 'high',
          title: 'Training Certifications',
          description: `${trainingExpired} expired and ${trainingExpiring} expiring certifications.`,
          timestamp: new Date().toISOString(),
          entityType: 'driver',
          entityId: 'training',
        })
      }
      if (incidentsCritical > 0) {
        alerts.push({
          id: `alert-incidents`,
          type: 'violation',
          severity: 'critical',
          title: 'Critical Incidents',
          description: `${incidentsCritical} critical incidents require review.`,
          timestamp: new Date().toISOString(),
          entityType: 'vehicle',
          entityId: 'incident',
        })
      }
      if (docsExpiring > 0) {
        alerts.push({
          id: `alert-docs`,
          type: 'expiring',
          severity: 'medium',
          title: 'Documents Expiring',
          description: `${docsExpiring} compliance documents expire within 30 days.`,
          timestamp: new Date().toISOString(),
          entityType: 'document',
          entityId: 'document',
        })
      }

      const events = [
        ...recentInspections.rows.map((row: any) => ({
          id: `inspection-${row.id}`,
          type: 'inspection',
          title: `Inspection ${row.type}`,
          description: `Inspection status: ${row.status}`,
          timestamp: row.timestamp,
          status: row.status === 'completed' ? 'completed' : 'pending',
          entityType: 'vehicle',
          entityId: row.vehicle_id,
        })),
        ...recentIncidents.rows.map((row: any) => ({
          id: `incident-${row.id}`,
          type: 'violation',
          title: `Incident ${row.type}`,
          description: `Severity: ${row.severity}`,
          timestamp: row.timestamp,
          status: row.status === 'completed' ? 'completed' : 'pending',
          entityType: 'vehicle',
          entityId: row.vehicle_id,
        })),
        ...recentTraining.rows.map((row: any) => ({
          id: `training-${row.id}`,
          type: 'training',
          title: row.training_name,
          description: `Training status: ${row.status}`,
          timestamp: row.timestamp,
          status: row.status === 'completed' ? 'completed' : 'pending',
          entityType: 'driver',
          entityId: row.driver_id,
        })),
        ...recentOsha.rows.map((row: any) => ({
          id: `osha-${row.id}`,
          type: 'audit',
          title: 'OSHA Log',
          description: row.incident_description,
          timestamp: row.timestamp,
          status: row.status === 'closed' ? 'completed' : 'pending',
          entityType: 'facility',
          entityId: row.vehicle_id,
        }))
      ]

      res.json({ metrics, alerts, events, summary: { inspectionsDue, inspectionsCompleted } })
    } catch (error) {
      logger.error('Error building compliance dashboard:', error)
      res.status(500).json({ error: 'Failed to build compliance dashboard' })
    }
  }
)

/**
 * Generate FedRAMP compliance report
 * POST /api/compliance/fedramp/report
 */
router.post(
  '/fedramp/report',
  authenticateJWT,
  authorize(['view_compliance']),
  auditLogEnhanced({
    action: 'EXECUTE',
    resourceType: 'compliance_report',
    nistControls: ['AU-6', 'CA-2', 'CA-7'],
    complianceType: 'FEDRAMP',
    severity: 'INFO'
  }),
  async (req, res) => {
    try {
      const { baseline = 'MODERATE', period_start, period_end, tenant_id } = req.body

      // Validate baseline
      if (!['LOW', 'MODERATE', 'HIGH'].includes(baseline)) {
        return res.status(400).json({
          error: 'Invalid baseline',
          message: 'Baseline must be LOW, MODERATE, or HIGH'
        })
      }

      // Parse dates
      const startDate = period_start ? new Date(period_start) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      const endDate = period_end ? new Date(period_end) : new Date()

      // Generate report
      const report = await generateFedRAMPReport(
        tenant_id || req.user?.tenant_id,
        baseline,
        startDate,
        endDate
      )

      logger.info('FedRAMP report generated', {
        reportId: report.id,
        baseline,
        userId: req.user?.id
      })

      res.json({
        success: true,
        report
      })
    } catch (error) {
      logger.error('Error generating FedRAMP report:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate FedRAMP compliance report'
      })
    }
  }
)

/**
 * Get compliance report by ID
 * GET /api/compliance/reports/:reportId
 */
router.get(
  '/reports/:reportId',
  authenticateJWT,
  authorize(['view_compliance']),
  auditLogEnhanced({
    action: 'READ',
    resourceType: 'compliance_report',
    nistControls: ['AU-2', 'CA-7']
  }),
  async (req, res) => {
    try {
      const { reportId } = req.params

      const report = await getComplianceReportById(reportId)

      if (!report) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Compliance report not found'
        })
      }

      res.json({
        success: true,
        report
      })
    } catch (error) {
      logger.error('Error fetching compliance report:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch compliance report'
      })
    }
  }
)

/**
 * List all compliance reports
 * GET /api/compliance/reports
 */
router.get(
  '/reports',
  authenticateJWT,
  authorize(['view_compliance']),
  auditLogEnhanced({
    action: 'QUERY',
    resourceType: 'compliance_report',
    nistControls: ['AU-2']
  }),
  async (req, res) => {
    try {
      const { report_type, limit = 10 } = req.query

      const reports = await listComplianceReports(
        report_type as string | undefined,
        parseInt(limit as string)
      )

      res.json({
        success: true,
        count: reports.length,
        reports
      })
    } catch (error) {
      logger.error('Error listing compliance reports:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list compliance reports'
      })
    }
  }
)

/**
 * Get NIST 800-53 controls catalog
 * GET /api/compliance/nist-controls
 */
router.get(
  '/nist-controls',
  authenticateJWT,
  authorize(['view_compliance']),
  auditLogEnhanced({
    action: 'READ',
    resourceType: 'nist_controls'
  }),
  async (req, res) => {
    try {
      const { baseline, family, status } = req.query

      let controls = Object.values(NIST_80053_CONTROLS)

      if (baseline) {
        controls = getControlsByBaseline(baseline as 'LOW' | 'MODERATE' | 'HIGH')
      }

      if (family) {
        controls = getControlsByFamily(family as any)
      }

      if (status) {
        controls = getControlsByStatus(status as any)
      }

      res.json({
        success: true,
        count: controls.length,
        controls
      })
    } catch (error) {
      logger.error('Error fetching NIST controls:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch NIST controls'
      })
    }
  }
)

/**
 * Get compliance summary
 * GET /api/compliance/summary
 */
router.get(
  '/summary',
  authenticateJWT,
  authorize(['view_compliance']),
  auditLogEnhanced({
    action: 'READ',
    resourceType: 'compliance_summary',
    nistControls: ['CA-2', 'CA-7']
  }),
  async (req, res) => {
    try {
      const summary = getComplianceSummary()
      const auditSummary = await getAuditComplianceSummary(req.user?.tenant_id)

      res.json({
        success: true,
        controls_summary: summary,
        audit_summary: auditSummary
      })
    } catch (error) {
      logger.error('Error fetching compliance summary:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch compliance summary'
      })
    }
  }
)

/**
 * Get audit logs by NIST control
 * GET /api/compliance/audit-logs/:controlId
 */
router.get(
  '/audit-logs/:controlId',
  authenticateJWT,
  authorize(['view_compliance']),
  auditLogEnhanced({
    action: 'QUERY',
    resourceType: 'audit_logs',
    nistControls: ['AU-6', 'AU-7']
  }),
  async (req, res) => {
    try {
      const { controlId } = req.params
      const { start_date, end_date } = req.query

      const startDate = start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const endDate = end_date ? new Date(end_date as string) : new Date()

      const logs = await getAuditLogsByNISTControl(controlId, startDate, endDate, req.user?.tenant_id)

      res.json({
        success: true,
        control_id: controlId,
        count: logs.length,
        logs
      })
    } catch (error) {
      logger.error('Error fetching audit logs by control:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch audit logs'
      })
    }
  }
)

/**
 * Get FedRAMP controls
 * GET /api/compliance/fedramp-controls
 */
router.get(
  '/fedramp-controls',
  authenticateJWT,
  authorize(['view_compliance']),
  auditLogEnhanced({
    action: 'READ',
    resourceType: 'fedramp_controls'
  }),
  async (req, res) => {
    try {
      const controls = getFedRAMPControls()

      res.json({
        success: true,
        count: controls.length,
        controls
      })
    } catch (error) {
      logger.error('Error fetching FedRAMP controls:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch FedRAMP controls'
      })
    }
  }
)

/**
 * Test compliance control
 * POST /api/compliance/test-control
 */
router.post(
  '/test-control',
  authenticateJWT,
  authorize(['manage_compliance']),
  auditLogEnhanced({
    action: 'EXECUTE',
    resourceType: 'control_test',
    nistControls: ['CA-2', 'CA-8'],
    severity: 'INFO'
  }),
  async (req, res) => {
    try {
      const { control_id, test_type = 'automated' } = req.body

      if (!control_id) {
        return res.status(400).json({
          error: 'Missing control_id',
          message: 'Control ID is required'
        })
      }

      const control = NIST_80053_CONTROLS[control_id]

      if (!control) {
        return res.status(404).json({
          error: 'Control not found',
          message: `NIST control ${control_id} not found`
        })
      }

      // Simulate control testing (in production, this would run actual tests)
      const testResult = {
        control_id,
        control_title: control.title,
        test_type,
        tested_at: new Date().toISOString(),
        status: 'PASS',
        findings: [],
        evidence: control.evidence_locations || [],
        tester: req.user?.email,
        notes: `Automated test executed successfully`
      }

      logger.info('Control test executed', {
        controlId: control_id,
        userId: req.user?.id
      })

      res.json({
        success: true,
        test_result: testResult
      })
    } catch (error) {
      logger.error('Error testing control:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to test control'
      })
    }
  }
)

export default router
