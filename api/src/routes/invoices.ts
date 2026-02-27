import { Router, Response } from "express"
import { z } from 'zod'

import { pool } from '../config/database'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { setTenantContext } from '../middleware/tenant-context'
import logger from '../config/logger'

import { flexUuid } from '../middleware/validation'

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(100),
  invoiceType: z.enum(['standard', 'credit', 'debit', 'proforma', 'recurring']),
  vendorId: flexUuid.optional(),
  poId: flexUuid.optional(),
  poNumber: z.string().optional(),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
  shippingAmount: z.number().min(0).optional(),
  adjustmentAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0),
  currency: z.string().max(3).optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(z.record(z.string(), z.unknown())).optional(),
  costCenter: z.string().optional(),
  projectCode: z.string().optional(),
  glAccount: z.string().optional(),
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

  const { status, type, vendorId, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  let whereClause = 'WHERE i.tenant_id = $1'
  const params: (string | number | boolean | null | undefined)[] = [tenantId]

  if (status && typeof status === 'string') {
    params.push(status)
    whereClause += ` AND i.payment_status = $${params.length}`
  }

  if (type && typeof type === 'string') {
    params.push(type)
    whereClause += ` AND i.invoice_type = $${params.length}`
  }

  if (vendorId && typeof vendorId === 'string') {
    params.push(vendorId)
    whereClause += ` AND i.vendor_id = $${params.length}`
  }

  const result = await client.query(
    `SELECT i.id, i.invoice_number as "number", i.invoice_type as "type",
            i.vendor_id as "vendorId",
            v.vendor_name as "vendorName", i.payment_status as "status",
            i.invoice_date as "invoiceDate",
            i.due_date as "dueDate", i.paid_at as "paidDate",
            i.subtotal, i.tax_amount as "taxAmount", i.discount_amount as "discountAmount",
            i.total_amount as "totalAmount", i.paid_amount as "paidAmount",
            i.shipping_amount as "shippingAmount", i.currency,
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
    `SELECT i.id, i.invoice_number as "number", i.invoice_type as "type",
            i.vendor_id as "vendorId",
            v.vendor_name as "vendorName", i.po_id as "purchaseOrderId",
            i.po_number as "poNumber",
            i.payment_status as "status", i.approval_status as "approvalStatus",
            i.invoice_date as "invoiceDate", i.due_date as "dueDate",
            i.paid_at as "paidDate", i.received_date as "receivedDate",
            i.subtotal, i.tax_amount as "taxAmount",
            i.discount_amount as "discountAmount", i.total_amount as "totalAmount",
            i.paid_amount as "paidAmount",
            i.shipping_amount as "shippingAmount", i.adjustment_amount as "adjustmentAmount",
            i.currency, i.cost_center as "costCenter", i.project_code as "projectCode",
            i.gl_account as "glAccount",
            i.notes, i.line_items as "lineItems",
            i.attached_documents as "attachedDocuments",
            i.created_at as "createdAt", i.updated_at as "updatedAt"
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

  const parsed = createInvoiceSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
  }
  const userId = (req as AuthRequest).user?.id
  const { invoiceNumber, invoiceType, vendorId, poId, poNumber, invoiceDate, dueDate, subtotal, taxAmount, shippingAmount, adjustmentAmount, discountAmount, totalAmount, currency, notes, lineItems, costCenter, projectCode, glAccount } = parsed.data

  const result = await client.query(
    `INSERT INTO invoices (
      tenant_id, invoice_number, invoice_type, vendor_id, po_id, po_number, invoice_date,
      due_date, subtotal, tax_amount, shipping_amount, adjustment_amount,
      discount_amount, total_amount, currency,
      notes, line_items, cost_center, project_code, gl_account, created_by_user_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    RETURNING id, invoice_number as "number", invoice_type as "type", payment_status as "status", total_amount as "totalAmount"`,
    [tenantId, invoiceNumber, invoiceType, vendorId || null, poId || null, poNumber || null,
      invoiceDate, dueDate, subtotal, taxAmount || 0, shippingAmount || 0, adjustmentAmount || 0,
      discountAmount || 0, totalAmount, currency || 'USD',
      notes || null, lineItems ? JSON.stringify(lineItems) : null,
      costCenter || null, projectCode || null, glAccount || null, userId]
  )

  logger.info('Invoice created', { invoiceId: result.rows[0].id, tenantId })
  res.status(201).json({ data: result.rows[0] })
}))

const updateInvoiceSchema = z.object({
  paymentStatus: z.enum(['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'void']).optional(),
  approvalStatus: z.string().optional(),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  paidAmount: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
})

router.put("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const parsed = updateInvoiceSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
  }
  const { paymentStatus, approvalStatus, paidAt, paidAmount, notes } = parsed.data

  const result = await client.query(
    `UPDATE invoices
     SET payment_status = COALESCE($1, payment_status),
         approval_status = COALESCE($2, approval_status),
         paid_at = COALESCE($3, paid_at),
         paid_amount = COALESCE($4, paid_amount),
         notes = COALESCE($5, notes),
         updated_at = NOW()
     WHERE id = $6 AND tenant_id = $7
     RETURNING id, invoice_number as "number", payment_status as "status", total_amount as "totalAmount"`,
    [paymentStatus, approvalStatus, paidAt, paidAmount, notes, req.params.id, tenantId]
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
  res.json({ success: true, message: "Invoice deleted successfully" })
}))

export default router
