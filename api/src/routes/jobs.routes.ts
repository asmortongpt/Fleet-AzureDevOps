/**
 * Jobs Routes (Operations Hub)
 *
 * Frontend OperationsHubDrilldowns calls /api/jobs and /api/jobs?filter=...
 * There is no dedicated "jobs" table for fleet operations jobs.
 * This route returns an empty array gracefully so the UI renders
 * an empty state instead of a 404 error.
 */

import express, { Response } from 'express'

import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// GET /jobs — list operations jobs (returns empty array — no jobs table)
router.get(
  '/',
  requirePermission('vehicle:view:fleet'),
  async (_req: AuthRequest, res: Response) => {
    res.json([])
  }
)

// GET /jobs/:id — single job detail
router.get(
  '/:id',
  requirePermission('vehicle:view:fleet'),
  async (_req: AuthRequest, res: Response) => {
    res.status(404).json({ success: false, error: 'Job not found' })
  }
)

export default router
