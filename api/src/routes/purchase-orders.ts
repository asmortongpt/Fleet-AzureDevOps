import { Router, Response } from "express"
import { z } from 'zod'

import { pool } from '../config/database'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { setTenantContext } from '../middleware/tenant-context'
import logger from '../config/logger'

import { flexUuid } from '../middleware/validation'

const createPurchaseOrderSchema = z.object({
  poNumber: z.string().min(1).max(100),
  vendorId: flexUuid,
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  expectedDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  subtotal: z.number().min(0),
  tax: z.number().min(0).optional(),
  shipping: z.number().min(0).optional(),
  total: z.number().min(0),
  shippingAddress: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(z.record(z.string(), z.unknown())).optional(),
  poType: z.string().optional(),
  poCategory: z.string().optional(),
  urgencyLevel: z.string().optional(),
})

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

  const { status, vendorId, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  let whereClause = 'WHERE po.tenant_id = $1'
  const params: (string | number | boolean | null | undefined)[] = [tenantId]

  if (status && typeof status === 'string') {
    params.push(status)
    whereClause += ` AND po.status = $${params.length}`
  }

  if (vendorId && typeof vendorId === 'string') {
    params.push(vendorId)
    whereClause += ` AND po.vendor_id = $${params.length}`
  }

  const result = await client.query(
    `SELECT po.id, po.po_number as "number", po.vendor_id as "vendorId",
            v.vendor_name as "vendorName",
            po.status, po.order_date as "orderDate",
            po.expected_delivery_date as "expectedDeliveryDate",
            po.actual_delivery_date as "actualDeliveryDate",
            po.subtotal, po.tax as "taxAmount", po.shipping as "shippingCost",
            po.total as "totalAmount",
            po.workflow_status as "workflowStatus",
            po.created_at as "createdAt", po.updated_at as "updatedAt"
     FROM purchase_orders po
     LEFT JOIN vendors v ON po.vendor_id = v.id
     ${whereClause}
     ORDER BY po.order_date DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  const countResult = await client.query(
    `SELECT COUNT(*) FROM purchase_orders po ${whereClause}`,
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
    `SELECT po.id, po.po_number as "number", po.vendor_id as "vendorId",
            v.vendor_name as "vendorName",
            po.status, po.order_date as "orderDate",
            po.expected_delivery_date as "expectedDeliveryDate",
            po.actual_delivery_date as "actualDeliveryDate",
            po.subtotal, po.tax as "taxAmount", po.shipping as "shippingCost",
            po.total as "totalAmount",
            po.created_by as "createdBy", po.approved_by as "approvedBy",
            po.approved_at as "approvedAt",
            po.po_type as "poType", po.po_category as "poCategory",
            po.urgency_level as "urgencyLevel", po.workflow_status as "workflowStatus",
            po.shipping_address as "shippingAddress", po.notes, po.line_items as "lineItems",
            po.created_at as "createdAt", po.updated_at as "updatedAt"
     FROM purchase_orders po
     LEFT JOIN vendors v ON po.vendor_id = v.id
     WHERE po.id = $1 AND po.tenant_id = $2`,
    [req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Purchase order not found' })
  }

  res.json({ data: result.rows[0] })
}))

router.post("/", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const userId = req.user?.id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const parsed = createPurchaseOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
  }
  const { poNumber, vendorId, orderDate, expectedDeliveryDate, subtotal, tax, shipping, total, shippingAddress, notes, lineItems, poType, poCategory, urgencyLevel } = parsed.data

  const result = await client.query(
    `INSERT INTO purchase_orders (
      tenant_id, po_number, vendor_id, order_date, expected_delivery_date,
      subtotal, tax, shipping, special_instructions,
      notes, line_items, created_by, po_type, po_category, urgency_level
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id, po_number as "number", status, total as "totalAmount"`,
    [tenantId, poNumber, vendorId, orderDate, expectedDeliveryDate || null,
      subtotal, tax || 0, shipping || 0, shippingAddress || null,
      notes || null, lineItems ? JSON.stringify(lineItems) : null, userId,
      poType || null, poCategory || null, urgencyLevel || null]
  )

  logger.info('Purchase order created', { poId: result.rows[0].id, tenantId })
  res.status(201).json({ data: result.rows[0] })
}))

const updatePurchaseOrderSchema = z.object({
  status: z.enum(['draft', 'pending', 'approved', 'ordered', 'received', 'cancelled']).optional(),
  actualDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  workflowStatus: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

router.put("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const userId = req.user?.id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const parsed = updatePurchaseOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
  }
  const { status, actualDeliveryDate, workflowStatus, notes } = parsed.data

  const result = await client.query(
    `UPDATE purchase_orders
     SET status = COALESCE($1, status),
         actual_delivery_date = COALESCE($2, actual_delivery_date),
         workflow_status = COALESCE($3, workflow_status),
         notes = COALESCE($4, notes),
         approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
         approved_by = CASE WHEN $1 = 'approved' THEN $5 ELSE approved_by END,
         updated_at = NOW()
     WHERE id = $6 AND tenant_id = $7
     RETURNING id, po_number as "number", status, total as "totalAmount"`,
    [status, actualDeliveryDate, workflowStatus, notes, userId, req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Purchase order not found' })
  }

  logger.info('Purchase order updated', { poId: req.params.id, tenantId })
  res.json({ data: result.rows[0] })
}))

router.delete("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const result = await client.query(
    'DELETE FROM purchase_orders WHERE id = $1 AND tenant_id = $2',
    [req.params.id, tenantId]
  )

  if ((result.rowCount ?? 0) === 0) {
    return res.status(404).json({ error: 'Purchase order not found' })
  }

  logger.info('Purchase order deleted', { poId: req.params.id, tenantId })
  res.json({ success: true, message: "Purchase order deleted successfully" })
}))

export default router
