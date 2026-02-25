/**
 * Customer Handoff Report REST API Routes
 *
 * Provides REST endpoints for handoff report operations:
 * - GET /api/validation/handoff/report - Get handoff report (JSON)
 * - GET /api/validation/handoff/report/html - Generate HTML report
 * - GET /api/validation/handoff/report/pdf - Generate PDF report
 * - GET /api/validation/handoff/report/csv - Generate CSV report
 * - POST /api/validation/handoff/sign-off - Manager sign-off approval
 * - GET /api/validation/handoff/sign-off/history - Approval history
 * - GET /api/validation/handoff/ready-for-customer - Readiness check
 * - POST /api/validation/handoff/save - Save report
 * - GET /api/validation/handoff/reports - List saved reports
 * - GET /api/validation/handoff/reports/:id - Retrieve saved report
 *
 * @module routes/validation-handoff
 * @author Claude Code - Task 14
 * @date 2026-02-25
 */

import express, { Router, Request, Response, NextFunction } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { logger } from '../lib/logger'
import { HandoffReportGenerator } from '../validation/HandoffReportGenerator'
import {
  ApprovalSignOffSchema,
  HandoffReportOptionsSchema,
  ExportOptionsSchema,
  type HandoffReportOptions,
  type ExportOptions,
  type ApprovalSignOff
} from '../validation/models/HandoffModels'

const router: Router = express.Router()

/**
 * Middleware to extract and validate tenant context
 * Requires valid auth context (guaranteed by authenticateJWT middleware)
 */
const getTenantContext = (req: Request) => {
  const user = (req as any).user
  if (!user?.tenantId || !user?.id) {
    throw new Error('User context missing - authenticateJWT should have set this')
  }

  const environment = (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development'

  return { tenantId: user.tenantId, userId: user.id, environment }
}

/**
 * Create generator instance for request with shared service instances
 */
const createGenerator = (req: Request) => {
  const context = getTenantContext(req)
  return HandoffReportGenerator.createWithSharedServices(context)
}

// ============================================================================
// GET /api/validation/handoff/report
// ============================================================================

/**
 * Get handoff report as JSON
 *
 * Query parameters:
 * - includeScreenshots: boolean (default: true)
 * - includeMetrics: boolean (default: true)
 * - includeSensitiveData: boolean (default: false)
 * - minSeverity: 'critical' | 'high' | 'medium' | 'low' (default: 'low')
 * - includeResolvedIssues: boolean (default: true)
 * - includeDismissedIssues: boolean (default: true)
 */
router.get('/', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const generator = createGenerator(req)

    // Parse and validate options
    const options: HandoffReportOptions = {
      includeScreenshots: req.query.includeScreenshots !== 'false',
      includeMetrics: req.query.includeMetrics !== 'false',
      includeSensitiveData: req.query.includeSensitiveData === 'true',
      minSeverity: (req.query.minSeverity as any) || undefined,
      includeResolvedIssues: req.query.includeResolvedIssues !== 'false',
      includeDismissedIssues: req.query.includeDismissedIssues !== 'false'
    }

    const report = await generator.generateReport(options)

    res.json({
      success: true,
      data: report,
      meta: {
        endpoint: 'GET /api/validation/handoff/report',
        timestamp: new Date().toISOString(),
        reportId: report.metadata.reportId
      }
    })
  } catch (error) {
    logger.error('Error fetching handoff report', { error })
    next(error)
  }
})

// ============================================================================
// GET /api/validation/handoff/report/html
// ============================================================================

/**
 * Generate handoff report as HTML
 *
 * Query parameters:
 * - includeTableOfContents: boolean (default: true)
 * - includeAppendices: boolean (default: true)
 * - includePageNumbers: boolean (default: true)
 */
router.get('/report/html', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const generator = createGenerator(req)

    const exportOptions: ExportOptions = {
      format: 'html',
      includeTableOfContents: req.query.includeTableOfContents !== 'false',
      includeAppendices: req.query.includeAppendices !== 'false',
      includePageNumbers: req.query.includePageNumbers !== 'false'
    }

    const html = await generator.exportAsHtml(undefined, exportOptions)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="handoff-report-' + new Date().toISOString().split('T')[0] + '.html"'
    )
    res.send(html)

    logger.info('HTML report generated and sent', { size: html.length })
  } catch (error) {
    logger.error('Error generating HTML report', { error })
    next(error)
  }
})

// ============================================================================
// GET /api/validation/handoff/report/pdf
// ============================================================================

/**
 * Generate handoff report as PDF
 *
 * Query parameters:
 * - pageSize: 'A4' | 'Letter' | 'A3' (default: 'A4')
 * - includePageNumbers: boolean (default: true)
 */
router.get('/report/pdf', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // PDF export not yet implemented
    return res.status(501).json({
      success: false,
      error: 'PDF export is not yet implemented. Please use HTML or CSV format instead.'
    })
  } catch (error) {
    logger.error('Error generating PDF report', { error })
    next(error)
  }
})

// ============================================================================
// GET /api/validation/handoff/report/csv
// ============================================================================

/**
 * Generate handoff report as CSV
 *
 * Returns issues in CSV format for easy import into spreadsheets
 */
router.get('/report/csv', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const generator = createGenerator(req)

    const csv = await generator.exportAsCsv()

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="handoff-report-' + new Date().toISOString().split('T')[0] + '.csv"'
    )
    res.send(csv)

    logger.info('CSV report generated and sent', { size: csv.length })
  } catch (error) {
    logger.error('Error generating CSV report', { error })
    next(error)
  }
})

// ============================================================================
// GET /api/validation/handoff/quality-metrics
// ============================================================================

