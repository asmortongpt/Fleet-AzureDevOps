import { Router } from "express"
import { maintenanceCreateSchema, maintenanceUpdateSchema } from '../schemas/maintenance.schema';
import { validate } from '../middleware/validate';
import logger from '../config/logger'; // Wave 11: Add Winston logger
import { maintenanceRecordEmulator } from "../emulators/MaintenanceRecordEmulator"
import { TenantValidator } from '../utils/tenant-validator';

const router = Router()
const validator = new TenantValidator(db);

// GET all maintenance records
router.get("/", async (req, res) => {
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
    const data = records.slice(offset, offset + Number(pageSize))

    res.json({ data, total })
  } catch (error) {
    logger.error('Failed to fetch maintenance records', { error }) // Wave 11: Winston logger
    res.status(500).json({ error: "Failed to fetch maintenance records" })
  }
})

// GET maintenance record by ID
router.get("/:id", async (req, res) => {
  try {
    const record = maintenanceRecordEmulator.getById(Number(req.params.id))
    if (!record) return res.status(404).json({ error: "Maintenance record not found" })
    res.json({ data: record })
  } catch (error) {
    logger.error('Failed to fetch maintenance record', { error, recordId: req.params.id }) // Wave 11: Winston logger
    res.status(500).json({ error: "Failed to fetch maintenance record" })
  }
})

// GET maintenance records by vehicle ID
router.get("/vehicle/:vehicleId", async (req, res) => {
  try {
    const records = maintenanceRecordEmulator.getByVehicleId(Number(req.params.vehicleId))
    res.json({ data: records, total: records.length })
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

    if (vehicle_id && !(await validator.validateVehicle(vehicle_id, req.user!.tenant_id))) {
      return res.status(403).json({
        success: false,
        error: 'Vehicle Id not found or access denied'
      })
    }
    if (work_order_id && !(await validator.validateWorkOrder(work_order_id, req.user!.tenant_id))) {
      return res.status(403).json({
        success: false,
        error: 'Work Order Id not found or access denied'
      })
    }
    if (!record) return res.status(404).json({ error: "Maintenance record not found" })
    res.json({ data: record })
  } catch (error) {
    logger.error('Failed to update maintenance record', { error, recordId: req.params.id }) // Wave 11: Winston logger
    res.status(500).json({ error: "Failed to update maintenance record" })
  }
})

// DELETE maintenance record
router.delete("/:id", async (req, res) => {
  try {
    const deleted = maintenanceRecordEmulator.delete(Number(req.params.id))
    if (!deleted) return res.status(404).json({ error: "Maintenance record not found" })
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
  const isValid = await validator.validateOwnership(tenantId, 'maintenance', parseInt(id));

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
  const isValid = await validator.validateOwnership(tenantId, 'maintenance', parseInt(id));

  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: 'Access denied - resource not found or belongs to different tenant'
    });
  }

  // Proceed with soft delete...
  // ... existing delete logic
});
