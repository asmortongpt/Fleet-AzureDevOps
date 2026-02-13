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

  const { status, type, vendorId, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  let whereClause = 'WHERE i.tenant_id = $1'
  const params: (string | number | boolean | null | undefined)[] = [tenantId]

  if (status && typeof status === 'string') {
    params.push(status)
    whereClause += ` AND i.status = $${params.length}`
  }

  if (type && typeof type === 'string') {
    params.push(type)
    whereClause += ` AND i.type = $${params.length}`
  }

  if (vendorId && typeof vendorId === 'string') {
    params.push(vendorId)
    whereClause += ` AND i.vendor_id = $${params.length}`
  }

  const result = await client.query(
    `SELECT i.id, i.number, i.type, i.vendor_id as "vendorId",
            v.name as "vendorName", i.status, i.invoice_date as "invoiceDate",
            i.due_date as "dueDate", i.paid_date as "paidDate",
            i.subtotal, i.tax_amount as "taxAmount", i.discount_amount as "discountAmount",
            i.total_amount as "totalAmount", i.paid_amount as "paidAmount",
            i.balance_due as "balanceDue", i.payment_method as "paymentMethod",
            i.created_at as "createdAt", i.updated_at as "updatedAt"
     FROM invoices i
     LEFT JOIN vendors v ON i.vendor_id = v.id
     ${whereClause}
     ORDER BY i.invoice_date DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  const countResult = await client.query(
    `SELECT COUNT(*) FROM invoices i ${whereClause}`,
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
    `SELECT i.id, i.number, i.type, i.vendor_id as "vendorId",
            v.name as "vendorName", i.purchase_order_id as "purchaseOrderId",
            i.status, i.invoice_date as "invoiceDate", i.due_date as "dueDate",
            i.paid_date as "paidDate", i.subtotal, i.tax_amount as "taxAmount",
            i.discount_amount as "discountAmount", i.total_amount as "totalAmount",
            i.paid_amount as "paidAmount", i.balance_due as "balanceDue",
            i.payment_method as "paymentMethod", i.payment_reference as "paymentReference",
            i.notes, i.line_items as "lineItems", i.document_url as "documentUrl",
            i.metadata, i.created_at as "createdAt", i.updated_at as "updatedAt"
     FROM invoices i
     LEFT JOIN vendors v ON i.vendor_id = v.id
     WHERE i.id = $1 AND i.tenant_id = $2`,
    [req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Invoice not found' })
  }

  res.json({ data: result.rows[0] })
}))

router.post("/", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const { number, type, vendorId, purchaseOrderId, invoiceDate, dueDate, subtotal, taxAmount, discountAmount, totalAmount, balanceDue, notes, lineItems, documentUrl } = req.body

  if (!number || !type || !invoiceDate || !dueDate || !subtotal || !totalAmount || !balanceDue) {
    return res.status(400).json({ error: 'Required fields: number, type, invoiceDate, dueDate, subtotal, totalAmount, balanceDue' })
  }

  const result = await client.query(
    `INSERT INTO invoices (
      tenant_id, number, type, vendor_id, purchase_order_id, invoice_date,
      due_date, subtotal, tax_amount, discount_amount, total_amount, balance_due,
      notes, line_items, document_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id, number, type, status, total_amount as "totalAmount"`,
    [tenantId, number, type, vendorId || null, purchaseOrderId || null, invoiceDate,
      dueDate, subtotal, taxAmount || 0, discountAmount || 0, totalAmount, balanceDue,
      notes || null, lineItems ? JSON.stringify(lineItems) : null, documentUrl || null]
  )

  logger.info('Invoice created', { invoiceId: result.rows[0].id, tenantId })
  res.status(201).json({ data: result.rows[0] })
}))

router.put("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const { status, paidDate, paidAmount, paymentMethod, paymentReference, notes } = req.body

  // Calculate balance_due if paid_amount is provided
  let updateBalanceDue = ''
  if (paidAmount !== undefined) {
    updateBalanceDue = ', balance_due = total_amount - $5'
  }

  const result = await client.query(
    `UPDATE invoices 
     SET status = COALESCE($1, status),
         paid_date = COALESCE($2, paid_date),
         paid_amount = COALESCE($3, paid_amount),
         payment_method = COALESCE($4, payment_method),
         payment_reference = COALESCE($5, payment_reference),
         notes = COALESCE($6, notes),
         updated_at = NOW()
     WHERE id = $7 AND tenant_id = $8
     RETURNING id, number, status, total_amount as "totalAmount", balance_due as "balanceDue"`,
    [status, paidDate, paidAmount, paymentMethod, paymentReference, notes, req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Invoice not found' })
  }

  logger.info('Invoice updated', { invoiceId: req.params.id, tenantId })
  res.json({ data: result.rows[0] })
}))

router.delete("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const result = await client.query(
    'DELETE FROM invoices WHERE id = $1 AND tenant_id = $2',
    [req.params.id, tenantId]
  )

  if ((result.rowCount ?? 0) === 0) {
    return res.status(404).json({ error: 'Invoice not found' })
  }

  logger.info('Invoice deleted', { invoiceId: req.params.id, tenantId })
  res.json({ message: "Invoice deleted successfully" })
}))

export default router
