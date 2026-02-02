/**
 * Safety Alerts API Routes
 * Handles real-time safety alerts with OSHA compliance tracking
 *
 * SECURITY:
 * - All routes require authentication
 * - RBAC enforcement with tenant isolation
 * - Parameterized queries only (no SQL injection)
 * - CSRF protection on mutations
 */

import { Router } from "express";
import { z } from "zod";

import { authenticateJWT } from "../middleware/auth";
import { csrfProtection } from "../middleware/csrf";
import { asyncHandler } from "../middleware/errorHandler";
import { requireRBAC, Role, PERMISSIONS } from "../middleware/rbac";
import { validateBody, validateParams, validateQuery } from "../middleware/validate";
import { tenantSafeQuery } from "../utils/dbHelpers";

const router = Router();

// Validation schemas
const idSchema = z.object({
  id: z.string().uuid()
});

const safetyAlertSchema = z.object({
  alertNumber: z.string().optional(),
  type: z.enum(["injury", "near-miss", "hazard", "osha-violation", "equipment-failure", "environmental"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  location: z.string().min(1),
  facilityId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  reportedBy: z.string().min(1),
  reportedAt: z.string().datetime(),
  status: z.enum(["active", "acknowledged", "investigating", "resolved", "closed"]).default("active"),
  oshaRecordable: z.boolean().default(false),
  oshaFormRequired: z.enum(["300", "300A", "301"]).optional(),
  daysAwayFromWork: z.number().int().min(0).optional(),
  daysRestricted: z.number().int().min(0).optional(),
  requiresImmediateAction: z.boolean().default(false),
  estimatedResolutionTime: z.string().optional(),
  actualResolutionTime: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  witnesses: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
  rootCause: z.string().optional(),
  correctiveActions: z.array(z.string()).optional(),
  preventiveMeasures: z.array(z.string()).optional()
});

const updateSafetyAlertSchema = safetyAlertSchema.partial();

const querySchema = z.object({
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["active", "acknowledged", "investigating", "resolved", "closed"]).optional(),
  type: z.enum(["injury", "near-miss", "hazard", "osha-violation", "equipment-failure", "environmental"]).optional(),
  oshaRecordable: z.string().transform(val => val === "true").optional(),
  facilityId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional()
});

const oshaMetricsQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// SECURITY: All routes require authentication
router.use(authenticateJWT);

const safetyTypeMap: Record<string, string> = {
  injury: 'injury',
  'near-miss': 'near-miss',
  hazard: 'hazard',
  'osha-violation': 'osha-violation',
  'equipment-failure': 'equipment-failure',
  environmental: 'environmental',
  maintenance_due: 'equipment-failure',
  geofence_violation: 'hazard',
  speed_violation: 'hazard',
  idle_time: 'hazard',
  custom: 'hazard'
};

const normalizeSeverity = (severity?: string) => {
  if (!severity) return 'medium';
  const lower = severity.toLowerCase();
  if (['critical', 'high', 'medium', 'low'].includes(lower)) return lower;
  if (lower === 'emergency') return 'critical';
  if (lower === 'warning') return 'high';
  if (lower === 'info') return 'low';
  return 'medium';
};

const normalizeStatus = (status?: string) => {
  if (!status) return 'active';
  const lower = status.toLowerCase();
  if (['active', 'acknowledged', 'investigating', 'resolved', 'closed'].includes(lower)) return lower;
  if (['pending', 'sent'].includes(lower)) return 'active';
  return 'active';
};

const parseMetadata = (value: any): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const ensureArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return [value];
  return [];
};

