import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { billingReportsService } from '../services/billing-reports'
import { logger } from '../utils/logger'

const router = express.Router()

// All routes require authentication
router.use(authenticateJWT)

/**
 * GET /api/billing-reports/monthly/:period
 * Generate comprehensive monthly billing report
 * Requires: report:view:global permission
 */
router.get('/monthly/:period',
  requirePermission('report:view:global'),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenant_id
    try {
      const { period } = req.params // Format: YYYY-MM

      if (!/^\d{4}-\d{2}$/.test(period)) {
        return res.status(400).json({
          error: 'Invalid period format. Use YYYY-MM format (e.g., 2025-11)'
        })
      }

      const report = await billingReportsService.generateMonthlyReport(tenantId, period)

      res.json({
        success: true,
        report
      })
    } catch (error: any) {
      logger.error('Failed to generate monthly billing report', {
        error: error.message,
        tenantId
      })
      res.status(500).json({ error: 'Failed to generate billing report' })
    }
  }
)

/**
 * GET /api/billing-reports/payroll-export/:period
 * Generate payroll system export
 * Requires: report:export:global permission
 */
router.get('/payroll-export/:period',
  requirePermission('report:export:global'),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenant_id
    try {
      const { period } = req.params

      if (!/^\d{4}-\d{2}$/.test(period)) {
        return res.status(400).json({
          error: 'Invalid period format. Use YYYY-MM format (e.g., 2025-11)'
        })
      }

      const payrollExport = await billingReportsService.generatePayrollExport(tenantId, period)

      res.json({
        success: true,
        data: payrollExport
      })
    } catch (error: any) {
      logger.error('Failed to generate payroll export', {
        error: error.message,
        tenantId
      })
      res.status(500).json({ error: 'Failed to generate payroll export' })
    }
  }
)

/**
 * GET /api/billing-reports/payroll-csv/:period
 * Download payroll export as CSV
 * Requires: report:export:global permission
 */
router.get('/payroll-csv/:period',
  requirePermission('report:export:global'),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenant_id
    try {
      const { period } = req.params

      if (!/^\d{4}-\d{2}$/.test(period)) {
        return res.status(400).json({
          error: 'Invalid period format. Use YYYY-MM format (e.g., 2025-11)'
        })
      }

      const csv = await billingReportsService.generatePayrollCSV(tenantId, period)

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="payroll-deductions-${period}.csv"`)
      res.send(csv)
    } catch (error: any) {
      logger.error('Failed to generate payroll CSV', {
        error: error.message,
        tenantId
      })
      res.status(500).json({ error: 'Failed to generate CSV export' })
    }
  }
)

/**
 * POST /api/billing-reports/mark-billed/:period
 * Mark charges as billed after payroll processing
 * Requires: report:generate:global permission
 */
router.post('/mark-billed/:period',
  requirePermission('report:generate:global'),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenant_id
    try {
      const { period } = req.params
      const { charge_ids } = req.body // Optional: specific charges to mark

      if (!/^\d{4}-\d{2}$/.test(period)) {
        return res.status(400).json({
          error: 'Invalid period format. Use YYYY-MM format (e.g., 2025-11)'
        })
      }

      const count = await billingReportsService.markChargesAsBilled(
        tenantId,
        period,
        charge_ids
      )

      res.json({
        success: true,
        message: `Marked ${count} charge(s) as billed`,
        count
      })
    } catch (error: any) {
      logger.error('Failed to mark charges as billed', {
        error: error.message,
        tenantId
      })
      res.status(500).json({ error: 'Failed to update charge status' })
    }
  }
)

export default router
