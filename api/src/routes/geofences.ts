import express, { Response } from 'express'

import logger from '../config/logger'
import { container } from '../container'
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { GeofenceRepository } from '../repositories/GeofenceRepository'
import { TYPES } from '../types'

const router = express.Router()
router.use(authenticateJWT)

// GET /geofences
router.get(
  '/',
  requirePermission('geofence:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const repository = container.get<GeofenceRepository>(TYPES.GeofenceRepository)
      const { page = 1, limit = 50, sortBy, sortOrder } = req.query

      const context = {
        userId: req.user!.id.toString(),
        tenantId: req.user!.tenant_id.toString()
      }

      const result = await repository.findAllPaginated(context, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC'
      })

      res.json(result)
    } catch (error) {
      logger.error('Get geofences error:', error)
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
      const repository = container.get<GeofenceRepository>(TYPES.GeofenceRepository)

      const context = {
        userId: req.user!.id.toString(),
        tenantId: req.user!.tenant_id.toString()
      }

      const geofence = await repository.findById(Number(req.params.id), context)

      if (!geofence) {
        return res.status(404).json({ error: 'Geofence not found' })
      }

      res.json(geofence)
    } catch (error) {
      logger.error('Get geofence error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /geofences
router.post(
  '/',
  csrfProtection,
  requirePermission('geofence:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const repository = container.get<GeofenceRepository>(TYPES.GeofenceRepository)

      const context = {
        userId: req.user!.id.toString(),
        tenantId: req.user!.tenant_id.toString()
      }

      // Remove id and tenant_id from body if present (will be set by repository)
      const { id, tenant_id, ...data } = req.body

      const geofence = await repository.create(data, context)

      res.status(201).json(geofence)
    } catch (error) {
      logger.error('Create geofence error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /geofences/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('geofence:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const repository = container.get<GeofenceRepository>(TYPES.GeofenceRepository)

      const context = {
        userId: req.user!.id.toString(),
        tenantId: req.user!.tenant_id.toString()
      }

      // Remove id and tenant_id from body if present
      const { id, tenant_id, ...data } = req.body

      const geofence = await repository.update(Number(req.params.id), data, context)

      res.json(geofence)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: 'Geofence not found' })
      }
      logger.error('Update geofence error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /geofences/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('geofence:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const repository = container.get<GeofenceRepository>(TYPES.GeofenceRepository)

      const context = {
        userId: req.user!.id.toString(),
        tenantId: req.user!.tenant_id.toString()
      }

      await repository.delete(Number(req.params.id), context)

      res.json({ message: 'Geofence deleted successfully' })
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: 'Geofence not found' })
      }
      logger.error('Delete geofence error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
