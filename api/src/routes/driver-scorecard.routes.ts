import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import driverScorecardService from '../services/driver-scorecard.service'
import pool from '../config/database'

const router = express.Router()
router.use(authenticateJWT)

// Scope validator for driver-specific endpoints
// Allows access if user is viewing their own driver record
async function validateDriverScope(req: AuthRequest): Promise<boolean> {
  const driverId = req.params.driverId
  const userId = req.user!.id

  try {
    // Check if the requested driverId belongs to the authenticated user
    const result = await pool.query(
      'SELECT id FROM drivers WHERE id = $1 AND user_id = $2',
      [driverId, userId]
    )

    return result.rows.length > 0
  } catch (error) {
    console.error('Driver scope validation error:', error)
    return false
  }
}

// GET /api/driver-scorecard/leaderboard - Get driver leaderboard
router.get(
  '/leaderboard',
  requirePermission('driver:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'driver_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { periodStart, periodEnd, limit = '50' } = req.query

      const leaderboard = await driverScorecardService.getLeaderboard(
        req.user!.tenant_id,
        periodStart ? new Date(periodStart as string) : undefined,
        periodEnd ? new Date(periodEnd as string) : undefined,
        parseInt(limit as string)
      )

      res.json(leaderboard)
    } catch (error) {
      console.error('Get leaderboard error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/driver-scorecard/driver/:driverId - Get driver scorecard
router.get(
  '/driver/:driverId',
  requirePermission('driver:view:own', { validateScope: validateDriverScope }),
  auditLog({ action: 'READ', resourceType: 'driver_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { driverId } = req.params
      const { periodStart, periodEnd } = req.query

      // Calculate score if not exists
      if (periodStart && periodEnd) {
        const score = await driverScorecardService.calculateDriverScore(
          driverId,
          req.user!.tenant_id,
          new Date(periodStart as string),
          new Date(periodEnd as string)
        )

        res.json(score)
      } else {
        res.status(400).json({ error: 'periodStart and periodEnd are required' })
      }
    } catch (error) {
      console.error('Get driver scorecard error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/driver-scorecard/driver/:driverId/history - Get score history
router.get(
  '/driver/:driverId/history',
  requirePermission('driver:view:own', { validateScope: validateDriverScope }),
  auditLog({ action: 'READ', resourceType: 'driver_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { driverId } = req.params
      const { months = '6' } = req.query

      const history = await driverScorecardService.getDriverScoreHistory(
        driverId,
        req.user!.tenant_id,
        parseInt(months as string)
      )

      res.json(history)
    } catch (error) {
      console.error('Get score history error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/driver-scorecard/driver/:driverId/achievements - Get achievements
router.get(
  '/driver/:driverId/achievements',
  requirePermission('driver:view:own', { validateScope: validateDriverScope }),
  auditLog({ action: 'READ', resourceType: 'driver_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { driverId } = req.params

      const achievements = await driverScorecardService.getDriverAchievements(
        driverId,
        req.user!.tenant_id
      )

      res.json(achievements)
    } catch (error) {
      console.error('Get achievements error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/driver-scorecard/calculate-all - Calculate all driver scores
router.post(
  '/calculate-all',
  requirePermission('report:generate:global'),
  auditLog({ action: 'UPDATE', resourceType: 'driver_scorecard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { periodStart, periodEnd } = req.body

      if (!periodStart || !periodEnd) {
        return res.status(400).json({ error: 'periodStart and periodEnd are required' })
      }

      await driverScorecardService.calculateAllDriverScores(
        req.user!.tenant_id,
        new Date(periodStart),
        new Date(periodEnd)
      )

      res.json({ message: 'Calculation started for all drivers' })
    } catch (error) {
      console.error('Calculate all scores error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
