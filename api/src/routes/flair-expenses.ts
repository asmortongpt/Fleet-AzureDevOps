import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /flair/expenses
router.get(
  '/expenses',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'flair_expenses' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, expenseType } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let whereClause = 'WHERE tenant_id = $1'
      const params: any[] = [req.user!.tenant_id]

      if (status) {
        params.push(status)
        whereClause += ` AND approval_status = $${params.length}`
      }
      if (expenseType) {
        params.push(expenseType)
        whereClause += ` AND expense_type = $${params.length}`
      }

      const result = await pool.query(
        `SELECT id, tenant_id, employee_id, employee_name, department,
                expense_type, amount, transaction_date, description,
                account_codes, supporting_documents, travel_details,
                approval_status, approval_history, created_at, updated_at
         FROM flair_expenses
         ${whereClause}
         ORDER BY transaction_date DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM flair_expenses ${whereClause}`,
        params
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / Number(limit))
        }
      })
    } catch (error) {
      logger.error('Get FLAIR expenses error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /flair/expenses/:id
router.get(
  '/expenses/:id',
  requirePermission('report:view:global'),
  auditLog({ action: 'READ', resourceType: 'flair_expenses' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, employee_id, employee_name, department,
                expense_type, amount, transaction_date, description,
                account_codes, supporting_documents, travel_details,
                approval_status, approval_history, created_at, updated_at
         FROM flair_expenses
         WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Expense not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get FLAIR expense error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /flair/expenses
router.post(
  '/expenses',
  csrfProtection,
  requirePermission('report:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'flair_expenses' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO flair_expenses (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Create FLAIR expense error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /flair/expenses/:id
router.put(
  '/expenses/:id',
  csrfProtection,
  requirePermission('report:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'flair_expenses' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE flair_expenses
         SET ${fields}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Expense not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Update FLAIR expense error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
