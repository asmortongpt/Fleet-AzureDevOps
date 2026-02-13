/**
 * Warranty Tracking Routes
 *
 * API endpoints for warranty tracking and claims recovery
 *
 * @module routes/warranties
 * @author Claude Code - Agent 7 (Phase 3)
 * @date 2026-02-02
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../db/connection';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import WarrantyEligibilityService from '../services/warranty-eligibility';
import WarrantyRecoveryService from '../services/warranty-recovery';
import {
    Warranty,
    WarrantyClaim,
    WarrantyType,
    WarrantyStatus,
    WarrantyClaimStatus,
    CreateWarrantyRequest,
    UpdateWarrantyRequest,
    CreateWarrantyClaimRequest,
    UpdateWarrantyClaimStatusRequest
} from '../types/warranties';

const router = Router();

// Services
const warrantyEligibilityService = new WarrantyEligibilityService(pool);
const warrantyRecoveryService = new WarrantyRecoveryService(pool);

// ============================================================================
// Validation Schemas
// ============================================================================

const warrantyIdSchema = z.object({
    id: z.string().uuid()
});

const claimIdSchema = z.object({
    id: z.string().uuid()
});

const vehicleIdParamSchema = z.object({
    vehicleId: z.string().uuid()
});

const workOrderIdParamSchema = z.object({
    workOrderId: z.string().uuid()
});

const createWarrantySchema = z.object({
    warranty_number: z.string().optional(),
    warranty_type: z.enum(['manufacturer', 'extended', 'powertrain', 'component', 'other']),
    vehicle_id: z.string().uuid().optional(),
    component: z.string().optional(),
    part_id: z.string().uuid().optional(),
    vendor_id: z.string().uuid().optional(),
    start_date: z.string().or(z.date()),
    end_date: z.string().or(z.date()).optional(),
    end_mileage: z.number().int().positive().optional(),
    coverage_description: z.string().min(1),
    exclusions: z.string().optional(),
    claim_process: z.string().optional(),
    warranty_contact_name: z.string().optional(),
    warranty_contact_phone: z.string().optional(),
    warranty_contact_email: z.string().email().optional(),
    warranty_document_url: z.string().url().optional(),
    transferable: z.boolean().optional(),
    prorated: z.boolean().optional(),
    notes: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
});

const updateWarrantySchema = createWarrantySchema.partial().extend({
    status: z.enum(['active', 'expired', 'voided', 'claimed']).optional(),
    void_date: z.string().or(z.date()).optional(),
    void_reason: z.string().optional()
});

const createClaimSchema = z.object({
    warranty_id: z.string().uuid(),
    claim_number: z.string().min(1),
    work_order_id: z.string().uuid().optional(),
    claim_date: z.string().or(z.date()),
    failure_description: z.string().min(1),
    failure_date: z.string().or(z.date()),
    vehicle_odometer: z.number().int().nonnegative().optional(),
    failed_component: z.string().optional(),
    root_cause: z.string().optional(),
    repair_performed: z.string().optional(),
    parts_replaced: z.array(z.object({
        part_number: z.string(),
        description: z.string(),
        quantity: z.number().int().positive(),
        unit_cost: z.number().nonnegative()
    })).optional(),
    labor_hours: z.number().nonnegative().optional(),
    claim_amount: z.number().nonnegative(),
    adjuster_name: z.string().optional(),
    adjuster_contact: z.string().optional(),
    supporting_documents: z.array(z.object({
        name: z.string(),
        url: z.string().url(),
        upload_date: z.string().or(z.date())
    })).optional(),
    notes: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
});

const updateClaimStatusSchema = z.object({
    status: z.enum(['submitted', 'under-review', 'approved', 'denied', 'paid', 'cancelled']),
    approved_amount: z.number().nonnegative().optional(),
    denied_amount: z.number().nonnegative().optional(),
    payout_amount: z.number().nonnegative().optional(),
    payout_date: z.string().or(z.date()).optional(),
    denial_reason: z.string().optional(),
    authorization_number: z.string().optional(),
    notes: z.string().optional()
});

const warrantyEligibilitySchema = z.object({
    vehicle_id: z.string().uuid(),
    component: z.string().optional(),
    failure_date: z.string().or(z.date()),
    odometer: z.number().int().nonnegative()
});

// ============================================================================
// All routes require authentication
// ============================================================================

router.use(authenticateJWT);

// ============================================================================
// WARRANTY ROUTES
// ============================================================================

/**
 * GET /api/warranties
 * List all warranties for the tenant
 */
router.get('/',
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
        permissions: [PERMISSIONS.MAINTENANCE_READ], // Using MAINTENANCE_READ as proxy
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const { status, vehicle_id, warranty_type } = req.query;

        let query = 'SELECT * FROM warranties WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }

        if (vehicle_id) {
            query += ` AND vehicle_id = $${paramIndex++}`;
            params.push(vehicle_id);
        }

        if (warranty_type) {
            query += ` AND warranty_type = $${paramIndex++}`;
            params.push(warranty_type);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query<Warranty>(query, params);

        res.json({
            data: result.rows,
            count: result.rows.length
        });
    })
);

