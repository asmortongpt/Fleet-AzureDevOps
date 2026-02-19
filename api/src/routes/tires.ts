/**
 * Tire Management API Routes
 * Complete REST API for tire lifecycle tracking, rotation scheduling, and analytics
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import logger from '../config/logger';
import { authenticateJWT } from '../middleware/auth';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import { tireRotationService } from '../services/tire-rotation';
import { tireAnalyticsService } from '../services/tire-analytics';
import {
  TireInventory,
  CreateTireInventoryInput,
  UpdateTireInventoryInput,
  MountTireInput,
  UnmountTireInput,
  RotateTiresInput,
  CreateTireInspectionInput,
  CreatePressureLogInput,
  TireInventoryQuery,
  TireStatus,
  TireType,
  RemovalReason,
  RotationPattern,
  PressureLogSource
} from '../types/tires';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const tireTypeEnum = z.nativeEnum(TireType);
const tireStatusEnum = z.nativeEnum(TireStatus);
const removalReasonEnum = z.nativeEnum(RemovalReason);
const rotationPatternEnum = z.nativeEnum(RotationPattern);
const pressureLogSourceEnum = z.nativeEnum(PressureLogSource);

const createTireInventorySchema = z.object({
  tire_number: z.string().min(1).max(100),
  manufacturer: z.string().min(1).max(200),
  model: z.string().min(1).max(200),
  size: z.string().min(1).max(50),
  load_range: z.string().max(10).optional(),
  tire_type: tireTypeEnum,
  tread_depth_32nds: z.number().int().min(0).max(32).optional(),
  dot_number: z.string().max(50).optional(),
  manufacture_date: z.coerce.date().optional(),
  purchase_date: z.coerce.date().optional(),
  purchase_price: z.number().nonnegative().max(10_000).optional(),
  vendor_id: z.string().optional(),
  warranty_miles: z.number().int().nonnegative().max(1_000_000).optional(),
  expected_life_miles: z.number().int().nonnegative().max(1_000_000).optional(),
  facility_id: z.string().optional(),
  location_in_warehouse: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateTireInventorySchema = z.object({
  tread_depth_32nds: z.number().int().min(0).max(32).optional(),
  status: tireStatusEnum.optional(),
  facility_id: z.string().optional(),
  location_in_warehouse: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const mountTireSchema = z.object({
  tire_id: z.string().min(1),
  position: z.string().min(1).max(20),
  mounted_date: z.coerce.date().optional(),
  mounted_odometer: z.number().nonnegative().max(10_000_000),
  mounted_by: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const unmountTireSchema = z.object({
  position: z.string().min(1).max(20),
  removed_date: z.coerce.date().optional(),
  removed_odometer: z.number().nonnegative().max(10_000_000),
  removed_by: z.string().optional(),
  removal_reason: removalReasonEnum,
});

const rotateTiresSchema = z.object({
  rotation_date: z.coerce.date().optional(),
  rotation_odometer: z.number().nonnegative().max(10_000_000),
  rotated_by: z.string().optional(),
  rotation_pattern: rotationPatternEnum,
  position_mappings: z.array(z.object({
    from_position: z.string().min(1).max(20),
    to_position: z.string().min(1).max(20),
  })).min(1).max(20),
});

const tirePositionInspectionSchema = z.object({
  position: z.string().min(1).max(20),
  tire_id: z.string().min(1),
  tread_depth: z.number().min(0).max(32),
  psi: z.number().min(0).max(200),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'critical']),
  issues: z.array(z.string()).optional(),
});

const tireDefectSchema = z.object({
  position: z.string().min(1).max(20),
  issue: z.string().min(1).max(500),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().max(2000).optional(),
});

const createTireInspectionSchema = z.object({
  vehicle_id: z.string().min(1),
  inspection_date: z.coerce.date().optional(),
  inspector_id: z.string().optional(),
  odometer_reading: z.number().nonnegative().max(10_000_000),
  tire_positions: z.array(tirePositionInspectionSchema).min(1).max(20),
  defects: z.array(tireDefectSchema).optional(),
  work_order_id: z.string().optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const tirePositionPressureSchema = z.object({
  position: z.string().min(1).max(20),
  tire_id: z.string().optional(),
  psi: z.number().min(0).max(250),
  temp_f: z.number().min(-40).max(500).optional(),
});

const createPressureLogSchema = z.object({
  vehicle_id: z.string().min(1),
  log_date: z.coerce.date().optional(),
  tire_positions: z.array(tirePositionPressureSchema).min(1).max(20),
  checked_by: z.string().optional(),
  source: pressureLogSourceEnum.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// ============================================================================
// TIRE INVENTORY MANAGEMENT
// ============================================================================

/**
 * GET /api/tires
 * List tire inventory with filtering
 */
