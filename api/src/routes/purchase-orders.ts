import { Router, Response } from "express"

import { pool } from '../config/database'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { setTenantContext } from '../middleware/tenant-context'
import logger from '../config/logger'

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
    `SELECT po.id, po.number, po.vendor_id as "vendorId", v.name as "vendorName",
            po.status, po.order_date as "orderDate",
            po.expected_delivery_date as "expectedDeliveryDate",
            po.actual_delivery_date as "actualDeliveryDate",
            po.subtotal, po.tax_amount as "taxAmount", po.shipping_cost as "shippingCost",
            po.total_amount as "totalAmount", po.payment_status as "paymentStatus",
            po.paid_amount as "paidAmount",
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
    `SELECT po.id, po.number, po.vendor_id as "vendorId", v.name as "vendorName",
            po.status, po.order_date as "orderDate",
            po.expected_delivery_date as "expectedDeliveryDate",
            po.actual_delivery_date as "actualDeliveryDate",
            po.subtotal, po.tax_amount as "taxAmount", po.shipping_cost as "shippingCost",
            po.total_amount as "totalAmount", po.payment_status as "paymentStatus",
            po.paid_amount as "paidAmount", po.requested_by_id as "requestedById",
            po.approved_by_id as "approvedById", po.approved_at as "approvedAt",
            po.shipping_address as "shippingAddress", po.notes, po.line_items as "lineItems",
            po.metadata, po.created_at as "createdAt", po.updated_at as "updatedAt"
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

  const { number, vendorId, orderDate, expectedDeliveryDate, subtotal, taxAmount, shippingCost, totalAmount, shippingAddress, notes, lineItems } = req.body

  if (!number || !vendorId || !orderDate || !subtotal || !totalAmount) {
    return res.status(400).json({ error: 'Required fields: number, vendorId, orderDate, subtotal, totalAmount' })
  }

  const result = await client.query(
    `INSERT INTO purchase_orders (
      tenant_id, number, vendor_id, order_date, expected_delivery_date,
      subtotal, tax_amount, shipping_cost, total_amount, shipping_address,
      notes, line_items, requested_by_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id, number, status, total_amount as "totalAmount"`,
    [tenantId, number, vendorId, orderDate, expectedDeliveryDate || null,
      subtotal, taxAmount || 0, shippingCost || 0, totalAmount, shippingAddress || null,
      notes || null, lineItems ? JSON.stringify(lineItems) : null, userId]
  )

  logger.info('Purchase order created', { poId: result.rows[0].id, tenantId })
  res.status(201).json({ data: result.rows[0] })
}))

router.put("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const userId = req.user?.id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const { status, actualDeliveryDate, paymentStatus, paidAmount, notes } = req.body

  // Handle approval timestamp
  let approvedAt = null
  let approvedById = null
  if (status === 'approved') {
    approvedAt = new Date()
    approvedById = userId
  }

  const result = await client.query(
    `UPDATE purchase_orders 
     SET status = COALESCE($1, status),
         actual_delivery_date = COALESCE($2, actual_delivery_date),
         payment_status = COALESCE($3, payment_status),
         paid_amount = COALESCE($4, paid_amount),
         notes = COALESCE($5, notes),
         approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
         approved_by_id = CASE WHEN $1 = 'approved' THEN $6 ELSE approved_by_id END,
         updated_at = NOW()
     WHERE id = $7 AND tenant_id = $8
     RETURNING id, number, status, total_amount as "totalAmount"`,
    [status, actualDeliveryDate, paymentStatus, paidAmount, notes, userId, req.params.id, tenantId]
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
  res.json({ message: "Purchase order deleted successfully" })
}))

export default router
