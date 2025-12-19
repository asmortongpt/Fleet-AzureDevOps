import { Router } from "express"
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { cacheService } from '../config/cache'; // Wave 13: Add Redis caching
import { maintenanceCreateSchema, maintenanceUpdateSchema } from '../schemas/maintenance.schema';
import { validate } from '../middleware/validate';
import logger from '../config/logger'; // Wave 11: Add Winston logger
import { maintenanceRecordEmulator } import { TenantValidator } from '../utils/tenant-validator';

const router = Router()
const validator = new TenantValidator(db);

// GET all maintenance records
router.get("/", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  try {
    const {
      page = 1,
      pageSize = 20,
      search,
      serviceType,
      status,
      category,
      vehicleNumber,
      startDate,
      endDate
    } = req.query

    // Wave 13: Cache-aside pattern
    const cacheKey = `maintenance:list:${page}:${pageSize}:${search || ''}:${serviceType || ''}:${status || ''}:${category || ''}:${vehicleNumber || ''}:${startDate || ''}:${endDate || ''}`
    const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey)

    if (cached) {
      return res.json(cached)
    }

    let records = maintenanceRecordEmulator.getAll()

    // Apply search filter
    if (search && typeof search === 'string') {
      records = maintenanceRecordEmulator.search(search)
    }

    // Apply service type filter
    if (serviceType && typeof serviceType === 'string') {
      records = maintenanceRecordEmulator.filterByServiceType(serviceType)
    }

    // Apply status filter
    if (status && typeof status === 'string') {
      records = maintenanceRecordEmulator.filterByStatus(status)
    }

    // Apply category filter
    if (category && typeof category === 'string') {
      records = maintenanceRecordEmulator.filterByCategory(category)
    }

    // Apply vehicle number filter
    if (vehicleNumber && typeof vehicleNumber === 'string') {
      records = maintenanceRecordEmulator.filterByVehicle(vehicleNumber)
    }

    // Apply date range filter
    if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      records = maintenanceRecordEmulator.filterByDateRange(
        new Date(startDate),
        new Date(endDate)
      )
    }

    // Apply pagination
    const total = records.length
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = records.slice(offset, offset + Number(pageSize)

    const result = { data, total }

    // Cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, result, 300)

    res.json(result)
  } catch (error) {
    logger.error('Failed to fetch maintenance records', { error }) // Wave 11: Winston logger
    res.status(500).json({ error: "Failed to fetch maintenance records" })
  }
})

// GET maintenance record by ID
router.get("/:id", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  try {
    // Wave 13: Cache-aside pattern for single record
    const cacheKey = `maintenance:${req.params.id}`
    const cached = await cacheService.get<any>(cacheKey)

    if (cached) {
      return res.json({ data: cached })
    }

    const record = maintenanceRecordEmulator.getById(Number(req.params.id)
    if (!record) return throw new NotFoundError("Maintenance record not found")

    // Cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, record, 600)

    res.json({ data: record })
  } catch (error) {
    logger.error('Failed to fetch maintenance record', { error, recordId: req.params.id }) // Wave 11: Winston logger
    res.status(500).json({ error: "Failed to fetch maintenance record" })
  }
})

// GET maintenance records by vehicle ID
router.get("/vehicle/:vehicleId", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  try {
    // Wave 13: Cache-aside pattern for vehicle maintenance records
    const cacheKey = `maintenance:vehicle:${req.params.vehicleId}`
    const cached = await cacheService.get<{ data: any[], total: number }>(cacheKey)

    if (cached) {
      return res.json(cached)
    }

    const records = maintenanceRecordEmulator.getByVehicleId(Number(req.params.vehicleId)
    const result = { data: records, total: records.length }

    // Cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, result, 600)

    res.json(result)
  } catch (error) {
    logger.error('Failed to fetch vehicle maintenance records', { error, vehicleId: req.params.vehicleId }) // Wave 11: Winston logger
    res.status(500).json({ error: "Failed to fetch vehicle maintenance records" })
  }
})

// POST create maintenance record
router.post("/", validate(maintenanceCreateSchema), async (req, res) => { // Wave 8: Add Zod validation
  try {
    const record = maintenanceRecordEmulator.create(req.body)
    res.status(201).json({ data: record })
  } catch (error) {
    logger.error('Failed to create maintenance record', { error }) // Wave 11: Winston logger
    res.status(500).json({ error: "Failed to create maintenance record" })
  }
})

// PUT update maintenance record
router.put("/:id", validate(maintenanceUpdateSchema), async (req, res) => { // Wave 8: Add Zod validation
  try {
    const record = maintenanceRecordEmulator.update(Number(req.params.id), req.body)

    // SECURITY: IDOR Protection - Validate foreign keys belong to tenant
    const { vehicle_id, work_order_id } = data

    if (vehicle_id && !(await validator.validateVehicle(vehicle_id, req.user!.tenant_id)) {
      return res.status(403).json({
        success: false,
        error: 'Vehicle Id not found or access denied'
      })
    }
    if (work_order_id && !(await validator.validateWorkOrder(work_order_id, req.user!.tenant_id)) {
      return res.status(403).json({
        success: false,
        error: 'Work Order Id not found or access denied'
      })
    }
    if (!record) return throw new NotFoundError("Maintenance record not found")

    // Wave 13: Invalidate cache on update
    const cacheKey = `maintenance:${req.params.id}`
    await cacheService.del(cacheKey)

    res.json({ data: record })
  } catch (error) {
    logger.error('Failed to update maintenance record', { error, recordId: req.params.id }) // Wave 11: Winston logger
    res.status(500).json({ error: "Failed to update maintenance record" })
  }
})

// DELETE maintenance record
router.delete("/:id", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  try {
    const deleted = maintenanceRecordEmulator.delete(Number(req.params.id)
    if (!deleted) return throw new NotFoundError("Maintenance record not found")

    // Wave 13: Invalidate cache on delete
    const cacheKey = `maintenance:${req.params.id}`
    await cacheService.del(cacheKey)

    res.json({ message: "Maintenance record deleted successfully" })
  } catch (error) {
    logger.error('Failed to delete maintenance record', { error, recordId: req.params.id }) // Wave 11: Winston logger
    res.status(500).json({ error: "Failed to delete maintenance record" })
  }
})

export default router

// IDOR Protection for UPDATE
router.put('/:id', validate(maintenanceUpdateSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  // Validate ownership before update
  const validator = new TenantValidator(pool);
  const isValid = await validator.validateOwnership(tenantId, 'maintenance', parseInt(id);

  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: 'Access denied - resource not found or belongs to different tenant'
    });
  }

  // Proceed with update...
  const data = req.body;
  // ... existing update logic
});

// IDOR Protection for DELETE
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  // Validate ownership before delete
  const validator = new TenantValidator(pool);
  const isValid = await validator.validateOwnership(tenantId, 'maintenance', parseInt(id);

  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: 'Access denied - resource not found or belongs to different tenant'
    });
  }

  // Proceed with soft delete...
  // ... existing delete logic
});