/**
 * GET /api/warranties/expiring
 * Get warranties expiring soon
 */
router.get('/expiring',
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER, Role.USER],
        permissions: [PERMISSIONS.MAINTENANCE_READ],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const daysThreshold = parseInt(req.query.days as string) || 30;

        const expiring = await warrantyEligibilityService.getExpiringWarranties(tenantId, daysThreshold);

        res.json({
            data: expiring,
            count: expiring.length
        });
    })
);

/**
 * GET /api/warranties/statistics
 * Get warranty statistics
 */
router.get('/statistics',
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER, Role.USER],
        permissions: [PERMISSIONS.MAINTENANCE_READ],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;

        const stats = await warrantyRecoveryService.getWarrantyStatistics(tenantId);

        res.json({ data: stats });
    })
);

/**
 * GET /api/warranties/:id
 * Get warranty by ID
 */
router.get('/:id',
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
        permissions: [PERMISSIONS.MAINTENANCE_READ],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    validateParams(warrantyIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const { id } = req.params;

        const result = await pool.query<Warranty>(
            'SELECT * FROM warranties WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Warranty not found' });
        }

        res.json({ data: result.rows[0] });
    })
);

/**
 * POST /api/warranties
 * Create a new warranty
 */
router.post('/',
    csrfProtection,
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER],
        permissions: [PERMISSIONS.MAINTENANCE_CREATE],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    validateBody(createWarrantySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const data: CreateWarrantyRequest = req.body;

        const result = await pool.query<Warranty>(
            `INSERT INTO warranties (
                tenant_id, warranty_number, warranty_type, vehicle_id, component,
                part_id, vendor_id, start_date, end_date, end_mileage,
                coverage_description, exclusions, claim_process,
                warranty_contact_name, warranty_contact_phone, warranty_contact_email,
                warranty_document_url, transferable, prorated, notes, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING *`,
            [
                tenantId,
                data.warranty_number,
                data.warranty_type,
                data.vehicle_id,
                data.component,
                data.part_id,
                data.vendor_id,
                data.start_date,
                data.end_date,
                data.end_mileage,
                data.coverage_description,
                data.exclusions,
                data.claim_process,
                data.warranty_contact_name,
                data.warranty_contact_phone,
                data.warranty_contact_email,
                data.warranty_document_url,
                data.transferable ?? false,
                data.prorated ?? false,
                data.notes,
                data.metadata ? JSON.stringify(data.metadata) : null
            ]
        );

        res.status(201).json({
            data: result.rows[0],
            message: 'Warranty created successfully'
        });
    })
);

/**
 * PUT /api/warranties/:id
 * Update a warranty
 */
router.put('/:id',
    csrfProtection,
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER],
        permissions: [PERMISSIONS.MAINTENANCE_UPDATE],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    validateParams(warrantyIdSchema),
    validateBody(updateWarrantySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const { id } = req.params;
        const data: UpdateWarrantyRequest = req.body;

        // Build dynamic update query
        const fields: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramIndex++}`);
                values.push(key === 'metadata' ? JSON.stringify(value) : value);
            }
        });

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        fields.push('updated_at = NOW()');
        values.push(id, tenantId);

        const result = await pool.query<Warranty>(
            `UPDATE warranties
             SET ${fields.join(', ')}
             WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
             RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Warranty not found' });
        }

        res.json({
            data: result.rows[0],
            message: 'Warranty updated successfully'
        });
    })
);

// ============================================================================
// WARRANTY CLAIMS ROUTES
// ============================================================================

/**
 * GET /api/warranties/claims
 * List all warranty claims
 */
router.get('/claims/all',
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER, Role.USER],
        permissions: [PERMISSIONS.MAINTENANCE_READ],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const { status, warranty_id } = req.query;

        let query = 'SELECT * FROM warranty_claims WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }

        if (warranty_id) {
            query += ` AND warranty_id = $${paramIndex++}`;
            params.push(warranty_id);
        }

        query += ' ORDER BY claim_date DESC';

        const result = await pool.query<WarrantyClaim>(query, params);

        res.json({
            data: result.rows,
            count: result.rows.length
        });
    })
);

/**
 * GET /api/warranties/claims/pending
 * Get pending warranty claims
 */
router.get('/claims/pending',
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER, Role.USER],
        permissions: [PERMISSIONS.MAINTENANCE_READ],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;

        const pending = await warrantyRecoveryService.getPendingClaims(tenantId);

        res.json({
            data: pending,
            count: pending.length
        });
    })
);

/**
 * GET /api/warranties/claims/:id
 * Get warranty claim by ID
 */
