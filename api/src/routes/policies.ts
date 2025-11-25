import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /policies
router.get(
  '/',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
<<<<<<< HEAD
        `SELECT id, tenant_id, policy_name, policy_content, is_active, created_at, updated_at FROM policies WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
=======
        `SELECT 
      id,
      tenant_id,
      name,
      description,
      category,
      content,
      version,
      is_active,
      effective_date,
      created_by,
      created_at,
      updated_at FROM policies WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
>>>>>>> feature/devsecops-audit-remediation
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM policies WHERE tenant_id = $1`,
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
      console.error('Get policies error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /policies/:id
router.get(
  '/:id',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
<<<<<<< HEAD
        'SELECT id, tenant_id, policy_name, policy_content, is_active, created_at, updated_at FROM policies WHERE id = $1 AND tenant_id = $2',
=======
        `SELECT
      id,
      tenant_id,
      name,
      description,
      category,
      content,
      version,
      is_active,
      effective_date,
      created_by,
      created_at,
      updated_at FROM policies WHERE id = $1 AND tenant_id = $2`,
>>>>>>> feature/devsecops-audit-remediation
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policies not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get policies error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /policies (SafetyOfficer can create)
router.post(
  '/',
  requirePermission('policy:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO policies (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create policies error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /policies/:id (FleetAdmin only for deployment)
router.put(
  '/:id',
  requirePermission('policy:deploy:global'),
  auditLog({ action: 'UPDATE', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE policies SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policies not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update policies error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /policies/:id
router.delete(
  '/:id',
  requirePermission('policy:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM policies WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Policies not found' })
      }

      res.json({ message: 'Policies deleted successfully' })
    } catch (error) {
      console.error('Delete policies error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
