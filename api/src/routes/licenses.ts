/**
 * Licenses Routes
 *
 * Software license management endpoints.
 * Frontend expects: GET /api/licenses returning License[]
 * No database table exists yet — returns empty data with proper envelope.
 */

import express, { Response } from 'express'

import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = express.Router()
router.use(authenticateJWT)

// GET /licenses — list all software licenses for tenant
router.get(
  '/',
  async (req: AuthRequest, res: Response) => {
    try {
      // No licenses table exists — return empty array with proper shape
      res.json({
        success: true,
        data: []
      })
    } catch (error) {
      logger.error('Get licenses error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

// GET /licenses/:id — get single license
router.get(
  '/:id',
  async (req: AuthRequest, res: Response) => {
    try {
      res.status(404).json({
        success: false,
        error: 'License not found'
      })
    } catch (error) {
      logger.error('Get license error:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
)

export default router
