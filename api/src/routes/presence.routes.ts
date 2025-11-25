import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { getErrorMessage } from '../utils/error-handler'
import {
  getPresence,
  setPresence,
  getBatchPresence,
  getDriverAvailability,
  getAllDriversAvailability,
  findAvailableDrivers,
  getIntelligentRoutingSuggestion
} from '../services/presence.service'

const router = express.Router()

/**
 * GET /api/presence/:userId
 * Get presence information for a specific user
 */
router.get('/:userId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const presence = await getPresence(userId)

    res.json({
      success: true,
      presence
    })
  } catch (error: any) {
    console.error('Error fetching user presence:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * POST /api/presence
 * Set presence status for the current user
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userId, availability, activity, expirationDuration, statusMessage } = req.body

    if (!userId || !availability || !activity) {
      return res.status(400).json({
        error: 'Missing required fields: userId, availability, activity'
      })
    }

    await setPresence(userId, availability, activity, expirationDuration, statusMessage)

    res.json({
      success: true,
      message: 'Presence updated successfully'
    })
  } catch (error: any) {
    console.error('Error setting user presence:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * GET /api/presence/batch
 * Get presence for multiple users
 */
router.get('/batch/users', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userIds } = req.query

    if (!userIds) {
      return res.status(400).json({ error: 'Missing required query parameter: userIds' })
    }

    const userIdList = (userIds as string).split(',')

    const presences = await getBatchPresence(userIdList)

    res.json({
      success: true,
      count: presences.length,
      presences
    })
  } catch (error: any) {
    console.error('Error fetching batch presence:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * GET /api/presence/driver/:driverId
 * Get driver availability
 */
router.get('/driver/:driverId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params

    const availability = await getDriverAvailability(driverId)

    res.json({
      success: true,
      driverId,
      ...availability
    })
  } catch (error: any) {
    console.error('Error fetching driver availability:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * GET /api/presence/drivers
 * Get availability for all drivers
 */
router.get('/drivers/all', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenant_id

    const drivers = await getAllDriversAvailability(tenantId)

    res.json({
      success: true,
      count: drivers.length,
      drivers
    })
  } catch (error: any) {
    console.error('Error fetching all drivers availability:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * GET /api/presence/drivers/available
 * Get only available drivers
 */
router.get('/drivers/available', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenant_id

    const availableDrivers = await findAvailableDrivers(tenantId)

    res.json({
      success: true,
      count: availableDrivers.length,
      drivers: availableDrivers
    })
  } catch (error: any) {
    console.error('Error fetching available drivers:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * POST /api/presence/intelligent-routing
 * Get intelligent routing suggestion based on presence
 */
router.post('/intelligent-routing', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { taskPriority, candidateUserIds } = req.body

    if (!taskPriority || !candidateUserIds || !Array.isArray(candidateUserIds)) {
      return res.status(400).json({
        error: 'Missing required fields: taskPriority, candidateUserIds (array)'
      })
    }

    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (!validPriorities.includes(taskPriority)) {
      return res.status(400).json({
        error: 'Invalid priority. Must be one of: ${validPriorities.join(', ')}'
      })
    }

    const suggestion = await getIntelligentRoutingSuggestion(taskPriority, candidateUserIds)

    res.json({
      success: true,
      suggestion
    })
  } catch (error: any) {
    console.error('Error getting intelligent routing suggestion:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

/**
 * POST /api/presence/subscribe
 * Subscribe to presence updates (webhook)
 */
router.post('/subscribe', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { userIds, webhookUrl } = req.body

    if (!userIds || !Array.isArray(userIds) || !webhookUrl) {
      return res.status(400).json({
        error: 'Missing required fields: userIds (array), webhookUrl'
      })
    }

    // Note: This would require proper webhook setup
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Presence subscription created',
      note: 'Webhook subscriptions require proper Azure configuration'
    })
  } catch (error: any) {
    console.error('Error creating presence subscription:', getErrorMessage(error))
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

export default router