const mapAlertRow = (row: any) => {
  const metadata = parseMetadata(row.metadata);
  const createdAt = row.created_at || metadata.reportedAt || metadata.reported_at || new Date().toISOString();
  const year = new Date(createdAt).getFullYear();
  const idSuffix = row.id ? String(row.id).split('-')[0] : String(Date.now());
  const alertNumber = metadata.alertNumber || metadata.alert_number || `SA-${year}-${idSuffix}`;
  const mappedType = safetyTypeMap[row.alert_type] || safetyTypeMap[(row.alert_type || '').toLowerCase()] || 'hazard';

  return {
    id: row.id,
    alertNumber,
    type: mappedType,
    severity: normalizeSeverity(row.severity),
    title: row.title,
    description: row.description || '',
    location: metadata.location || metadata.address || '',
    facilityId: row.entity_type === 'facility' ? row.entity_id : metadata.facilityId || metadata.facility_id || null,
    vehicleId: row.vehicle_id || metadata.vehicleId || metadata.vehicle_id || null,
    driverId: row.driver_id || metadata.driverId || metadata.driver_id || null,
    reportedBy: metadata.reportedBy || metadata.reported_by || '',
    reportedAt: metadata.reportedAt || metadata.reported_at || row.created_at,
    status: normalizeStatus(row.status),
    oshaRecordable: metadata.oshaRecordable ?? metadata.osha_recordable ?? false,
    oshaFormRequired: metadata.oshaFormRequired || metadata.osha_form_required,
    daysAwayFromWork: metadata.daysAwayFromWork ?? metadata.days_away_from_work,
    daysRestricted: metadata.daysRestricted ?? metadata.days_restricted,
    requiresImmediateAction: row.action_required ?? metadata.requiresImmediateAction ?? false,
    estimatedResolutionTime: metadata.estimatedResolutionTime || metadata.estimated_resolution_time,
    actualResolutionTime: metadata.actualResolutionTime || metadata.actual_resolution_time || row.resolved_at,
    assignedTo: metadata.assignedTo || metadata.assigned_to,
    witnesses: ensureArray(metadata.witnesses),
    photos: ensureArray(metadata.photos),
    rootCause: metadata.rootCause || metadata.root_cause,
    correctiveActions: ensureArray(metadata.correctiveActions || metadata.corrective_actions),
    preventiveMeasures: ensureArray(metadata.preventiveMeasures || metadata.preventive_measures)
  };
};

/**
 * GET /api/safety-alerts
 * Get all safety alerts with filtering
 */
router.get(
  "/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.SAFETY_ALERT_READ],
    enforceTenantIsolation: true,
    resourceType: "safety-alert"
  }),
  validateQuery(querySchema),
  asyncHandler(async (req, res) => {
    const {
      severity,
      status,
      type,
      oshaRecordable,
      facilityId,
      vehicleId,
      driverId,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;

    const tenantId = req.user?.tenant_id;

    let whereClause = `WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (severity) {
      whereClause += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type) {
      const mappedType = safetyTypeMap[type] || type;
      whereClause += ` AND alert_type = $${paramIndex}`;
      params.push(mappedType);
      paramIndex++;
    }

    if (oshaRecordable !== undefined) {
      whereClause += ` AND COALESCE((metadata->>'oshaRecordable')::boolean, (metadata->>'osha_recordable')::boolean, false) = $${paramIndex}`;
      params.push(oshaRecordable);
      paramIndex++;
    }

    if (facilityId) {
      whereClause += ` AND (entity_id = $${paramIndex} OR metadata->>'facilityId' = $${paramIndex} OR metadata->>'facility_id' = $${paramIndex})`;
      params.push(facilityId);
      paramIndex++;
    }

    if (vehicleId) {
      whereClause += ` AND vehicle_id = $${paramIndex}`;
      params.push(vehicleId);
      paramIndex++;
    }

    if (driverId) {
      whereClause += ` AND driver_id = $${paramIndex}`;
      params.push(driverId);
      paramIndex++;
    }

    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const query = `
      SELECT * FROM alerts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `SELECT COUNT(*) as total FROM alerts ${whereClause}`;

    const [result, countResult] = await Promise.all([
      tenantSafeQuery(query, [...params, limit, offset], tenantId),
      tenantSafeQuery(countQuery, params, tenantId)
    ]);

    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    res.json({
      success: true,
      data: result.rows.map(mapAlertRow),
      pagination: {
        limit,
        offset,
        total
      }
    });
  })
);

/**
 * GET /api/safety-alerts/:id
 * Get a specific safety alert
 */
router.get(
  "/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.SAFETY_ALERT_READ],
    enforceTenantIsolation: true,
    resourceType: "safety-alert"
  }),
  validateParams(idSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;

    const query = `SELECT * FROM alerts WHERE id = $1 AND tenant_id = $2`;
    const result = await tenantSafeQuery(query, [id, tenantId], tenantId);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: "Safety alert not found"
      });
    }

    res.json({
      success: true,
      data: mapAlertRow(result.rows[0])
    });
  })
);

/**
 * POST /api/safety-alerts
 * Create a new safety alert
 */
