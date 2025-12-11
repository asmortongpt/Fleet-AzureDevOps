import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import { z } from 'zod'
import { ApiResponse } from '../utils/apiResponse'
import { validate } from '../middleware/validation'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination'
import { cache, cacheMiddleware } from '../utils/cache'
import { csrfProtection } from '../middleware/csrf'
import { VehiclesRepository } from '../repositories/vehiclesRepository'
import { DriversRepository } from '../repositories/driversRepository'
import { MaintenanceRepository } from '../repositories/maintenanceRepository'
import { FuelRepository } from '../repositories/fuelRepository'
import { LocationRepository } from '../repositories/locationRepository'
import { TelemetryRepository } from '../repositories/telemetryRepository'
import { UsageRepository } from '../repositories/usageRepository'

const router = express.Router()
router.use(authenticateJWT)

// Initialize the repositories
const vehiclesRepository = new VehiclesRepository()
const driversRepository = new DriversRepository()
const maintenanceRepository = new MaintenanceRepository()
const fuelRepository = new FuelRepository()
const locationRepository = new LocationRepository()
const telemetryRepository = new TelemetryRepository()
const usageRepository = new UsageRepository()

// GET /vehicles - Cache for 5 minutes (300 seconds)
router.get(
  '/',
  requirePermission('vehicle:view:team'),
  applyFieldMasking('vehicle'),
  cacheMiddleware(300),
  auditLog({ action: 'READ', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const paginationParams = getPaginationParams(req)
      const vehicles = await vehiclesRepository.getAllVehicles(req.user!.tenant_id, paginationParams)
      const paginatedResponse = createPaginatedResponse(vehicles, paginationParams)
      return ApiResponse.success(res, paginatedResponse)
    } catch (error) {
      console.error('Get vehicles error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve vehicles')
    }
  }
)

// GET /vehicles/:id - Cache for 10 minutes (600 seconds)
router.get(
  '/:id',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('vehicle'),
  cacheMiddleware(600),
  auditLog({ action: 'READ', resourceType: 'vehicles' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicle = await vehiclesRepository.getVehicleById(req.params.id, req.user!.tenant_id)
      if (!vehicle) {
        return ApiResponse.notFound(res, 'Vehicle not found')
      }
      return ApiResponse.success(res, vehicle)
    } catch (error) {
      console.error('Get vehicle by id error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve vehicle')
    }
  }
)

// POST /vehicles
router.post(
  '/',
  csrfProtection,
  requirePermission('vehicle:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      // ... validation logic

      const newVehicle = await vehiclesRepository.createVehicle(data, req.user!.tenant_id)

      // Invalidate cache on create
      await cache.delPattern(`route:/api/vehicles*`)

      return ApiResponse.created(res, newVehicle)
    } catch (error) {
      console.error('Create vehicle error:', error)
      return ApiResponse.serverError(res, 'Failed to create vehicle')
    }
  }
)

// PUT /vehicles/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('vehicle:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      // ... validation logic

      const updatedVehicle = await vehiclesRepository.updateVehicle(req.params.id, data, req.user!.tenant_id)

      if (!updatedVehicle) {
        return ApiResponse.notFound(res, 'Vehicle not found')
      }

      // Invalidate cache on update
      await cache.delPattern(`route:/api/vehicles*`)
      await cache.del(cache.getCacheKey(req.user!.tenant_id, 'vehicle', req.params.id))

      return ApiResponse.success(res, updatedVehicle)
    } catch (error) {
      console.error('Update vehicle error:', error)
      return ApiResponse.serverError(res, 'Failed to update vehicle')
    }
  }
)

// DELETE /vehicles/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('vehicle:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // ... status check logic

      const deletedVehicleId = await vehiclesRepository.deleteVehicle(req.params.id, req.user!.tenant_id)

      if (!deletedVehicleId) {
        return ApiResponse.notFound(res, 'Vehicle not found')
      }

      // Invalidate cache on delete
      await cache.delPattern(`route:/api/vehicles*`)
      await cache.del(cache.getCacheKey(req.user!.tenant_id, 'vehicle', req.params.id))

      return ApiResponse.success(res, { message: 'Vehicle deleted successfully' })
    } catch (error) {
      console.error('Delete vehicle error:', error)
      return ApiResponse.serverError(res, 'Failed to delete vehicle')
    }
  }
)

// GET /vehicles/:id/drivers
router.get(
  '/:id/drivers',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('driver'),
  cacheMiddleware(300),
  auditLog({ action: 'READ', resourceType: 'drivers' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const drivers = await driversRepository.getDriversByVehicleId(req.params.id, req.user!.tenant_id)
      return ApiResponse.success(res, drivers)
    } catch (error) {
      console.error('Get drivers by vehicle id error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve drivers')
    }
  }
)

// GET /vehicles/:id/maintenance
router.get(
  '/:id/maintenance',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('maintenance'),
  cacheMiddleware(300),
  auditLog({ action: 'READ', resourceType: 'maintenance' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const maintenanceRecords = await maintenanceRepository.getMaintenanceByVehicleId(req.params.id, req.user!.tenant_id)
      return ApiResponse.success(res, maintenanceRecords)
    } catch (error) {
      console.error('Get maintenance by vehicle id error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve maintenance records')
    }
  }
)

// GET /vehicles/:id/fuel
router.get(
  '/:id/fuel',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('fuel'),
  cacheMiddleware(300),
  auditLog({ action: 'READ', resourceType: 'fuel' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const fuelRecords = await fuelRepository.getFuelByVehicleId(req.params.id, req.user!.tenant_id)
      return ApiResponse.success(res, fuelRecords)
    } catch (error) {
      console.error('Get fuel by vehicle id error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve fuel records')
    }
  }
)

// GET /vehicles/:id/location
router.get(
  '/:id/location',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('location'),
  cacheMiddleware(300),
  auditLog({ action: 'READ', resourceType: 'location' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const location = await locationRepository.getLocationByVehicleId(req.params.id, req.user!.tenant_id)
      return ApiResponse.success(res, location)
    } catch (error) {
      console.error('Get location by vehicle id error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve location')
    }
  }
)

// GET /vehicles/:id/telemetry
router.get(
  '/:id/telemetry',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('telemetry'),
  cacheMiddleware(300),
  auditLog({ action: 'READ', resourceType: 'telemetry' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const telemetryData = await telemetryRepository.getTelemetryByVehicleId(req.params.id, req.user!.tenant_id)
      return ApiResponse.success(res, telemetryData)
    } catch (error) {
      console.error('Get telemetry by vehicle id error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve telemetry data')
    }
  }
)

// GET /vehicles/:id/usage
router.get(
  '/:id/usage',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('usage'),
  cacheMiddleware(300),
  auditLog({ action: 'READ', resourceType: 'usage' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    try {
      const usageData = await usageRepository.getUsageByVehicleId(req.params.id, req.user!.tenant_id)
      return ApiResponse.success(res, usageData)
    } catch (error) {
      console.error('Get usage by vehicle id error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve usage data')
    }
  }
)

export default router