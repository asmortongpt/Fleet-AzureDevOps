import { Router, Response } from "express"
import { z } from 'zod'

import { pool } from '../config/database'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { setTenantContext } from '../middleware/tenant-context'
import logger from '../config/logger'

import { flexUuid } from '../middleware/validation'

const createPartSchema = z.object({
  partNumber: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  unitCost: z.number().optional(),
  quantityOnHand: z.number().int().optional(),
  reorderPoint: z.number().int().optional(),
  reorderQuantity: z.number().int().optional(),
  location: z.string().optional(),
  facilityId: flexUuid.optional(),
})

const updatePartSchema = createPartSchema.omit({ partNumber: true }).partial()

const router = Router()

// Apply authentication and tenant context to all routes
router.use(authenticateJWT)
router.use(setTenantContext)

router.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const { category, search, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  let whereClause = 'WHERE tenant_id = $1'
  const params: (string | number | boolean | null | undefined)[] = [tenantId]

  if (category && typeof category === 'string') {
    params.push(category)
    whereClause += ` AND category = $${params.length}`
  }

  if (search && typeof search === 'string') {
    params.push(`%${search}%`)
    whereClause += ` AND (name ILIKE $${params.length} OR part_number ILIKE $${params.length})`
  }

  const result = await client.query(
    `SELECT id, part_number as "partNumber", name, description, category,
            supplier, unit_cost as "unitCost",
            quantity_on_hand as "quantityOnHand", reorder_point as "reorderPoint",
            reorder_quantity as "reorderQuantity", location,
            facility_id as "facilityId",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM parts_inventory
     ${whereClause}
     ORDER BY name ASC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  const countResult = await client.query(
    `SELECT COUNT(*) FROM parts_inventory ${whereClause}`,
    params
  )

  res.json({
    data: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page: Number(page),
    limit: Number(limit)
  })
}))

router.get("/:id", asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const result = await client.query(
    `SELECT id, part_number as "partNumber", name, description, category,
            supplier, unit_cost as "unitCost",
            quantity_on_hand as "quantityOnHand", reorder_point as "reorderPoint",
            reorder_quantity as "reorderQuantity", location,
            facility_id as "facilityId", metadata,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM parts_inventory
     WHERE id = $1 AND tenant_id = $2`,
    [req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Part not found' })
  }

  res.json({ data: result.rows[0] })
}))

router.post("/", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const parsed = createPartSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
  }

  const { partNumber, name, description, category, supplier, unitCost, quantityOnHand, reorderPoint, reorderQuantity, location, facilityId } = parsed.data

  const result = await client.query(
    `INSERT INTO parts_inventory (
      tenant_id, part_number, name, description, category, supplier,
      unit_cost, quantity_on_hand, reorder_point,
      reorder_quantity, location, facility_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, part_number as "partNumber", name, category, quantity_on_hand as "quantityOnHand"`,
    [tenantId, partNumber, name, description || null, category || null, supplier || null,
      unitCost || null, quantityOnHand || 0, reorderPoint || 0,
      reorderQuantity || 0, location || null, facilityId || null]
  )

  logger.info('Part created', { partId: result.rows[0].id, tenantId })
  res.status(201).json({ data: result.rows[0] })
}))

router.put("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const parsed = updatePartSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
  }

  const { name, description, category, supplier, unitCost, quantityOnHand, reorderPoint } = parsed.data

  const result = await client.query(
    `UPDATE parts_inventory
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         supplier = COALESCE($4, supplier),
         unit_cost = COALESCE($5, unit_cost),
         quantity_on_hand = COALESCE($6, quantity_on_hand),
         reorder_point = COALESCE($7, reorder_point),
         updated_at = NOW()
     WHERE id = $8 AND tenant_id = $9
     RETURNING id, part_number as "partNumber", name, quantity_on_hand as "quantityOnHand"`,
    [name, description, category, supplier, unitCost, quantityOnHand, reorderPoint, req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Part not found' })
  }

  logger.info('Part updated', { partId: req.params.id, tenantId })
  res.json({ data: result.rows[0] })
}))

router.delete("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const result = await client.query(
    'DELETE FROM parts_inventory WHERE id = $1 AND tenant_id = $2',
    [req.params.id, tenantId]
  )

  if ((result.rowCount ?? 0) === 0) {
    return res.status(404).json({ error: 'Part not found' })
  }

  logger.info('Part deleted', { partId: req.params.id, tenantId })
  res.json({ success: true, message: "Part deleted successfully" })
}))

export default router