router.post(
  "/",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.SAFETY_ALERT_CREATE],
    enforceTenantIsolation: true,
    resourceType: "safety-alert"
  }),
  validateBody(safetyAlertSchema),
  asyncHandler(async (req, res) => {
    const alertData = req.body;
    const tenantId = req.user?.tenant_id;

    const reportedAt = alertData.reportedAt ? new Date(alertData.reportedAt) : new Date();
    const entityType = alertData.facilityId ? 'facility' : alertData.vehicleId ? 'vehicle' : alertData.driverId ? 'driver' : null;
    const entityId = alertData.facilityId || null;

    const metadata = {
      alertNumber: alertData.alertNumber,
      reportedBy: alertData.reportedBy,
      reportedAt: alertData.reportedAt,
      location: alertData.location,
      oshaRecordable: alertData.oshaRecordable,
      oshaFormRequired: alertData.oshaFormRequired,
      daysAwayFromWork: alertData.daysAwayFromWork,
      daysRestricted: alertData.daysRestricted,
      requiresImmediateAction: alertData.requiresImmediateAction,
      estimatedResolutionTime: alertData.estimatedResolutionTime,
      actualResolutionTime: alertData.actualResolutionTime,
      assignedTo: alertData.assignedTo,
      witnesses: alertData.witnesses || [],
      photos: alertData.photos || [],
      rootCause: alertData.rootCause,
      correctiveActions: alertData.correctiveActions || [],
      preventiveMeasures: alertData.preventiveMeasures || []
    };

    const query = `
      INSERT INTO alerts (
        tenant_id, alert_type, severity, title, description,
        entity_type, entity_id, vehicle_id, driver_id,
        status, action_required, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14
      ) RETURNING *
    `;

    const params = [
      tenantId,
      alertData.type,
      alertData.severity,
      alertData.title,
      alertData.description,
      entityType,
      entityId,
      alertData.vehicleId || null,
      alertData.driverId || null,
      alertData.status,
      alertData.requiresImmediateAction,
      JSON.stringify(metadata),
      reportedAt.toISOString(),
      reportedAt.toISOString()
    ];

    const result = await tenantSafeQuery(query, params, tenantId);

    res.status(201).json({
      success: true,
      data: mapAlertRow(result.rows[0])
    });
  })
);

/**
 * PUT /api/safety-alerts/:id
 * Update a safety alert
 */
