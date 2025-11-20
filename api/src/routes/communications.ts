import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { cacheMiddleware, invalidateOnWrite, CacheStrategies } from '../middleware/cache'

const router = express.Router()
router.use(authenticateJWT)

// ============================================================================
// Communications - Universal contextual communications system
// ============================================================================

// GET /communications (CACHED: 5 minutes, vary by tenant and query params)
router.get(
  '/',
  requirePermission('communication:view:global'),
  cacheMiddleware({ ttl: 300000, varyByTenant: true, varyByQuery: true }),
  auditLog({ action: 'READ', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        communication_type,
        category,
        priority,
        status,
        search
      } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT c.*,
               from_user.first_name || ' ' || from_user.last_name as from_user_name,
               COUNT(DISTINCT cel.id) as linked_entities_count
        FROM communications c
        LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
        LEFT JOIN communication_entity_links cel ON c.id = cel.communication_id
        WHERE (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (communication_type) {
        query += ` AND c.communication_type = $${paramIndex}`
        params.push(communication_type)
        paramIndex++
      }

      if (category) {
        query += ` AND (c.ai_detected_category = $${paramIndex} OR c.manual_category = $${paramIndex})`
        params.push(category)
        paramIndex++
      }

      if (priority) {
        query += ` AND (c.ai_detected_priority = $${paramIndex} OR c.manual_priority = $${paramIndex})`
        params.push(priority)
        paramIndex++
      }

      if (status) {
        query += ` AND c.status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      if (search) {
        query += ` AND (
          c.subject ILIKE $${paramIndex} OR
          c.body ILIKE $${paramIndex} OR
          c.from_contact_name ILIKE $${paramIndex}
        )`
        params.push(`%${search}%`)
        paramIndex++
      }

      query += ` GROUP BY c.id, from_user.first_name, from_user.last_name`
      query += ` ORDER BY c.communication_datetime DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(DISTINCT c.id)
        FROM communications c
        LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
        WHERE (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
      `
      const countResult = await pool.query(countQuery, [req.user!.tenant_id])

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
      console.error('Get communications error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /communications/:id (CACHED: 5 minutes)
router.get(
  '/:id',
  requirePermission('communication:view:global'),
  CacheStrategies.mediumLived,
  auditLog({ action: 'READ', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT c.*,
                from_user.first_name || ' ' || from_user.last_name as from_user_name
         FROM communications c
         LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
         WHERE c.id = $1`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Communication not found' })
      }

      // Get linked entities
      const linksResult = await pool.query(
        `SELECT entity_type, entity_id, link_type, relevance_score, auto_detected
         FROM communication_entity_links
         WHERE communication_id = $1
         ORDER BY relevance_score DESC`,
        [req.params.id]
      )

      // Get attachments
      const attachmentsResult = await pool.query(
        `SELECT * FROM communication_attachments WHERE communication_id = $1`,
        [req.params.id]
      )

      res.json({
        ...result.rows[0],
        linked_entities: linksResult.rows,
        attachments: attachmentsResult.rows
      })
    } catch (error) {
      console.error('Get communication error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /communications (INVALIDATE CACHE on write)
router.post(
  '/',
  requirePermission('communication:send:global'),
  invalidateOnWrite('communications'),
  auditLog({ action: 'CREATE', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { linked_entities, ...data } = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['created_by'],
        1
      )

      const result = await pool.query(
        `INSERT INTO communications (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.id, ...values]
      )

      const communicationId = result.rows[0].id

      // Link entities if provided (FIXED: Batch insert to avoid N+1 query)
      if (linked_entities && Array.isArray(linked_entities) && linked_entities.length > 0) {
        // Build batch insert query
        const values: any[] = []
        const placeholders: string[] = []

        linked_entities.forEach((link, index) => {
          const baseIndex = index * 4 + 1
          placeholders.push(`($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`)
          values.push(
            communicationId,
            link.entity_type,
            link.entity_id,
            link.link_type || 'Related'
          )
        })

        // Single batch insert instead of N queries
        await pool.query(
          `INSERT INTO communication_entity_links (communication_id, entity_type, entity_id, link_type, manually_added)
           VALUES ${placeholders.join(', ')}
           ON CONFLICT (communication_id, entity_type, entity_id) DO NOTHING`,
          values
        )
      }

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create communication error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /communications/:id (INVALIDATE CACHE on write)
router.put(
  '/:id',
  requirePermission('communication:send:global'),
  invalidateOnWrite('communications'),
  auditLog({ action: 'UPDATE', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const fields = Object.keys(data)
        .map((key, i) => `${key} = $${i + 3}`)
        .join(', ')
      const values = Object.values(data)

      const result = await pool.query(
        `UPDATE communications
         SET ${fields}, updated_at = NOW(), updated_by = $2
         WHERE id = $1
         RETURNING *`,
        [req.params.id, req.user!.id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Communication not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update communication error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Entity Links - Link communications to vehicles, drivers, maintenance, etc.
// ============================================================================

// POST /communications/:id/link
router.post(
  '/:id/link',
  requirePermission('communication:send:global'),
  auditLog({ action: 'CREATE', resourceType: 'communication_entity_links' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { entity_type, entity_id, link_type = 'Related' } = req.body

      const result = await pool.query(
        `INSERT INTO communication_entity_links (communication_id, entity_type, entity_id, link_type, manually_added)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (communication_id, entity_type, entity_id) DO UPDATE
         SET link_type = $4
         RETURNING *`,
        [req.params.id, entity_type, entity_id, link_type]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Link communication to entity error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /communications/:id/link/:link_id
router.delete(
  '/:id/link/:link_id',
  requirePermission('communication:send:global'),
  auditLog({ action: 'DELETE', resourceType: 'communication_entity_links' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `DELETE FROM communication_entity_links
         WHERE id = $1 AND communication_id = $2
         RETURNING id`,
        [req.params.link_id, req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Link not found' })
      }

      res.json({ message: 'Link deleted successfully' })
    } catch (error) {
      console.error('Delete communication link error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Entity Communications - Get all communications for a specific entity
// ============================================================================

// GET /communications/entity/:entity_type/:entity_id
router.get(
  '/entity/:entity_type/:entity_id',
  requirePermission('communication:view:global'),
  auditLog({ action: 'READ', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { entity_type, entity_id } = req.params
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT c.*,
                cel.link_type,
                cel.relevance_score,
                from_user.first_name || ' ' || from_user.last_name as from_user_name
         FROM communications c
         JOIN communication_entity_links cel ON c.id = cel.communication_id
         LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
         WHERE cel.entity_type = $1 AND cel.entity_id = $2
         ORDER BY c.communication_datetime DESC
         LIMIT $3 OFFSET $4`,
        [entity_type, entity_id, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*)
         FROM communication_entity_links
         WHERE entity_type = $1 AND entity_id = $2`,
        [entity_type, entity_id]
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
      console.error('Get entity communications error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Follow-ups Dashboard
// ============================================================================

// GET /communications/follow-ups/pending (CACHED: 1 minute, critical data)
router.get(
  '/follow-ups/pending',
  requirePermission('communication:view:global'),
  CacheStrategies.shortLived,
  auditLog({ action: 'READ', resourceType: 'communications_followups' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT c.*,
                from_user.first_name || ' ' || from_user.last_name as from_user_name,
                CASE
                  WHEN c.follow_up_by_date < CURRENT_DATE THEN 'Overdue'
                  WHEN c.follow_up_by_date = CURRENT_DATE THEN 'Due Today'
                  ELSE 'Upcoming'
                END AS follow_up_status,
                COUNT(DISTINCT cel.id) as linked_entities_count
         FROM communications c
         LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
         LEFT JOIN communication_entity_links cel ON c.id = cel.communication_id
         WHERE c.requires_follow_up = TRUE
           AND c.follow_up_completed = FALSE
           AND c.status != 'Closed'
           AND (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
         GROUP BY c.id, from_user.first_name, from_user.last_name
         ORDER BY c.follow_up_by_date ASC NULLS LAST`,
        [req.user!.tenant_id]
      )

      res.json({ data: result.rows })
    } catch (error) {
      console.error('Get pending follow-ups error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Communication Templates
// ============================================================================

// GET /communications/templates
router.get(
  '/templates',
  requirePermission('communication:view:global'),
  auditLog({ action: 'READ', resourceType: 'communication_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { category } = req.query

      let query = `SELECT * FROM communication_templates WHERE is_active = TRUE`
      const params: any[] = []

      if (category) {
        query += ` AND template_category = $1`
        params.push(category)
      }

      query += ` ORDER BY template_name`

      const result = await pool.query(query, params)
      res.json({ data: result.rows })
    } catch (error) {
      console.error('Get communication templates error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /communications/templates
router.post(
  '/templates',
  requirePermission('communication:broadcast:global'),
  auditLog({ action: 'CREATE', resourceType: 'communication_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['created_by'],
        1
      )

      const result = await pool.query(
        `INSERT INTO communication_templates (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create communication template error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Dashboard & Analytics
// ============================================================================

// GET /communications/dashboard (CACHED: 2 minutes for performance)
router.get(
  '/dashboard',
  requirePermission('communication:view:global'),
  cacheMiddleware({ ttl: 120000, varyByTenant: true }),
  auditLog({ action: 'READ', resourceType: 'communications_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Total communications this month
      const totalResult = await pool.query(
        `SELECT COUNT(*) as total,
                COUNT(CASE WHEN requires_follow_up = TRUE AND follow_up_completed = FALSE THEN 1 END) as pending_followups
         FROM communications c
         LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
         WHERE (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
         AND c.communication_datetime >= DATE_TRUNC('month', CURRENT_DATE)`,
        [req.user!.tenant_id]
      )

      // By type
      const byTypeResult = await pool.query(
        `SELECT communication_type, COUNT(*) as count
         FROM communications c
         LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
         WHERE (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
         AND c.communication_datetime >= DATE_TRUNC('month', CURRENT_DATE)
         GROUP BY communication_type
         ORDER BY count DESC`,
        [req.user!.tenant_id]
      )

      // By priority
      const byPriorityResult = await pool.query(
        `SELECT COALESCE(ai_detected_priority, manual_priority, 'Unassigned') as priority,
                COUNT(*) as count
         FROM communications c
         LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
         WHERE (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
         AND c.communication_datetime >= DATE_TRUNC('month', CURRENT_DATE)
         GROUP BY priority
         ORDER BY count DESC`,
        [req.user!.tenant_id]
      )

      // Overdue follow-ups
      const overdueResult = await pool.query(
        `SELECT COUNT(*) as overdue_followups
         FROM communications c
         LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
         WHERE (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
         AND c.requires_follow_up = TRUE
         AND c.follow_up_completed = FALSE
         AND c.follow_up_by_date < CURRENT_DATE`,
        [req.user!.tenant_id]
      )

      res.json({
        summary: totalResult.rows[0],
        by_type: byTypeResult.rows,
        by_priority: byPriorityResult.rows,
        overdue: overdueResult.rows[0]
      })
    } catch (error) {
      console.error('Get communications dashboard error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
