import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import costAnalysisService from '../services/cost-analysis.service'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/cost-analysis/summary - Get cost summary
router.get(
  '/summary',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'cost_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' })
      }

      const summary = await costAnalysisService.getCostSummary(
        req.user!.tenant_id,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      res.json(summary)
    } catch (error) {
      console.error('Get cost summary error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/cost-analysis/by-category - Get costs by category
router.get(
  '/by-category',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'cost_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' })
      }

      const costs = await costAnalysisService.getCostsByCategory(
        req.user!.tenant_id,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      res.json(costs)
    } catch (error) {
      console.error('Get costs by category error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/cost-analysis/by-vehicle - Get costs by vehicle
router.get(
  '/by-vehicle',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'cost_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' })
      }

      const costs = await costAnalysisService.getCostsByVehicle(
        req.user!.tenant_id,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      res.json(costs)
    } catch (error) {
      console.error('Get costs by vehicle error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/cost-analysis/forecast - Forecast costs
router.get(
  '/forecast',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'cost_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { category, months = '3' } = req.query

      const forecast = await costAnalysisService.forecastCosts(
        req.user!.tenant_id,
        category as string | null,
        parseInt(months as string)
      )

      res.json(forecast)
    } catch (error) {
      console.error('Forecast costs error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/cost-analysis/trends - Get cost trends
router.get(
  '/trends',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'cost_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { category, months = '12' } = req.query

      const trends = await costAnalysisService.getCostTrends(
        req.user!.tenant_id,
        category as string | null,
        parseInt(months as string)
      )

      res.json(trends)
    } catch (error) {
      console.error('Get cost trends error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/cost-analysis/anomalies - Get cost anomalies
router.get(
  '/anomalies',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'cost_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' })
      }

      const anomalies = await costAnalysisService.getAnomalies(
        req.user!.tenant_id,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      res.json(anomalies)
    } catch (error) {
      console.error('Get anomalies error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/cost-analysis/budget-status - Get budget status
router.get(
  '/budget-status',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'cost_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fiscalYear, fiscalQuarter } = req.query

      const status = await costAnalysisService.getBudgetStatus(
        req.user!.tenant_id,
        fiscalYear ? parseInt(fiscalYear as string) : undefined,
        fiscalQuarter ? parseInt(fiscalQuarter as string) : undefined
      )

      res.json(status)
    } catch (error) {
      console.error('Get budget status error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/cost-analysis/cost - Track a new cost
router.post(
  '/cost',
  requirePermission('report:generate:global'),
  auditLog({ action: 'CREATE', resourceType: 'cost_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const cost = await costAnalysisService.trackCost(req.user!.tenant_id, req.body)

      res.status(201).json(cost)
    } catch (error) {
      console.error('Track cost error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/cost-analysis/budget - Set budget allocation
router.post(
  '/budget',
  requirePermission('report:generate:global'),
  auditLog({ action: 'CREATE', resourceType: 'cost_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { category, amount, fiscalYear, fiscalQuarter } = req.body

      if (!category || !amount || !fiscalYear || !fiscalQuarter) {
        return res.status(400).json({
          error: 'category, amount, fiscalYear, and fiscalQuarter are required'
        })
      }

      await costAnalysisService.setBudgetAllocation(
        req.user!.tenant_id,
        category,
        parseFloat(amount),
        parseInt(fiscalYear),
        parseInt(fiscalQuarter)
      )

      res.json({ message: 'Budget allocation set successfully' })
    } catch (error) {
      console.error('Set budget allocation error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/cost-analysis/export - Export cost data
router.get(
  '/export',
  requirePermission('report:export:global'),
  auditLog({ action: 'READ', resourceType: 'cost_analysis' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' })
      }

      const csv = await costAnalysisService.exportCostData(
        req.user!.tenant_id,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=cost-analysis.csv')
      res.send(csv)
    } catch (error) {
      console.error('Export cost data error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