router.get('/claims/:id',
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER, Role.USER],
        permissions: [PERMISSIONS.MAINTENANCE_READ],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    validateParams(claimIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const { id } = req.params;

        const result = await pool.query<WarrantyClaim>(
            'SELECT * FROM warranty_claims WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Warranty claim not found' });
        }

        res.json({ data: result.rows[0] });
    })
);

/**
 * POST /api/warranty-claims
 * File a new warranty claim
 */
router.post('/claims',
    csrfProtection,
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER],
        permissions: [PERMISSIONS.MAINTENANCE_CREATE],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    validateBody(createClaimSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const userId = req.user?.id;
        const data: CreateWarrantyClaimRequest = req.body;

        const result = await pool.query<WarrantyClaim>(
            `INSERT INTO warranty_claims (
                tenant_id, warranty_id, claim_number, work_order_id, claim_date,
                filed_by, failure_description, failure_date, vehicle_odometer,
                failed_component, root_cause, repair_performed, parts_replaced,
                labor_hours, claim_amount, adjuster_name, adjuster_contact,
                supporting_documents, notes, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *`,
            [
                tenantId,
                data.warranty_id,
                data.claim_number,
                data.work_order_id,
                data.claim_date,
                userId,
                data.failure_description,
                data.failure_date,
                data.vehicle_odometer,
                data.failed_component,
                data.root_cause,
                data.repair_performed,
                data.parts_replaced ? JSON.stringify(data.parts_replaced) : null,
                data.labor_hours,
                data.claim_amount,
                data.adjuster_name,
                data.adjuster_contact,
                data.supporting_documents ? JSON.stringify(data.supporting_documents) : null,
                data.notes,
                data.metadata ? JSON.stringify(data.metadata) : null
            ]
        );

        // Track claim submission
        await warrantyRecoveryService.trackClaimSubmission(tenantId, result.rows[0].id);

        res.status(201).json({
            data: result.rows[0],
            message: 'Warranty claim filed successfully'
        });
    })
);

/**
 * PUT /api/warranty-claims/:id/status
 * Update warranty claim status
 */
router.put('/claims/:id/status',
    csrfProtection,
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER],
        permissions: [PERMISSIONS.MAINTENANCE_UPDATE],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    validateParams(claimIdSchema),
    validateBody(updateClaimStatusSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const { id } = req.params;
        const data: UpdateWarrantyClaimStatusRequest = req.body;

        const updatedClaim = await warrantyRecoveryService.updateClaimStatus(
            tenantId,
            id,
            data.status,
            {
                approved_amount: data.approved_amount,
                denied_amount: data.denied_amount,
                payout_amount: data.payout_amount,
                payout_date: data.payout_date ? new Date(data.payout_date) : undefined,
                denial_reason: data.denial_reason,
                authorization_number: data.authorization_number,
                notes: data.notes
            }
        );

        res.json({
            data: updatedClaim,
            message: 'Warranty claim status updated successfully'
        });
    })
);

/**
 * GET /api/work-orders/:workOrderId/warranty-eligibility
 * Check warranty eligibility for a work order
 */
router.get('/work-orders/:workOrderId/eligibility',
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER, Role.USER],
        permissions: [PERMISSIONS.MAINTENANCE_READ],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    validateParams(workOrderIdParamSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const { workOrderId } = req.params;

        // Get work order details
        const workOrder = await pool.query(
            `SELECT vehicle_id, description, scheduled_date
             FROM work_orders
             WHERE id = $1 AND tenant_id = $2`,
            [workOrderId, tenantId]
        );

        if (workOrder.rows.length === 0) {
            return res.status(404).json({ error: 'Work order not found' });
        }

        const wo = workOrder.rows[0];

        // Get vehicle odometer
        const vehicle = await pool.query(
            `SELECT odometer FROM vehicles WHERE id = $1 AND tenant_id = $2`,
            [wo.vehicle_id, tenantId]
        );

        if (vehicle.rows.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const eligibility = await warrantyEligibilityService.checkEligibility(tenantId, {
            vehicle_id: wo.vehicle_id,
            component: undefined, // Can be enhanced to parse from description
            failure_date: wo.scheduled_date || new Date(),
            odometer: vehicle.rows[0].odometer || 0
        });

        res.json({ data: eligibility });
    })
);

/**
 * GET /api/warranties/recovery/report
 * Generate warranty recovery report
 */
router.get('/recovery/report',
    requireRBAC({
        roles: [Role.ADMIN, Role.MANAGER],
        permissions: [PERMISSIONS.MAINTENANCE_READ],
        enforceTenantIsolation: true,
        resourceType: 'warranty'
    }),
    asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenant_id || req.user?.id;
        const periodStart = req.query.start_date ? new Date(req.query.start_date as string) : new Date(new Date().getFullYear(), 0, 1);
        const periodEnd = req.query.end_date ? new Date(req.query.end_date as string) : new Date();

        const report = await warrantyRecoveryService.generateRecoveryReport(tenantId, periodStart, periodEnd);

        res.json({ data: report });
    })
);

export default router;