router.get(
  '/',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_READ]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const {
      status,
      tire_type,
      manufacturer,
      facility_id,
      min_tread_depth,
      max_tread_depth,
      search,
      page = 1,
      pageSize = 50
    } = req.query as unknown as TireInventoryQuery;

    let query = `
      SELECT ti.*, f.name as facility_name, v.name as vendor_name
      FROM tire_inventory ti
      LEFT JOIN facilities f ON f.id = ti.facility_id
      LEFT JOIN vendors v ON v.id = ti.vendor_id
      WHERE ti.tenant_id = $1
    `;
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND ti.status = $${paramIndex++}`;
      params.push(status);
    }
    if (tire_type) {
      query += ` AND ti.tire_type = $${paramIndex++}`;
      params.push(tire_type);
    }
    if (manufacturer) {
      query += ` AND ti.manufacturer ILIKE $${paramIndex++}`;
      params.push(`%${manufacturer}%`);
    }
    if (facility_id) {
      query += ` AND ti.facility_id = $${paramIndex++}`;
      params.push(facility_id);
    }
    if (min_tread_depth) {
      query += ` AND ti.tread_depth_32nds >= $${paramIndex++}`;
      params.push(min_tread_depth);
    }
    if (max_tread_depth) {
      query += ` AND ti.tread_depth_32nds <= $${paramIndex++}`;
      params.push(max_tread_depth);
    }
    if (search) {
      query += ` AND (ti.tire_number ILIKE $${paramIndex++} OR ti.manufacturer ILIKE $${paramIndex} OR ti.model ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (Number(page) - 1) * Number(pageSize);
    query += ` ORDER BY ti.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(pageSize, offset);

    const result = await db.query(query, params);

    res.json({
      data: result.rows,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize))
    });
  })
);

/**
 * POST /api/tires
 * Add new tire to inventory
 */
router.post(
  '/',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_UPDATE]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const parsed = createTireInventorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const input: CreateTireInventoryInput = parsed.data;

    const query = `
      INSERT INTO tire_inventory (
        tenant_id, tire_number, manufacturer, model, size,
        load_range, tire_type, tread_depth_32nds, dot_number,
        manufacture_date, purchase_date, purchase_price, vendor_id,
        warranty_miles, expected_life_miles, facility_id,
        location_in_warehouse, notes, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;

    const result = await db.query<TireInventory>(query, [
      tenantId,
      input.tire_number,
      input.manufacturer,
      input.model,
      input.size,
      input.load_range || null,
      input.tire_type,
      input.tread_depth_32nds || 20,
      input.dot_number || null,
      input.manufacture_date || null,
      input.purchase_date || null,
      input.purchase_price || null,
      input.vendor_id || null,
      input.warranty_miles || null,
      input.expected_life_miles || null,
      input.facility_id || null,
      input.location_in_warehouse || null,
      input.notes || null,
      input.metadata || {}
    ]);

    logger.info('Tire added to inventory', {
      tenantId,
      tireId: result.rows[0].id,
      tireNumber: input.tire_number
    });

    res.status(201).json(result.rows[0]);
  })
);

/**
 * GET /api/tires/:id
 * Get tire details with full history
 */
router.get(
  '/:id',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_READ]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const { id } = req.params;

    // Get tire details
    const tireQuery = `
      SELECT ti.*, f.name as facility_name, v.name as vendor_name
      FROM tire_inventory ti
      LEFT JOIN facilities f ON f.id = ti.facility_id
      LEFT JOIN vendors v ON v.id = ti.vendor_id
      WHERE ti.id = $1 AND ti.tenant_id = $2
    `;
    const tireResult = await db.query(tireQuery, [id, tenantId]);

    if (tireResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tire not found' });
    }

    // Get mounting history
    const historyQuery = `
      SELECT vtp.*, v.make, v.model, v.license_plate
      FROM vehicle_tire_positions vtp
      LEFT JOIN vehicles v ON v.id = vtp.vehicle_id
      WHERE vtp.tire_id = $1 AND vtp.tenant_id = $2
      ORDER BY vtp.mounted_date DESC
    `;
    const historyResult = await db.query(historyQuery, [id, tenantId]);

    // Get analytics
    const analytics = await tireAnalyticsService.getTireAnalytics(id, tenantId);

    res.json({
      tire: tireResult.rows[0],
      mounting_history: historyResult.rows,
      analytics
    });
  })
);

