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
  const client = (req as any).dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const result = await client.query(
    `SELECT id, name, code, type, is_active as "isActive", 
            contact_name as "contactName", contact_email as "contactEmail",
            contact_phone as "contactPhone", address, city, state,
            zip_code as "zipCode", country, website, rating, metadata,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM vendors 
     WHERE tenant_id = $1 
     ORDER BY name ASC`,
    [tenantId]
  )

  res.json({ data: result.rows, total: result.rows.length })
}))

router.get("/:id", asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = (req as any).dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const result = await client.query(
    `SELECT id, name, code, type, is_active as "isActive", 
            contact_name as "contactName", contact_email as "contactEmail",
            contact_phone as "contactPhone", address, city, state,
            zip_code as "zipCode", country, website, tax_id as "taxId",
            payment_terms as "paymentTerms", preferred_vendor as "preferredVendor",
            rating, notes, metadata, created_at as "createdAt", updated_at as "updatedAt"
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
  const client = (req as any).dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const { name, code, type, contactName, contactEmail, contactPhone, address, city, state, zipCode, country, website, taxId, paymentTerms, preferredVendor, rating, notes } = req.body

  const result = await client.query(
    `INSERT INTO vendors (
      tenant_id, name, code, type, contact_name, contact_email, contact_phone,
      address, city, state, zip_code, country, website, tax_id, payment_terms,
      preferred_vendor, rating, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING id, name, type, is_active as "isActive"`,
    [tenantId, name, code || null, type || null, contactName || null, contactEmail || null,
      contactPhone || null, address || null, city || null, state || null, zipCode || null,
      country || 'USA', website || null, taxId || null, paymentTerms || null,
      preferredVendor || false, rating || null, notes || null]
  )

  logger.info('Vendor created', { vendorId: result.rows[0].id, tenantId })
  res.status(201).json({ data: result.rows[0] })
}))

router.put("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = (req as any).dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const { name, type, isActive, contactName, contactEmail, contactPhone, rating } = req.body

  const result = await client.query(
    `UPDATE vendors 
     SET name = COALESCE($1, name),
         type = COALESCE($2, type),
         is_active = COALESCE($3, is_active),
         contact_name = COALESCE($4, contact_name),
         contact_email = COALESCE($5, contact_email),
         contact_phone = COALESCE($6, contact_phone),
         rating = COALESCE($7, rating),
         updated_at = NOW()
     WHERE id = $8 AND tenant_id = $9
     RETURNING id, name, type, is_active as "isActive"`,
    [name, type, isActive, contactName, contactEmail, contactPhone, rating, req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Vendor not found' })
  }

  logger.info('Vendor updated', { vendorId: req.params.id, tenantId })
  res.json({ data: result.rows[0] })
}))

router.delete("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = (req as any).dbClient

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
  res.json({ message: "Vendor deleted successfully" })
}))

export default router
