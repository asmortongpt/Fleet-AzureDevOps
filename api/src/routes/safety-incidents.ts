import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { applyFieldMasking } from '../utils/fieldMasking'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /safety-incidents
router.get(
  '/',
  requirePermission('safety_incident:view:global'),
  applyFieldMasking('safety_incident'),
  auditLog({ action: 'READ', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        'SELECT id, tenant_id, vehicle_id, incident_type, severity, description, location, incident_date, reporter_id, created_at, updated_at FROM safety_incidents WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM safety_incidents WHERE tenant_id = $1',
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
      console.error('Get safety-incidents error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /safety-incidents/:id
router.get(
  '/:id',
  requirePermission('safety_incident:view:global'),
  applyFieldMasking('safety_incident'),
  auditLog({ action: 'READ', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, tenant_id, vehicle_id, incident_type, severity, description, location, incident_date, reporter_id, created_at, updated_at FROM safety_incidents WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'SafetyIncidents not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get safety-incidents error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /safety-incidents
router.post(
  '/',
  requirePermission('safety_incident:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // Auto-generate incident_number
      const incidentNumberResult = await pool.query(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_num
         FROM safety_incidents
         WHERE tenant_id = $1',
        [req.user!.tenant_id]
      )
      const incidentNumber = 'INC-${String(incidentNumberResult.rows[0].next_num).padStart(6, '0')}`

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id', 'incident_number', 'reported_by'],
        1
      )

      const result = await pool.query(
        `INSERT INTO safety_incidents (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, incidentNumber, ...values, req.user!.id]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create safety-incidents error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /safety-incidents/:id/approve
router.put(
  '/:id/approve',
  requirePermission('safety_incident:approve:global'),
  auditLog({ action: 'APPROVE', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Prevent self-approval (Separation of Duties)
      const checkResult = await pool.query(
        'SELECT reported_by FROM safety_incidents WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Safety incident not found' })
      }

      if (checkResult.rows[0].reported_by === req.user!.id) {
        return res.status(403).json({
          error: 'Separation of Duties violation: You cannot approve incidents you reported'
        })
      }

      const result = await pool.query(
        `UPDATE safety_incidents SET
           status = 'approved',
           approved_by = $3,
           approved_at = NOW(),
           updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, req.user!.id]
      )

      res.json(result.rows[0])
    } catch (error) {
      console.error('Approve safety-incident error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /safety-incidents/:id
router.delete(
  '/:id',
  requirePermission('safety_incident:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM safety_incidents WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'SafetyIncidents not found' })
      }

      res.json({ message: 'SafetyIncidents deleted successfully' })
    } catch (error) {
      console.error('Delete safety-incidents error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
