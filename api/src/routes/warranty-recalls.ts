import express, { Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

// ============================================================================
// Warranties
// ============================================================================
router.get(
  '/warranties',
  requirePermission('inventory:view:global'),
  auditLog({ action: 'READ', resourceType: 'warranty_records' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT
           w.id,
           w.tenant_id,
           w.inventory_item_id,
           w.part_number,
           w.part_name,
           w.vendor_id,
           COALESCE(v.name, w.vendor_name) as vendor_name,
           w.warranty_type,
           w.warranty_start_date,
           w.warranty_end_date,
           w.coverage_details,
           w.terms,
           w.status,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', c.id,
                 'claimNumber', c.claim_number,
                 'dateSubmitted', c.date_submitted,
                 'issueDescription', c.issue_description,
                 'claimType', c.claim_type,
                 'status', c.status,
                 'resolution', c.resolution,
                 'attachments', c.attachments
               )
             ) FILTER (WHERE c.id IS NOT NULL),
             '[]'::json
           ) as claim_history
         FROM warranty_records w
         LEFT JOIN warranty_claims c ON c.warranty_id = w.id
         LEFT JOIN vendors v ON v.id = w.vendor_id
         WHERE w.tenant_id = $1
         GROUP BY w.id, v.name
         ORDER BY w.warranty_end_date ASC
         LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM warranty_records WHERE tenant_id = $1`,
        [req.user!.tenant_id]
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
      logger.error('Get warranties error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.get(
  '/warranties/analytics',
  requirePermission('inventory:view:global'),
  auditLog({ action: 'READ', resourceType: 'warranty_records' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const statsResult = await pool.query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
          COUNT(*) FILTER (WHERE warranty_end_date <= CURRENT_DATE + INTERVAL '30 days' AND status = 'ACTIVE') as expiring_soon,
          COUNT(*) FILTER (WHERE warranty_end_date <= CURRENT_DATE + INTERVAL '90 days' AND status = 'ACTIVE') as expiring_90,
          COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired
         FROM warranty_records
         WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      const claimsResult = await pool.query(
        `SELECT
          COUNT(*) as total_claims,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
          COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
          COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected
         FROM warranty_claims
         WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      const stats = statsResult.rows[0]
      const claims = claimsResult.rows[0]
      const successRate = Number(claims.total_claims) > 0
        ? Math.round((Number(claims.approved) / Number(claims.total_claims)) * 100)
        : 0

      res.json({
        data: {
          activeWarranties: Number(stats.active) || 0,
          expiringWithin30Days: Number(stats.expiring_soon) || 0,
          expiringWithin90Days: Number(stats.expiring_90) || 0,
          totalClaims: Number(claims.total_claims) || 0,
          pendingClaims: Number(claims.pending) || 0,
          approvedClaims: Number(claims.approved) || 0,
          rejectedClaims: Number(claims.rejected) || 0,
          claimSuccessRate: successRate
        }
      })
    } catch (error) {
      logger.error('Warranty analytics error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.post(
  '/warranties/claims',
  csrfProtection,
  requirePermission('inventory:update:global'),
  auditLog({ action: 'CREATE', resourceType: 'warranty_claims' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        warrantyId,
        claimNumber,
        dateSubmitted,
        issueDescription,
        claimType,
        status,
        resolution,
        attachments
      } = req.body

      const result = await pool.query(
        `INSERT INTO warranty_claims (
           tenant_id, warranty_id, claim_number, date_submitted,
           issue_description, claim_type, status, resolution, attachments
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.user!.tenant_id,
          warrantyId,
          claimNumber,
          dateSubmitted,
          issueDescription || null,
          claimType,
          status || 'PENDING',
          resolution || null,
          attachments || []
        ]
      )

      res.status(201).json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Create warranty claim error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Recalls
// ============================================================================
router.get(
  '/recalls',
  requirePermission('inventory:view:global'),
  auditLog({ action: 'READ', resourceType: 'recall_notices' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT
           r.id,
           r.recall_number,
           r.title,
           r.description,
           r.severity,
           r.urgency,
           r.issued_by,
           r.date_issued,
           r.effective_date,
           r.compliance_deadline,
           r.affected_parts,
           r.remedy_description,
           r.vendor_contact,
           r.status,
           COALESCE(
             json_agg(
               json_build_object(
                 'partId', a.inventory_item_id,
                 'partNumber', i.part_number,
                 'location', a.location,
                 'actionRequired', a.action_required,
                 'complianceStatus', a.compliance_status
               )
             ) FILTER (WHERE a.id IS NOT NULL),
             '[]'::json
           ) as affected_inventory
         FROM recall_notices r
         LEFT JOIN recall_actions a ON a.recall_id = r.id
         LEFT JOIN inventory_items i ON i.id = a.inventory_item_id
         WHERE r.tenant_id = $1
         GROUP BY r.id
         ORDER BY r.date_issued DESC
         LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM recall_notices WHERE tenant_id = $1`,
        [req.user!.tenant_id]
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
      logger.error('Get recalls error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.get(
  '/recalls/analytics',
  requirePermission('inventory:view:global'),
  auditLog({ action: 'READ', resourceType: 'recall_notices' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const statsResult = await pool.query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed
         FROM recall_notices
         WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      const actionsResult = await pool.query(
        `SELECT
          COUNT(*) as affected_count,
          COUNT(*) FILTER (WHERE compliance_status = 'COMPLETED') as completed_actions,
          COUNT(*) FILTER (WHERE compliance_status = 'PENDING') as pending_actions
         FROM recall_actions
         WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      const stats = statsResult.rows[0]
      const actions = actionsResult.rows[0]
      const complianceRate = Number(actions.affected_count) > 0
        ? Math.round((Number(actions.completed_actions) / Number(actions.affected_count)) * 100)
        : 0

      res.json({
        data: {
          totalRecalls: Number(stats.total) || 0,
          activeRecalls: Number(stats.active) || 0,
          completedRecalls: Number(stats.completed) || 0,
          affectedItemsCount: Number(actions.affected_count) || 0,
          complianceRate,
          overdueActions: Number(actions.pending_actions) || 0
        }
      })
    } catch (error) {
      logger.error('Recall analytics error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
