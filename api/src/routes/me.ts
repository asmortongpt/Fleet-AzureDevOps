import express, { Response } from 'express'

import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { getUserPermissions } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// GET /api/v1/me/permissions
router.get('/permissions', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const permissions = await getUserPermissions(userId)
  res.json({ data: Array.from(permissions) })
})

export default router