/**
 * Get quality metrics only
 */
router.get('/quality-metrics', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const generator = createGenerator(req)
    const metrics = await generator.calculateQualityMetrics()

    res.json({
      success: true,
      data: metrics,
      meta: {
        endpoint: 'GET /api/validation/handoff/quality-metrics',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching quality metrics', { error })
    next(error)
  }
})

// ============================================================================
// POST /api/validation/handoff/sign-off
// ============================================================================

/**
 * Record manager approval for handoff
 *
 * Body:
 * {
 *   "reviewer": "manager@example.com",
 *   "role": "QA_MANAGER",
 *   "status": "approved",
 *   "approvedAt": "2026-02-25T15:30:00Z",
 *   "notes": "Approved for customer testing",
 *   "signature": "digital-signature-data"
 * }
 */
router.post('/sign-off', authenticateJWT, requirePermission('validation:sign-off'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = ApprovalSignOffSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid approval data',
        details: validationResult.error.errors
      })
    }

    const generator = createGenerator(req)
    const approval: ApprovalSignOff = validationResult.data as ApprovalSignOff

    await generator.recordApproval(approval)

    const history = await generator.getApprovalHistory()

    res.json({
      success: true,
      data: {
        approval,
        totalApprovals: history.length
      },
      meta: {
        endpoint: 'POST /api/validation/handoff/sign-off',
        timestamp: new Date().toISOString()
      }
    })

    logger.info('Approval recorded', { reviewer: approval.reviewer, role: approval.role })
  } catch (error) {
    logger.error('Error recording approval', { error })
    next(error)
  }
})

// ============================================================================
// GET /api/validation/handoff/sign-off/history
// ============================================================================

/**
 * Get approval history
 */
router.get('/sign-off/history', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const generator = createGenerator(req)
    const history = await generator.getApprovalHistory()

    res.json({
      success: true,
      data: history,
      meta: {
        endpoint: 'GET /api/validation/handoff/sign-off/history',
        timestamp: new Date().toISOString(),
        count: history.length
      }
    })
  } catch (error) {
    logger.error('Error fetching approval history', { error })
    next(error)
  }
})

// ============================================================================
// GET /api/validation/handoff/ready-for-customer
// ============================================================================

/**
 * Check readiness for customer testing
 */
router.get('/ready-for-customer', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const generator = createGenerator(req)
    const readiness = await generator.getReadinessStatus()
    const isReady = await generator.isReadyForCustomer()

    res.json({
      success: true,
      data: {
        isReady,
        readiness
      },
      meta: {
        endpoint: 'GET /api/validation/handoff/ready-for-customer',
        timestamp: new Date().toISOString()
      }
    })

    logger.info('Readiness check performed', { isReady })
  } catch (error) {
    logger.error('Error checking readiness', { error })
    next(error)
  }
})

// ============================================================================
// POST /api/validation/handoff/save
// ============================================================================

/**
 * Save generated report
 *
 * Optional body for custom options:
 * {
 *   "includeScreenshots": true,
 *   "includeMetrics": true,
 *   "includeSensitiveData": false
 * }
 */
router.post('/save', authenticateJWT, requirePermission('validation:edit'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const generator = createGenerator(req)

    // Validate options if provided
    let options: HandoffReportOptions | undefined
    if (Object.keys(req.body).length > 0) {
      const validationResult = HandoffReportOptionsSchema.safeParse(req.body)
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid report options',
          details: validationResult.error.errors
        })
      }
      options = validationResult.data
    }

    const report = await generator.generateReport(options)
    const reportId = await generator.saveReport(report)

    res.json({
      success: true,
      data: {
        reportId,
        message: 'Report saved successfully'
      },
      meta: {
        endpoint: 'POST /api/validation/handoff/save',
        timestamp: new Date().toISOString()
      }
    })

    logger.info('Report saved', { reportId })
  } catch (error) {
    logger.error('Error saving report', { error })
    next(error)
  }
})

// ============================================================================
// GET /api/validation/handoff/reports
// ============================================================================

/**
 * List all saved reports
 */
router.get('/reports', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const generator = createGenerator(req)
    const reports = await generator.listReports()

    res.json({
      success: true,
      data: reports,
      meta: {
        endpoint: 'GET /api/validation/handoff/reports',
        timestamp: new Date().toISOString(),
        count: reports.length
      }
    })
  } catch (error) {
    logger.error('Error listing reports', { error })
    next(error)
  }
})

// ============================================================================
// GET /api/validation/handoff/reports/:reportId
// ============================================================================

/**
 * Retrieve specific saved report
 */
router.get('/reports/:reportId', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params

    const generator = createGenerator(req)
    const report = await generator.getReport(reportId)

    res.json({
      success: true,
      data: report,
      meta: {
        endpoint: 'GET /api/validation/handoff/reports/:reportId',
        timestamp: new Date().toISOString(),
        reportId
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }

    logger.error('Error retrieving report', { error })
    next(error)
  }
})

// ============================================================================
// POST /api/validation/handoff/validate
// ============================================================================

/**
 * Validate report structure and data
 *
 * Body: Handoff report object to validate
 */
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const generator = createGenerator(req)
    const report = req.body

    const validation = await generator.validateReport(report)

    res.json({
      success: validation.valid,
      data: validation,
      meta: {
        endpoint: 'POST /api/validation/handoff/validate',
        timestamp: new Date().toISOString()
      }
    })

    if (!validation.valid) {
      logger.warn('Report validation failed', { errors: validation.errors })
    }
  } catch (error) {
    logger.error('Error validating report', { error })
    next(error)
  }
})

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router
