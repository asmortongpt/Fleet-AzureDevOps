import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { billingReportsService } from '../services/billing-reports'
import { logger } from '../utils/logger'
import { getErrorMessage } from '../utils/error-handler'
import { z } from 'zod'

const router = express.Router()

router.use(authenticateJWT)
router.use(express.json())

const periodSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid period format. Use YYYY-MM format (e.g., 2025-11)')
}))

router.get('/monthly/:period',
  requirePermission('report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { period } = periodSchema.parse(req.params)
      const tenantId = req.user!.tenant_id

      const report = await billingReportsService.generateMonthlyReport(tenantId, period)

      res.json({ success: true, report }))
    } catch (error: any) {
      logger.error('Failed to generate monthly billing report', {
        error: getErrorMessage(error),
        tenantId: req.user!.tenant_id,
      }))
      res.status(500).json({ error: 'Failed to generate billing report' }))
    }
  }
)

router.get('/payroll-export/:period',
  requirePermission('report:export:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { period } = periodSchema.parse(req.params)
      const tenantId = req.user!.tenant_id

      const payrollExport = await billingReportsService.generatePayrollExport(tenantId, period)

      res.json({ success: true, data: payrollExport }))
    } catch (error: any) {
      logger.error('Failed to generate payroll export', {
        error: getErrorMessage(error),
        tenantId: req.user!.tenant_id,
      }))
      res.status(500).json({ error: 'Failed to generate payroll export' }))
    }
  }
)

router.get('/payroll-csv/:period',
  requirePermission('report:export:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { period } = periodSchema.parse(req.params)
      const tenantId = req.user!.tenant_id

      const csv = await billingReportsService.generatePayrollCSV(tenantId, period)

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="payroll_${period}.csv"`)
      res.send(csv)
    } catch (error: any) {
      logger.error('Failed to generate payroll CSV', {
        error: getErrorMessage(error),
        tenantId: req.user!.tenant_id,
      }))
      res.status(500).json({ error: 'Failed to download payroll CSV' }))
    }
  }
)

export default router