/**
 * PUT /api/tires/:id
 * Update tire information
 */
router.put(
  '/:id',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_UPDATE]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const { id } = req.params;
    const parsed = updateTireInventorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const input: UpdateTireInventoryInput = parsed.data;

    const updates: string[] = [];
    const values: unknown[] = [id, tenantId];
    let paramIndex = 3;

    if (input.tread_depth_32nds !== undefined) {
      updates.push(`tread_depth_32nds = $${paramIndex++}`);
      values.push(input.tread_depth_32nds);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.facility_id !== undefined) {
      updates.push(`facility_id = $${paramIndex++}`);
      values.push(input.facility_id);
    }
    if (input.location_in_warehouse !== undefined) {
      updates.push(`location_in_warehouse = $${paramIndex++}`);
      values.push(input.location_in_warehouse);
    }
    if (input.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(input.notes);
    }
    if (input.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(input.metadata);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const query = `
      UPDATE tire_inventory
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const result = await db.query<TireInventory>(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tire not found' });
    }

    logger.info('Tire updated', { tenantId, tireId: id });

    res.json(result.rows[0]);
  })
);

// ============================================================================
// TIRE MOUNTING OPERATIONS
// ============================================================================

/**
 * POST /api/vehicles/:vehicleId/tires/mount
 * Mount a tire to a vehicle position
 */
router.post(
  '/vehicles/:vehicleId/tires/mount',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_UPDATE]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const { vehicleId } = req.params;
    const parsed = mountTireSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const input: MountTireInput = parsed.data;

    // Check if position is already occupied
    const checkQuery = `
      SELECT id FROM vehicle_tire_positions
      WHERE vehicle_id = $1 AND position = $2 AND is_current = true AND tenant_id = $3
    `;
    const checkResult = await db.query(checkQuery, [vehicleId, input.position, tenantId]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Position already occupied. Unmount existing tire first.' });
    }

    // Mount the tire
    const query = `
      INSERT INTO vehicle_tire_positions (
        tenant_id, vehicle_id, tire_id, position,
        mounted_date, mounted_odometer, mounted_by, is_current, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
      RETURNING *
    `;

    const result = await db.query(query, [
      tenantId,
      vehicleId,
      input.tire_id,
      input.position,
      input.mounted_date || new Date(),
      input.mounted_odometer,
      input.mounted_by || req.user?.id,
      input.metadata || {}
    ]);

    // Update tire status to mounted
    await db.query(
      'UPDATE tire_inventory SET status = $1 WHERE id = $2 AND tenant_id = $3',
      [TireStatus.MOUNTED, input.tire_id, tenantId]
    );

    logger.info('Tire mounted', { tenantId, vehicleId, tireId: input.tire_id, position: input.position });

    res.status(201).json(result.rows[0]);
  })
);

/**
 * POST /api/vehicles/:vehicleId/tires/unmount
 * Unmount a tire from a vehicle position
 */
router.post(
  '/vehicles/:vehicleId/tires/unmount',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_UPDATE]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const { vehicleId } = req.params;
    const parsed = unmountTireSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const input: UnmountTireInput = parsed.data;

    const query = `
      UPDATE vehicle_tire_positions
      SET is_current = false,
          removed_date = $1,
          removed_odometer = $2,
          removed_by = $3,
          removal_reason = $4
      WHERE vehicle_id = $5
        AND position = $6
        AND is_current = true
        AND tenant_id = $7
      RETURNING *
    `;

    const result = await db.query(query, [
      input.removed_date || new Date(),
      input.removed_odometer,
      input.removed_by || req.user?.id,
      input.removal_reason,
      vehicleId,
      input.position,
      tenantId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No tire found at specified position' });
    }

    // Update tire status to in-stock if removed due to wear/damage
    if (['wear', 'damage', 'end-of-life'].includes(input.removal_reason)) {
      await db.query(
        'UPDATE tire_inventory SET status = $1 WHERE id = $2 AND tenant_id = $3',
        [TireStatus.SCRAPPED, result.rows[0].tire_id, tenantId]
      );
    } else {
      await db.query(
        'UPDATE tire_inventory SET status = $1 WHERE id = $2 AND tenant_id = $3',
        [TireStatus.IN_STOCK, result.rows[0].tire_id, tenantId]
      );
    }

    logger.info('Tire unmounted', {
      tenantId,
      vehicleId,
      position: input.position,
      reason: input.removal_reason
    });

    res.json(result.rows[0]);
  })
);

/**
 * POST /api/vehicles/:vehicleId/tires/rotate
 * Execute tire rotation
 */
router.post(
  '/vehicles/:vehicleId/tires/rotate',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_UPDATE]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const { vehicleId } = req.params;
    const parsed = rotateTiresSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const input: RotateTiresInput = parsed.data;

    const result = await tireRotationService.executeTireRotation(vehicleId, tenantId, input);

    res.json(result);
  })
);

/**
 * GET /api/vehicles/:vehicleId/tires/current
 * Get current mounted tires for a vehicle
 */
router.get(
  '/vehicles/:vehicleId/tires/current',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_READ]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const { vehicleId } = req.params;

    const query = `
      SELECT
        vtp.*,
        ti.tire_number,
        ti.manufacturer,
        ti.model,
        ti.size,
        ti.tread_depth_32nds
      FROM vehicle_tire_positions vtp
      JOIN tire_inventory ti ON ti.id = vtp.tire_id
      WHERE vtp.vehicle_id = $1
        AND vtp.tenant_id = $2
        AND vtp.is_current = true
      ORDER BY vtp.position
    `;

    const result = await db.query(query, [vehicleId, tenantId]);

    res.json(result.rows);
  })
);

// ============================================================================
// TIRE INSPECTIONS
// ============================================================================

/**
 * POST /api/vehicles/:vehicleId/tires/inspect
 * Record tire inspection
 */
router.post(
  '/vehicles/:vehicleId/tires/inspect',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_UPDATE]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const { vehicleId } = req.params;
    const parsed = createTireInspectionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const input: CreateTireInspectionInput = parsed.data;

    const query = `
      INSERT INTO tire_inspections (
        tenant_id, vehicle_id, inspection_date, inspector_id,
        odometer_reading, tire_positions, defects_found, defects,
        work_order_id, notes, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await db.query(query, [
      tenantId,
      vehicleId,
      input.inspection_date || new Date(),
      input.inspector_id || req.user?.id,
      input.odometer_reading,
      JSON.stringify(input.tire_positions),
      input.defects && input.defects.length > 0,
      input.defects ? JSON.stringify(input.defects) : null,
      input.work_order_id || null,
      input.notes || null,
      input.metadata || {}
    ]);

    logger.info('Tire inspection recorded', { tenantId, vehicleId, inspectionId: result.rows[0].id });

    res.status(201).json(result.rows[0]);
  })
);

