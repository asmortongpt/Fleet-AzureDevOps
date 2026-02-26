import { Router, Response } from "express"
import { z } from 'zod'

import { pool } from '../config/database'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { setTenantContext } from '../middleware/tenant-context'
import logger from '../config/logger'

const createVendorSchema = z.object({
  vendorName: z.string().min(1).max(200),
  vendorCode: z.string().optional(),
  vendorType: z.string().optional(),
  vendorCategory: z.string().optional(),
  vendorTier: z.string().optional(),
  vendorStatus: z.enum(['active', 'inactive', 'pending']).optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  paymentTerms: z.string().optional(),
  preferredVendor: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
})

const updateVendorSchema = createVendorSchema.extend({
  isActive: z.boolean().optional(),
}).partial()

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

  const result = await client.query(
    `SELECT id, vendor_name as "name", vendor_code as "code", vendor_type as "type",
            is_active as "isActive", vendor_status as "vendorStatus",
            vendor_category as "vendorCategory", vendor_tier as "vendorTier",
            contact_name as "contactName", contact_email as "contactEmail",
            contact_phone as "contactPhone", address, city, state,
            zip_code as "zipCode", preferred_vendor as "preferredVendor",
            payment_terms as "paymentTerms",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM vendors
     WHERE tenant_id = $1
     ORDER BY vendor_name ASC`,
    [tenantId]
  )

  res.json({ data: result.rows, total: result.rows.length })
}))

router.get("/:id", asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const result = await client.query(
    `SELECT id, vendor_name as "name", vendor_code as "code", vendor_type as "type",
            is_active as "isActive", vendor_status as "vendorStatus",
            vendor_category as "vendorCategory", vendor_tier as "vendorTier",
            contact_name as "contactName", contact_email as "contactEmail",
            contact_phone as "contactPhone", address, city, state,
            zip_code as "zipCode", payment_terms as "paymentTerms",
            preferred_vendor as "preferredVendor",
            notes, created_at as "createdAt", updated_at as "updatedAt"
     FROM vendors
     WHERE id = $1 AND tenant_id = $2`,
    [req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Vendor not found' })
  }

  res.json({ data: result.rows[0] })
}))

router.post("/", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const parsed = createVendorSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
  }

  const { vendorName, vendorCode, vendorType, vendorCategory, vendorTier, vendorStatus, contactName, contactEmail, contactPhone, address, city, state, zipCode, paymentTerms, preferredVendor, notes } = parsed.data

  const result = await client.query(
    `INSERT INTO vendors (
      tenant_id, vendor_name, vendor_code, vendor_type, vendor_category, vendor_tier,
      vendor_status, contact_name, contact_email, contact_phone,
      address, city, state, zip_code, payment_terms,
      preferred_vendor, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id, vendor_name as "name", vendor_type as "type", is_active as "isActive"`,
    [tenantId, vendorName, vendorCode || null, vendorType || null, vendorCategory || null,
      vendorTier || null, vendorStatus || 'active', contactName || null, contactEmail || null,
      contactPhone || null, address || null, city || null, state || null, zipCode || null,
      paymentTerms || null, preferredVendor || false, notes || null]
  )

  logger.info('Vendor created', { vendorId: result.rows[0].id, tenantId })
  res.status(201).json({ data: result.rows[0] })
}))

router.put("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const parsed = updateVendorSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues })
  }

  const { vendorName, vendorType, isActive, contactName, contactEmail, contactPhone, vendorStatus } = parsed.data

  const result = await client.query(
    `UPDATE vendors
     SET vendor_name = COALESCE($1, vendor_name),
         vendor_type = COALESCE($2, vendor_type),
         is_active = COALESCE($3, is_active),
         contact_name = COALESCE($4, contact_name),
         contact_email = COALESCE($5, contact_email),
         contact_phone = COALESCE($6, contact_phone),
         vendor_status = COALESCE($7, vendor_status),
         updated_at = NOW()
     WHERE id = $8 AND tenant_id = $9
     RETURNING id, vendor_name as "name", vendor_type as "type", is_active as "isActive"`,
    [vendorName, vendorType, isActive, contactName, contactEmail, contactPhone, vendorStatus, req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Vendor not found' })
  }

  logger.info('Vendor updated', { vendorId: req.params.id, tenantId })
  res.json({ data: result.rows[0] })
}))

router.delete("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const result = await client.query(
    'DELETE FROM vendors WHERE id = $1 AND tenant_id = $2',
    [req.params.id, tenantId]
  )

  if ((result.rowCount ?? 0) === 0) {
    return res.status(404).json({ error: 'Vendor not found' })
  }

  logger.info('Vendor deleted', { vendorId: req.params.id, tenantId })
  res.json({ success: true, message: "Vendor deleted successfully" })
}))

export default router
