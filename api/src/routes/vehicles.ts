import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import { z } from 'zod'
import { createVehicleSchema, updateVehicleSchema } from '../validation/schemas'
import vehiclesService from '../services/vehicles.service'
import { cacheMiddleware, CacheStrategies, invalidateOnWrite } from '../middleware/cache'

const router = express.Router()
router.use(authenticateJWT)

// GET /vehicles (CACHED: 60 seconds, vary by tenant and query params)
router.get(
  '/',
  requirePermission('vehicle:view:team'),
  cacheMiddleware({ ttl: 60, varyByTenant: true, varyByQuery: true, varyByUser: true }),
  applyFieldMasking('vehicle'),
  auditLog({ action: 'READ', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        asset_category,
        asset_type,
        power_type,
        operational_status,
        primary_metric,
        is_road_legal,
        location_id,
        group_id,
        fleet_id
      } = req.query

      const result = await vehiclesService.getVehicles(
        req.user!.tenant_id,
        req.user!.id,
        {
          page: Number(page),
          limit: Number(limit),
          asset_category: asset_category as string,
          asset_type: asset_type as string,
          power_type: power_type as string,
          operational_status: operational_status as string,
          primary_metric: primary_metric as string,
          is_road_legal: is_road_legal as string,
          location_id: location_id as string,
          group_id: group_id as string,
          fleet_id: fleet_id as string
        }
      )

      res.json(result)
    } catch (error) {
      console.error('Get vehicles error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /vehicles/:id (CACHED: 60 seconds, user-specific)
router.get(
  '/:id',
  requirePermission('vehicle:view:own'),
  cacheMiddleware({ ttl: 60, varyByUser: true, varyByTenant: true }),
  applyFieldMasking('vehicle'),
  auditLog({ action: 'READ', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicle = await vehiclesService.getVehicleById(
        req.params.id,
        req.user!.tenant_id,
        req.user!.id
      )

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' })
      }

      res.json(vehicle)
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        return res.status(403).json({ error: error.message })
      }
      console.error('Get vehicle error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /vehicles (Invalidates vehicle cache on success)
router.post(
  '/',
  requirePermission('vehicle:create:global'),
  invalidateOnWrite('vehicles'),
  auditLog({ action: 'CREATE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate and filter input data
      const validatedData = createVehicleSchema.parse(req.body)

      const vehicle = await vehiclesService.createVehicle(req.user!.tenant_id, validatedData)

      res.status(201).json(vehicle)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      if (error.message?.includes('VIN already exists')) {
        return res.status(409).json({ error: error.message })
      }
      console.error('Create vehicle error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /vehicles/:id (Invalidates vehicle cache on success)
router.put(
  '/:id',
  requirePermission('vehicle:update:global'),
  invalidateOnWrite('vehicles'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate and filter input data
      const validatedData = updateVehicleSchema.parse(req.body)

      const vehicle = await vehiclesService.updateVehicle(
        req.params.id,
        req.user!.tenant_id,
        validatedData
      )

      res.json(vehicle)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      if (error.message?.includes('not found')) {
        return res.status(404).json({ error: 'Vehicle not found' })
      }
      console.error('Update vehicle error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /vehicles/:id (Invalidates vehicle cache on success)
router.delete(
  '/:id',
  requirePermission('vehicle:delete:global'),
  invalidateOnWrite('vehicles'),
  auditLog({ action: 'DELETE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      await vehiclesService.deleteVehicle(req.params.id, req.user!.tenant_id)

      res.json({ message: 'Vehicle deleted successfully' })
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return res.status(404).json({ error: 'Vehicle not found' })
      }
      if (error.message?.includes('can only be deleted')) {
        return res.status(403).json({ error: error.message })
      }
      console.error('Delete vehicle error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