// ============================================================================
// ROTATION SCHEDULES
// ============================================================================

/**
 * GET /api/vehicles/:vehicleId/tires/rotation-schedule
 * Get rotation schedule for a vehicle
 */
router.get(
  '/vehicles/:vehicleId/tires/rotation-schedule',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_READ]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const { vehicleId } = req.params;

    const schedule = await tireRotationService.getScheduleForVehicle(vehicleId, tenantId);

    if (!schedule) {
      return res.status(404).json({ error: 'No rotation schedule found for this vehicle' });
    }

    res.json(schedule);
  })
);

// ============================================================================
// TIRE PRESSURE MONITORING
// ============================================================================

/**
 * POST /api/tires/pressure-log
 * Log tire pressures (manual or TPMS)
 */
router.post(
  '/pressure-log',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_UPDATE]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const parsed = createPressureLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const input: CreatePressureLogInput = parsed.data;

    // Generate alerts for low/high pressure
    interface PressureAlert {
      position: string;
      alert_type: 'low_pressure' | 'high_pressure' | 'high_temperature';
      threshold: number;
      actual: number;
      severity: 'warning' | 'critical';
    }
    const alerts: PressureAlert[] = [];
    for (const position of input.tire_positions) {
      if (position.psi < 95) {
        alerts.push({
          position: position.position,
          alert_type: 'low_pressure',
          threshold: 95,
          actual: position.psi,
          severity: position.psi < 85 ? 'critical' : 'warning'
        });
      }
      if (position.psi > 120) {
        alerts.push({
          position: position.position,
          alert_type: 'high_pressure',
          threshold: 120,
          actual: position.psi,
          severity: 'warning'
        });
      }
      if (position.temp_f && position.temp_f > 200) {
        alerts.push({
          position: position.position,
          alert_type: 'high_temperature',
          threshold: 200,
          actual: position.temp_f,
          severity: 'critical'
        });
      }
    }

    const query = `
      INSERT INTO tire_pressure_logs (
        tenant_id, vehicle_id, log_date, tire_positions,
        checked_by, source, alerts_triggered, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await db.query(query, [
      tenantId,
      input.vehicle_id,
      input.log_date || new Date(),
      JSON.stringify(input.tire_positions),
      input.checked_by || req.user?.id,
      input.source || PressureLogSource.MANUAL,
      alerts.length > 0 ? JSON.stringify(alerts) : null,
      input.metadata || {}
    ]);

    logger.info('Tire pressure logged', {
      tenantId,
      vehicleId: input.vehicle_id,
      alertCount: alerts.length
    });

    res.status(201).json(result.rows[0]);
  })
);

// ============================================================================
// ALERTS & ANALYTICS
// ============================================================================

/**
 * GET /api/tires/alerts
 * Get tire alerts (low tread, low pressure, overdue rotation)
 */
router.get(
  '/alerts',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_READ]
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenant_id ?? '';
    const { alert_level } = req.query;

    // Get rotation alerts
    const rotationAlerts = await tireRotationService.getRotationAlerts(
      tenantId,
      alert_level as 'info' | 'critical' | 'warning' | undefined
    );

    // Get low tread alerts
    const treadQuery = `
      SELECT
        v.id as vehicle_id,
        v.make || ' ' || v.model || ' (' || v.license_plate || ')' as vehicle_name,
        vtp.position,
        ti.tire_number,
        ti.tread_depth_32nds
      FROM vehicle_tire_positions vtp
      JOIN tire_inventory ti ON ti.id = vtp.tire_id
      JOIN vehicles v ON v.id = vtp.vehicle_id
      WHERE vtp.tenant_id = $1
        AND vtp.is_current = true
        AND ti.tread_depth_32nds <= 6
      ORDER BY ti.tread_depth_32nds ASC
    `;
    const treadResult = await db.query(treadQuery, [tenantId]);

    const treadAlerts = treadResult.rows.map((row) => ({
      type: 'low_tread',
      severity: row.tread_depth_32nds <= 4 ? 'critical' : 'warning',
      vehicle_id: row.vehicle_id,
      vehicle_name: row.vehicle_name,
      position: row.position,
      tire_number: row.tire_number,
      tread_depth: row.tread_depth_32nds,
      message: `Low tread depth: ${row.tread_depth_32nds}/32"`
    }));

    // Get recent pressure alerts
    const pressureQuery = `
      SELECT
        v.id as vehicle_id,
        v.make || ' ' || v.model || ' (' || v.license_plate || ')' as vehicle_name,
        tpl.log_date,
        tpl.alerts_triggered
      FROM tire_pressure_logs tpl
      JOIN vehicles v ON v.id = tpl.vehicle_id
      WHERE tpl.tenant_id = $1
        AND tpl.alerts_triggered IS NOT NULL
        AND tpl.log_date >= NOW() - INTERVAL '7 days'
      ORDER BY tpl.log_date DESC
      LIMIT 50
    `;
    const pressureResult = await db.query(pressureQuery, [tenantId]);

    const pressureAlerts = pressureResult.rows.flatMap((row) => {
      const alerts = row.alerts_triggered as Record<string, unknown>[];
      return alerts.map((alert) => ({
        ...alert,
        vehicle_id: row.vehicle_id,
        vehicle_name: row.vehicle_name,
        log_date: row.log_date
      }));
    });

    res.json({
      rotation_alerts: rotationAlerts,
      tread_alerts: treadAlerts,
      pressure_alerts: pressureAlerts,
      summary: {
        total: rotationAlerts.length + treadAlerts.length + pressureAlerts.length,
        critical: [
          ...rotationAlerts.filter((a) => a.alert_level === 'critical'),
          ...treadAlerts.filter((a) => a.severity === 'critical'),
          ...pressureAlerts.filter((a) => (a as Record<string, unknown>).severity === 'critical')
        ].length,
        warning: [
          ...rotationAlerts.filter((a) => a.alert_level === 'warning'),
          ...treadAlerts.filter((a) => a.severity === 'warning'),
          ...pressureAlerts.filter((a) => (a as Record<string, unknown>).severity === 'warning')
        ].length
      }
    });
  })
);

export default router;
