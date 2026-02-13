import express, { Response } from 'express'

import { pool } from '../db/connection'
import { NotFoundError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'

const router = express.Router()

router.use(authenticateJWT)

// GET /api/tenants/:id - tenant details for current user
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id

    if (!tenantId || id !== tenantId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const result = await pool.query(
      `SELECT id, name, domain, billing_email, subscription_tier, settings, is_active, created_at, updated_at
       FROM tenants
       WHERE id = $1`,
      [tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Tenant not found')
    }

    const row = result.rows[0]
    const settings = row.settings || {}

      res.json({
      data: {
        id: row.id,
        name: row.name,
        domain: row.domain,
        status: row.is_active ? 'active' : 'suspended',
        plan: row.subscription_tier || 'standard',
        max_users: settings.max_users ?? settings.maxUsers ?? 0,
        max_vehicles: settings.max_vehicles ?? settings.maxVehicles ?? 0,
        features: settings.features || [],
        settings,
        billing_email: row.billing_email,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    })
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message })
    }
    return res.status(500).json({ error: 'Failed to fetch tenant' })
  }
})

export default router
