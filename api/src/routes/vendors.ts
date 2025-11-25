import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { createVendorSchema, updateVendorSchema } from '../validation/schemas'

const router = express.Router()
router.use(authenticateJWT)

// GET /vendors
router.get(
  '/',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
<<<<<<< HEAD
        `SELECT id, tenant_id, vendor_name, contact_person, email, phone, address, city, state, zip, specialties, rating, is_active, created_at, updated_at FROM vendors WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
=======
        `SELECT id, tenant_id, name, contact_name, contact_email, contact_phone, address, is_active, created_at, updated_at
         FROM vendors WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
>>>>>>> feature/devsecops-audit-remediation
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM vendors WHERE tenant_id = $1',
        [req.user!.tenant_id]
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      console.error('Get vendors error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /vendors/:id
router.get(
  '/:id',
  requirePermission('vendor:view:global'),
  auditLog({ action: 'READ', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
<<<<<<< HEAD
        'SELECT id, tenant_id, vendor_name, contact_person, email, phone, address, city, state, zip, specialties, rating, is_active, created_at, updated_at FROM vendors WHERE id = $1 AND tenant_id = $2',
=======
        'SELECT id, tenant_id, name, contact_name, contact_email, contact_phone, address, is_active, created_at, updated_at FROM vendors WHERE id = $1 AND tenant_id = $2',
>>>>>>> feature/devsecops-audit-remediation
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vendors not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get vendors error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /vendors
router.post(
  '/',
  requirePermission('vendor:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate and filter input data
      const validatedData = createVendorSchema.parse(req.body)

      // Build INSERT with field whitelisting to prevent mass assignment
      const { columnNames, placeholders, values } = buildInsertClause(
        validatedData,
        ['tenant_id'],
        1,
        'vendors'
      )

      const result = await pool.query(
        `INSERT INTO vendors (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Create vendors error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /vendors/:id
router.put(
  '/:id',
  requirePermission('vendor:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate and filter input data
      const validatedData = updateVendorSchema.parse(req.body)

      // Build UPDATE with field whitelisting to prevent mass assignment
      const { fields, values } = buildUpdateClause(validatedData, 3, 'vendors')

      const result = await pool.query(
        `UPDATE vendors SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vendors not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Update vendors error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /vendors/:id
router.delete(
  '/:id',
  requirePermission('vendor:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'vendors' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM vendors WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vendors not found' })
      }

      res.json({ message: 'Vendors deleted successfully' })
    } catch (error) {
      console.error('Delete vendors error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
