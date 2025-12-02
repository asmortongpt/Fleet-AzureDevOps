import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import executiveDashboardService from '../services/executive-dashboard.service'
import { cacheMiddleware } from '../middleware/cache'

const router = express.Router()
router.use(authenticateJWT)

/**
 * @openapi
 * /api/executive-dashboard/kpis:
 *   get:
 *     summary: Get all executive KPIs
 *     description: Returns comprehensive KPI metrics for the executive dashboard
 *     tags:
 *       - Executive Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPI data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalVehicles:
 *                   type: number
 *                 activeVehicles:
 *                   type: number
 *                 fleetUtilizationRate:
 *                   type: number
 *                 avgFuelEfficiency:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/kpis',
  requirePermission('report:view:global'),
  cacheMiddleware({ ttl: 30, varyByTenant: true, varyByUser: false }),
  auditLog({ action: 'READ', resourceType: 'executive_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const kpis = await executiveDashboardService.getKPIs(req.user!.tenant_id)
      res.json(kpis)
    } catch (error) {
      console.error('Get executive KPIs error:', error)
      res.status(500).json({ error: 'Failed to fetch KPIs' })
    }
  }
)

/**
 * @openapi
 * /api/executive-dashboard/trends:
 *   get:
 *     summary: Get time-series trend data
 *     description: Returns trend data for charts (utilization, costs, incidents, maintenance)
 *     tags:
 *       - Executive Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to retrieve trends for
 *     responses:
 *       200:
 *         description: Trend data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/trends',
  requirePermission('report:view:global'),
  cacheMiddleware({ ttl: 30, varyByTenant: true, varyByQuery: true, varyByUser: false }),
  auditLog({ action: 'READ', resourceType: 'executive_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30
      const trends = await executiveDashboardService.getTrends(req.user!.tenant_id, days)
      res.json(trends)
    } catch (error) {
      console.error('Get trends error:', error)
      res.status(500).json({ error: 'Failed to fetch trends' })
    }
  }
)

/**
 * @openapi
 * /api/executive-dashboard/insights:
 *   get:
 *     summary: Get AI-powered insights
 *     description: Returns AI-generated insights, recommendations, and anomaly detection
 *     tags:
 *       - Executive Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [warning, recommendation, insight, critical]
 *                   title:
 *                     type: string
 *                   message:
 *                     type: string
 *                   confidence:
 *                     type: number
 *                   actionable:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/insights',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'executive_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const insights = await executiveDashboardService.getAIInsights(req.user!.tenant_id)
      res.json(insights)
    } catch (error) {
      console.error('Get AI insights error:', error)
      res.status(500).json({ error: 'Failed to fetch AI insights' })
    }
  }
)

/**
 * @openapi
 * /api/executive-dashboard/alerts-summary:
 *   get:
 *     summary: Get critical alerts summary
 *     description: Returns summary of unacknowledged alerts by severity
 *     tags:
 *       - Executive Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alert summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/alerts-summary',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'executive_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const summary = await executiveDashboardService.getAlertsSummary(req.user!.tenant_id)
      res.json(summary)
    } catch (error) {
      console.error('Get alerts summary error:', error)
      res.status(500).json({ error: 'Failed to fetch alerts summary' })
    }
  }
)

/**
 * @openapi
 * /api/executive-dashboard/fleet-health:
 *   get:
 *     summary: Get overall fleet health score
 *     description: Returns comprehensive fleet health metrics with breakdown by category
 *     tags:
 *       - Executive Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fleet health score retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall:
 *                   type: number
 *                 mechanical:
 *                   type: number
 *                 safety:
 *                   type: number
 *                 compliance:
 *                   type: number
 *                 efficiency:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/fleet-health',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'executive_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const health = await executiveDashboardService.getFleetHealth(req.user!.tenant_id)
      res.json(health)
    } catch (error) {
      console.error('Get fleet health error:', error)
      res.status(500).json({ error: 'Failed to fetch fleet health' })
    }
  }
)

/**
 * @openapi
 * /api/executive-dashboard/cost-analysis:
 *   get:
 *     summary: Get cost analysis and breakdown
 *     description: Returns detailed cost analysis with breakdown by category and trends
 *     tags:
 *       - Executive Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cost analysis retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/cost-analysis',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'executive_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const costs = await executiveDashboardService.getCostAnalysis(req.user!.tenant_id)
      res.json(costs)
    } catch (error) {
      console.error('Get cost analysis error:', error)
      res.status(500).json({ error: 'Failed to fetch cost analysis' })
    }
  }
)

export default router
