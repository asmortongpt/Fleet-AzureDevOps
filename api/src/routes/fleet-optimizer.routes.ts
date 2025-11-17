import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import fleetOptimizerService from '../services/fleet-optimizer.service'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/fleet-optimizer/utilization-heatmap - Get utilization heatmap
router.get(
  '/utilization-heatmap',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'fleet_optimizer' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { periodStart, periodEnd } = req.query

      const heatmap = await fleetOptimizerService.getUtilizationHeatmap(
        req.user!.tenant_id,
        periodStart ? new Date(periodStart as string) : undefined,
        periodEnd ? new Date(periodEnd as string) : undefined
      )

      res.json(heatmap)
    } catch (error) {
      console.error('Get utilization heatmap error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fleet-optimizer/vehicle/:vehicleId - Get vehicle utilization
router.get(
  '/vehicle/:vehicleId',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'fleet_optimizer' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleId } = req.params
      const { periodStart, periodEnd } = req.query

      if (!periodStart || !periodEnd) {
        return res.status(400).json({ error: 'periodStart and periodEnd are required' })
      }

      const utilization = await fleetOptimizerService.analyzeVehicleUtilization(
        vehicleId,
        req.user!.tenant_id,
        new Date(periodStart as string),
        new Date(periodEnd as string)
      )

      res.json(utilization)
    } catch (error) {
      console.error('Get vehicle utilization error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fleet-optimizer/vehicle/:vehicleId/forecast - Predict utilization
router.get(
  '/vehicle/:vehicleId/forecast',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'fleet_optimizer' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleId } = req.params
      const { months = '3' } = req.query

      const forecast = await fleetOptimizerService.predictUtilization(
        vehicleId,
        req.user!.tenant_id,
        parseInt(months as string)
      )

      res.json(forecast)
    } catch (error) {
      console.error('Get utilization forecast error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fleet-optimizer/recommendations - Get recommendations
router.get(
  '/recommendations',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'fleet_optimizer' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.query

      const recommendations = await fleetOptimizerService.getRecommendations(
        req.user!.tenant_id,
        status as string | undefined
      )

      res.json(recommendations)
    } catch (error) {
      console.error('Get recommendations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/fleet-optimizer/recommendations/generate - Generate new recommendations
router.post(
  '/recommendations/generate',
  requirePermission('route:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'fleet_optimizer' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { periodStart, periodEnd } = req.body

      if (!periodStart || !periodEnd) {
        return res.status(400).json({ error: 'periodStart and periodEnd are required' })
      }

      const recommendations = await fleetOptimizerService.generateRecommendations(
        req.user!.tenant_id,
        new Date(periodStart),
        new Date(periodEnd)
      )

      res.json(recommendations)
    } catch (error) {
      console.error('Generate recommendations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fleet-optimizer/optimal-fleet-size - Calculate optimal fleet size
router.get(
  '/optimal-fleet-size',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'fleet_optimizer' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { avgDailyDemand = '50' } = req.query

      const result = await fleetOptimizerService.calculateOptimalFleetSize(
        req.user!.tenant_id,
        parseFloat(avgDailyDemand as string)
      )

      res.json(result)
    } catch (error) {
      console.error('Calculate optimal fleet size error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/fleet-optimizer/analyze-all - Analyze all vehicles
router.post(
  '/analyze-all',
  requirePermission('route:create:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'fleet_optimizer' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { periodStart, periodEnd } = req.body

      if (!periodStart || !periodEnd) {
        return res.status(400).json({ error: 'periodStart and periodEnd are required' })
      }

      await fleetOptimizerService.analyzeAllVehicles(
        req.user!.tenant_id,
        new Date(periodStart),
        new Date(periodEnd)
      )

      res.json({ message: 'Analysis started for all vehicles' })
    } catch (error) {
      console.error('Analyze all vehicles error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
