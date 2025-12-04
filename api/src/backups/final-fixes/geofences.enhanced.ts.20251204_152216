import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import { zodValidator } from '../middleware/zodValidator'

const router = express.Router()

router.use(authenticateJWT)
router.use(helmet()
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
})

const geofenceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  geometry: z.string(), // Simplified for example; in production, use a more complex validation for geometries
  type: z.enum(['circle', 'polygon']),
  radius: z.number().optional(),
  is_active: z.boolean(),
})

// GET /geofences
router.get(
  '/',
  requirePermission('geofence:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT 
          id,
          tenant_id,
          name,
          description,
          geometry,
          type,
          radius,
          is_active,
          created_at,
          updated_at 
        FROM geofences 
        WHERE tenant_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM geofences WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit),
        },
      })
    } catch (error) {
      console.error(`Get geofences error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /geofences/:id
router.get(
  '/:id',
  requirePermission('geofence:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          id,
          tenant_id,
          name,
          description,
          geometry,
          type,
          radius,
          is_active,
          created_at,
          updated_at 
        FROM geofences 
        WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Geofence not found` })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get geofence error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /geofences
router.post(
  '/',
  requirePermission('geofence:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'geofences' }),
  zodValidator(geofenceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const result = await pool.query(
        `INSERT INTO geofences (tenant_id, name, description, geometry, type, radius, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [req.user!.tenant_id, data.name, data.description, data.geometry, data.type, data.radius, data.is_active]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error(`Create geofence error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /geofences/:id
router.put(
  '/:id',
  requirePermission('geofence:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'geofences' }),
  zodValidator(geofenceSchema.partial(),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id
      const data = req.body
      const updates = Object.keys(data).map((key, index) => `${key} = $${index + 2}`).join(', ')
      const values = Object.values(data)

      const result = await pool.query(
        `UPDATE geofences SET ${updates} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return throw new NotFoundError("Geofence not found or not authorized to update")
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error(`Update geofence error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router