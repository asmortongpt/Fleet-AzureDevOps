import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { cacheService } from '../config/cache'; // Wave 13: Add Redis caching
import { inspectionCreateSchema, inspectionUpdateSchema } from '../schemas/inspection.schema';
import { validate } from '../middleware/validate';
import logger from '../config/logger'; // Wave 11: Add Winston logger
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { TenantValidator } from '../utils/tenant-validator';

const router = express.Router()
const validator = new TenantValidator(db);
router.use(authenticateJWT)

// GET /inspections
router.get(
  '/',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query

      // Wave 13: Cache-aside pattern
      const cacheKey = `inspections:list:${req.user!.tenant_id}:${page}:${limit}`
      const cached = await cacheService.get<any>(cacheKey)

      if (cached) {
        return res.json(cached)
      }

      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT id, tenant_id, vehicle_id, driver_id, inspection_type, status,
                passed, failed_items, odometer_reading, inspector_notes,
                signature_url, completed_at, created_at, updated_at
         FROM inspections WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM inspections WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      const response = {
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit)
        }
      }

      // Cache for 5 minutes (300 seconds)
      await cacheService.set(cacheKey, response, 300)

      res.json(response)
    } catch (error) {
      logger.error('Failed to fetch inspections', { error }) // Wave 11: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /inspections/:id
router.get(
  '/:id',
  requirePermission('inspection:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Wave 13: Cache-aside pattern for single inspection
      const cacheKey = `inspection:${req.params.id}:${req.user!.tenant_id}`
      const cached = await cacheService.get<any>(cacheKey)

      if (cached) {
        return res.json(cached)
      }

      const result = await pool.query(
        `SELECT id, tenant_id, vehicle_id, driver_id, inspection_type, status,
                passed, failed_items, checklist_data, odometer_reading,
                inspector_notes, signature_url, completed_at, created_at, updated_at
         FROM inspections WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Inspections not found` })
      }

      // Cache for 10 minutes (600 seconds)
      await cacheService.set(cacheKey, result.rows[0], 600)

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Failed to fetch inspection', { error, inspectionId: req.params.id }) // Wave 11: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /inspections
router.post(
  '/',
  validate(inspectionCreateSchema), // Wave 8: Add Zod validation
  requirePermission('inspection:create:own', {
    customCheck: async (req: AuthRequest) => {
      // Validate driver_id matches the authenticated user
      const driverId = req.body.driver_id
      if (!driverId) {
        return false
      }

      // Check if the driver_id belongs to the user
      const result = await pool.query(
        `SELECT id FROM drivers WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
        [driverId, req.user!.id, req.user!.tenant_id]
      )

      return result.rows.length > 0
    }
  }),
  auditLog({ action: `CREATE`, resourceType: `inspections` }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        [`tenant_id`],
        1
      )

      const result = await pool.query(
        `INSERT INTO inspections (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      logger.error('Failed to create inspection', { error }) // Wave 11: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /inspections/:id

// SECURITY: Allow-list for updateable fields (prevents mass assignment)
const ALLOWED_UPDATE_FIELDS = [
  "notes",
  "status",
  "inspection_type",
  "result",
  "checklist_items",
  "overall_condition",
  "defects_found",
  "corrective_actions_required",
  "follow_up_required"
];

router.put(
  `/:id`,
  validate(inspectionUpdateSchema), // Wave 8: Add Zod validation
  requirePermission('inspection:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // SECURITY: IDOR Protection - Validate foreign keys belong to tenant
      const { vehicle_id, inspector_id } = data

      if (vehicle_id && !(await validator.validateVehicle(vehicle_id, req.user!.tenant_id)) {
        return res.status(403).json({
          success: false,
          error: 'Vehicle Id not found or access denied'
        })
      }
      if (inspector_id && !(await validator.validateInspector(inspector_id, req.user!.tenant_id)) {
        return res.status(403).json({
          success: false,
          error: 'Inspector Id not found or access denied'
        })
      }
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE inspections SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Inspections not found` })
      }

      // Wave 13: Invalidate cache on update
      const cacheKey = `inspection:${req.params.id}:${req.user!.tenant_id}`
      await cacheService.del(cacheKey)

      res.json(result.rows[0])
    } catch (error) {
      logger.error('Failed to update inspection', { error, inspectionId: req.params.id }) // Wave 11: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// DELETE /inspections/:id
router.delete(
  '/:id',
  requirePermission('inspection:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'inspections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM inspections WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return throw new NotFoundError("Inspections not found")
      }

      // Wave 13: Invalidate cache on delete
      const cacheKey = `inspection:${req.params.id}:${req.user!.tenant_id}`
      await cacheService.del(cacheKey)

      res.json({ message: 'Inspections deleted successfully' })
    } catch (error) {
      logger.error('Failed to delete inspection', { error, inspectionId: req.params.id }) // Wave 11: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router

// Wave 15: Removed duplicate route definitions (dead code after export)