router.put(
  "/:id",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.SAFETY_ALERT_UPDATE],
    enforceTenantIsolation: true,
    resourceType: "safety-alert"
  }),
  validateParams(idSchema),
  validateBody(updateSafetyAlertSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenant_id;

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const metadataPatch: Record<string, any> = {};

    if (updates.type) {
      setClauses.push(`alert_type = $${paramIndex}`);
      params.push(updates.type);
      paramIndex++;
    }

    if (updates.severity) {
      setClauses.push(`severity = $${paramIndex}`);
      params.push(updates.severity);
      paramIndex++;
    }

    if (updates.title) {
      setClauses.push(`title = $${paramIndex}`);
      params.push(updates.title);
      paramIndex++;
    }

    if (updates.description) {
      setClauses.push(`description = $${paramIndex}`);
      params.push(updates.description);
      paramIndex++;
    }

    if (updates.status) {
      setClauses.push(`status = $${paramIndex}`);
      params.push(updates.status);
      paramIndex++;
    }

    if (updates.requiresImmediateAction !== undefined) {
      setClauses.push(`action_required = $${paramIndex}`);
      params.push(updates.requiresImmediateAction);
      paramIndex++;
    }

    if (updates.vehicleId !== undefined) {
      setClauses.push(`vehicle_id = $${paramIndex}`);
      params.push(updates.vehicleId || null);
      paramIndex++;
    }

    if (updates.driverId !== undefined) {
      setClauses.push(`driver_id = $${paramIndex}`);
      params.push(updates.driverId || null);
      paramIndex++;
    }

    if (updates.facilityId !== undefined) {
      setClauses.push(`entity_type = $${paramIndex}`);
      params.push(updates.facilityId ? 'facility' : null);
      paramIndex++;
      setClauses.push(`entity_id = $${paramIndex}`);
      params.push(updates.facilityId || null);
      paramIndex++;
    }

    if (updates.reportedBy !== undefined) metadataPatch.reportedBy = updates.reportedBy;
    if (updates.reportedAt !== undefined) metadataPatch.reportedAt = updates.reportedAt;
    if (updates.location !== undefined) metadataPatch.location = updates.location;
    if (updates.oshaRecordable !== undefined) metadataPatch.oshaRecordable = updates.oshaRecordable;
    if (updates.oshaFormRequired !== undefined) metadataPatch.oshaFormRequired = updates.oshaFormRequired;
    if (updates.daysAwayFromWork !== undefined) metadataPatch.daysAwayFromWork = updates.daysAwayFromWork;
    if (updates.daysRestricted !== undefined) metadataPatch.daysRestricted = updates.daysRestricted;
    if (updates.estimatedResolutionTime !== undefined) metadataPatch.estimatedResolutionTime = updates.estimatedResolutionTime;
    if (updates.actualResolutionTime !== undefined) metadataPatch.actualResolutionTime = updates.actualResolutionTime;
    if (updates.assignedTo !== undefined) metadataPatch.assignedTo = updates.assignedTo;
    if (updates.witnesses !== undefined) metadataPatch.witnesses = updates.witnesses;
    if (updates.photos !== undefined) metadataPatch.photos = updates.photos;
    if (updates.rootCause !== undefined) metadataPatch.rootCause = updates.rootCause;
    if (updates.correctiveActions !== undefined) metadataPatch.correctiveActions = updates.correctiveActions;
    if (updates.preventiveMeasures !== undefined) metadataPatch.preventiveMeasures = updates.preventiveMeasures;

    if (Object.keys(metadataPatch).length > 0) {
      setClauses.push(`metadata = COALESCE(metadata, '{}'::jsonb) || $${paramIndex}::jsonb`);
      params.push(JSON.stringify(metadataPatch));
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update"
      });
    }

    setClauses.push(`updated_at = $${paramIndex}`);
    params.push(new Date().toISOString());
    paramIndex++;

    const query = `
      UPDATE alerts
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;
    params.push(id, tenantId);

    const result = await tenantSafeQuery(query, params, tenantId);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: "Safety alert not found"
      });
    }

    res.json({
      success: true,
      data: mapAlertRow(result.rows[0])
    });
  })
);

/**
 * DELETE /api/safety-alerts/:id
 * Delete a safety alert (soft delete via status)
 */
router.delete(
  "/:id",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN],
    permissions: [PERMISSIONS.SAFETY_ALERT_DELETE],
    enforceTenantIsolation: true,
    resourceType: "safety-alert"
  }),
  validateParams(idSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;

    const metadataPatch = {
      deleted: true,
      deleted_at: new Date().toISOString()
    };

    const query = `
      UPDATE alerts
      SET status = 'closed',
          metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
          updated_at = $2
      WHERE id = $3 AND tenant_id = $4
      RETURNING id
    `;

    const result = await tenantSafeQuery(query, [JSON.stringify(metadataPatch), new Date().toISOString(), id, tenantId], tenantId);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: "Safety alert not found"
      });
    }

    res.json({
      success: true,
      message: "Safety alert deleted successfully"
    });
  })
);

/**
 * GET /api/safety-alerts/metrics/osha
 * Get OSHA compliance metrics
 */
router.get(
  "/metrics/osha",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.SAFETY_METRICS_READ],
    enforceTenantIsolation: true,
    resourceType: "safety-metrics"
  }),
  validateQuery(oshaMetricsQuerySchema),
  asyncHandler(async (req, res) => {
    const { year, startDate, endDate } = req.query;
    const tenantId = req.user?.tenant_id;

    let start = startDate ? new Date(startDate) : undefined;
    let end = endDate ? new Date(endDate) : undefined;

    if (year) {
      start = new Date(`${year}-01-01T00:00:00.000Z`);
      end = new Date(`${year}-12-31T23:59:59.999Z`);
    }

    let whereClause = 'WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (start) {
      whereClause += ` AND incident_date >= $${paramIndex}`;
      params.push(start.toISOString().split('T')[0]);
      paramIndex++;
    }

    if (end) {
      whereClause += ` AND incident_date <= $${paramIndex}`;
      params.push(end.toISOString().split('T')[0]);
      paramIndex++;
    }

    const query = `
      SELECT
        COUNT(*) FILTER (WHERE is_recordable = true) as recordable,
        COUNT(*) as total_cases,
        COALESCE(SUM(days_away_from_work + days_restricted_duty), 0) as days_away_restricted,
        COALESCE(SUM(days_away_from_work), 0) as days_away,
        COALESCE(SUM(CASE WHEN injury_type ILIKE '%illness%' THEN 1 ELSE 0 END), 0) as illnesses,
        COALESCE(SUM(CASE WHEN injury_type ILIKE '%fatal%' THEN 1 ELSE 0 END), 0) as fatalities,
        COALESCE(SUM(CASE WHEN injury_type IS NOT NULL AND injury_type NOT ILIKE '%illness%' AND injury_type NOT ILIKE '%fatal%' THEN 1 ELSE 0 END), 0) as injuries,
        COALESCE(SUM((metadata->>'hoursWorked')::numeric), 0) as hours_worked
      FROM osha_logs
      ${whereClause}
    `;

    const result = await tenantSafeQuery(query, params, tenantId);
    const row = result.rows[0] || {};

    const totalRecordableIncidents = parseInt(row.recordable || '0', 10);
    const totalCases = parseInt(row.total_cases || '0', 10);
    const daysAwayRestrictedTransfer = parseFloat(row.days_away_restricted || '0');
    const daysAwayFromWork = parseFloat(row.days_away || '0');
    const totalHoursWorked = parseFloat(row.hours_worked || '0');

    const incidentRate = totalHoursWorked > 0 ? (totalRecordableIncidents * 200000) / totalHoursWorked : 0;
    const daysAwayFromWorkCaseRate = totalHoursWorked > 0 ? (daysAwayFromWork * 200000) / totalHoursWorked : 0;
    const lostWorkdayRate = totalHoursWorked > 0 ? (daysAwayRestrictedTransfer * 200000) / totalHoursWorked : 0;

    res.json({
      success: true,
      data: {
        totalRecordableIncidents,
        daysAwayRestrictedTransfer,
        totalCases,
        incidentRate,
        daysAwayFromWorkCaseRate,
        lostWorkdayRate,
        totalHoursWorked,
        yearToDate: {
          injuries: parseInt(row.injuries || '0', 10),
          illnesses: parseInt(row.illnesses || '0', 10),
          fatalities: parseInt(row.fatalities || '0', 10)
        }
      }
    });
  })
);

/**
 * POST /api/safety-alerts/:id/acknowledge
 * Acknowledge a safety alert
 */
router.post(
  "/:id/acknowledge",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.SAFETY_ALERT_UPDATE],
    enforceTenantIsolation: true,
    resourceType: "safety-alert"
  }),
  validateParams(idSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;

    const query = `
      UPDATE alerts
      SET
        status = 'acknowledged',
        acknowledged_by = $1,
        acknowledged_at = $2,
        updated_at = $2
      WHERE id = $3 AND tenant_id = $4 AND status = 'active'
      RETURNING *
    `;

    const result = await tenantSafeQuery(query, [userId, new Date().toISOString(), id, tenantId], tenantId);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: "Safety alert not found"
      });
    }

    res.json({
      success: true,
      message: "Safety alert acknowledged",
      data: mapAlertRow(result.rows[0])
    });
  })
);

/**
 * POST /api/safety-alerts/:id/resolve
 * Resolve a safety alert
 */
router.post(
  "/:id/resolve",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.SAFETY_ALERT_UPDATE],
    enforceTenantIsolation: true,
    resourceType: "safety-alert"
  }),
  validateParams(idSchema),
  validateBody(z.object({
    rootCause: z.string().optional(),
    correctiveActions: z.array(z.string()).optional(),
    preventiveMeasures: z.array(z.string()).optional()
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rootCause, correctiveActions, preventiveMeasures } = req.body;
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;

    const metadataPatch = {
      rootCause,
      correctiveActions: correctiveActions || [],
      preventiveMeasures: preventiveMeasures || [],
      actualResolutionTime: new Date().toISOString()
    };

    const query = `
      UPDATE alerts
      SET
        status = 'resolved',
        resolved_by = $1,
        resolved_at = $2,
        metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
        updated_at = $2
      WHERE id = $4 AND tenant_id = $5
      RETURNING *
    `;

    const result = await tenantSafeQuery(query, [userId, new Date().toISOString(), JSON.stringify(metadataPatch), id, tenantId], tenantId);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: "Safety alert not found"
      });
    }

    res.json({
      success: true,
      message: "Safety alert resolved",
      data: mapAlertRow(result.rows[0])
    });
  })
);

export default router;
