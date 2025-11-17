import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission, preventSelfApproval, checkApprovalLimit } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import pool from '../config/database'
import { z } from 'zod'

const router = express.Router()
router.use(authenticateJWT)

// GET /purchase-orders
router.get(
  '/',
  requirePermission('purchase_order:view:global'),
  applyFieldMasking('purchase_order'),
  auditLog({ action: 'READ', resourceType: 'purchase_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT * FROM purchase_orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM purchase_orders WHERE tenant_id = $1',
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
      console.error('Get purchase-orders error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /purchase-orders/:id
router.get(
  '/:id',
  requirePermission('purchase_order:view:global'),
  applyFieldMasking('purchase_order'),
  auditLog({ action: 'READ', resourceType: 'purchase_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM purchase_orders WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase order not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get purchase-orders error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /purchase-orders
router.post(
  '/',
  requirePermission('purchase_order:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'purchase_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // Force status to 'draft' for new purchase orders
      data.status = 'draft'
      data.created_by = req.user!.id

      const columns = Object.keys(data)
      const values = Object.values(data)

      const placeholders = values.map((_, i) => `$${i + 2}`).join(', ')
      const columnNames = ['tenant_id', ...columns].join(', ')

      const result = await pool.query(
        `INSERT INTO purchase_orders (${columnNames}) VALUES ($1, ${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create purchase-orders error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /purchase-orders/:id/approve
router.put(
  '/:id/approve',
  requirePermission('purchase_order:approve:fleet'),
  preventSelfApproval('purchase_orders'),
  checkApprovalLimit('purchase_orders'),
  auditLog({ action: 'APPROVE', resourceType: 'purchase_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE purchase_orders SET
           status = 'approved',
           approved_by = $3,
           approved_at = NOW(),
           updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, req.user!.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase order not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Approve purchase-order error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /purchase-orders/:id
router.delete(
  '/:id',
  requirePermission('purchase_order:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'purchase_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM purchase_orders WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase order not found' })
      }

      res.json({ message: 'Purchase order deleted successfully' })
    } catch (error) {
      console.error('Delete purchase-orders error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
