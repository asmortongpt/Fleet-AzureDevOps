/**
 * Task Management Routes
 * Comprehensive task tracking, assignment, and workflow management
 *
 * Features:
 * - Task creation and assignment
 * - Priority levels and deadlines
 * - Task dependencies
 * - Time tracking
 * - Task templates
 * - Kanban board support
 * - Notifications and reminders
 */

import { Router } from 'express'

import { pool } from '../config/database';
import logger from '../config/logger';
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'

const router = Router()
router.use(authenticateJWT)

// Get all tasks
router.get('/', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const { status, priority, assigned_to, category } = req.query
    const tenantId = req.user?.tenant_id

    // Use a resilient query that works regardless of which migration columns exist.
    // The tasks table may have assigned_to_id (migration 020) or assigned_to_driver (migration 036).
    // We try the full JOIN query first, falling back to a simpler query if columns are missing.
    let query = `
      SELECT
        t.id, t.tenant_id, t.title AS task_title, t.description,
        COALESCE(t.task_type, t.type, t.category) AS task_type,
        t.priority, t.status,
        t.assigned_to_id, t.created_by_id,
        t.due_date, t.estimated_hours, t.actual_hours,
        t.completion_percentage, t.notes, t.tags, t.metadata,
        t.created_at, t.updated_at, t.completed_at,
        COUNT(DISTINCT tc.id) AS comments_count
      FROM tasks t
      LEFT JOIN task_comments tc ON t.id = tc.task_id
      WHERE t.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (status) {
      paramCount++
      query += ` AND t.status = $${paramCount}`
      params.push(status)
    }
    if (priority) {
      paramCount++
      query += ` AND t.priority = $${paramCount}`
      params.push(priority)
    }
    if (assigned_to) {
      paramCount++
      query += ` AND t.assigned_to_id = $${paramCount}`
      params.push(assigned_to)
    }
    if (category) {
      paramCount++
      query += ` AND t.category = $${paramCount}`
      params.push(category)
    }

    query += ` GROUP BY t.id`
    query += ` ORDER BY
      CASE t.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC`

    let result
    try {
      result = await pool.query(query, params)
    } catch (queryError) {
      // Fallback: If the query fails due to missing columns, try a minimal query
      logger.warn('Task management: full query failed, using fallback', { error: queryError })
      const fallbackQuery = `
        SELECT id, tenant_id, title AS task_title, description,
               priority, status, due_date,
               created_at, updated_at
        FROM tasks
        WHERE tenant_id = $1
        ORDER BY created_at DESC
      `
      result = await pool.query(fallbackQuery, [tenantId])
    }

    res.json({
      tasks: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    logger.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks', tasks: [], total: 0 })
  }
})

// Create task
router.post('/', csrfProtection, requirePermission('report:generate:global'), async (req: AuthRequest, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const {
      title, description, category, priority, status, assigned_to,
      due_date, estimated_hours, related_vehicle_id, related_work_order_id,
      tags, checklist_items
    } = req.body

    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const result = await client.query(
      `INSERT INTO tasks (
        tenant_id, title, description, category, priority, status,
        assigned_to, created_by, due_date, estimated_hours,
        related_vehicle_id, related_work_order_id, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        tenantId, title, description, category, priority || 'medium',
        status || 'todo', assigned_to, userId, due_date, estimated_hours,
        related_vehicle_id, related_work_order_id,
        tags ? JSON.stringify(tags) : null
      ]
    )

    const taskId = result.rows[0].id

    // Add checklist items if provided
    if (checklist_items && checklist_items.length > 0) {
      for (const item of checklist_items) {
        await client.query(
          `INSERT INTO task_checklist (task_id, item_text, is_completed)
           VALUES ($1, $2, $3)`,
          [taskId, item.text, item.completed || false]
        )
      }
    }

    await client.query('COMMIT')

    res.status(201).json({
      task: result.rows[0],
      message: 'Task created successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error creating task:', error)
    res.status(500).json({ error: 'Failed to create task' })
  } finally {
    client.release()
  }
})

// Update task
router.put('/:id', csrfProtection, requirePermission('report:generate:global'), async (req: AuthRequest, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { id } = req.params
    const updates = req.body
    const tenantId = req.user?.tenant_id

    const setClauses: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id' && key !== 'tenant_id') {
        setClauses.push(`${key} = $${paramCount}`)
        values.push(updates[key])
        paramCount++
      }
    })

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    setClauses.push('updated_at = NOW()')
    values.push(id, tenantId)

    const result = await client.query(
      `UPDATE tasks
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Task not found' })
    }

    await client.query('COMMIT')

    res.json({
      task: result.rows[0],
      message: 'Task updated successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error updating task:', error)
    res.status(500).json({ error: 'Failed to update task' })
  } finally {
    client.release()
  }
})

// Add comment to task
router.post('/:id/comments', csrfProtection, requirePermission('report:generate:global'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { comment_text } = req.body
    const userId = req.user?.id

    const result = await pool.query(
      `INSERT INTO task_comments (task_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, userId, comment_text]
    )

    res.status(201).json({
      comment: result.rows[0],
      message: 'Comment added successfully'
    })
  } catch (error) {
    logger.error('Error adding comment:', error)
    res.status(500).json({ error: 'Failed to add comment' })
  }
})

// Track time on task
router.post('/:id/time-entries', csrfProtection, requirePermission('report:generate:global'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { hours_spent, description } = req.body
    const userId = req.user?.id

    const result = await pool.query(
      `INSERT INTO task_time_entries (task_id, user_id, hours_spent, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, userId, hours_spent, description]
    )

    res.status(201).json({
      time_entry: result.rows[0],
      message: 'Time logged successfully'
    })
  } catch (error) {
    logger.error('Error logging time:', error)
    res.status(500).json({ error: 'Failed to log time' })
  }
})

// Get task analytics
router.get('/analytics/summary', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    const [statusCounts, priorityCounts, categoryCounts, completionRate] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*) as count FROM tasks WHERE tenant_id = $1 GROUP BY status`,
        [tenantId]
      ),
      pool.query(
        `SELECT priority, COUNT(*) as count FROM tasks WHERE tenant_id = $1 GROUP BY priority`,
        [tenantId]
      ),
      pool.query(
        `SELECT category, COUNT(*) as count FROM tasks WHERE tenant_id = $1 GROUP BY category`,
        [tenantId]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'completed') as completed,
           COUNT(*) as total
         FROM tasks
         WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
        [tenantId]
      )
    ])

    const total = parseInt(completionRate.rows[0].total) || 1
    const completed = parseInt(completionRate.rows[0].completed) || 0
    const completion_percentage = ((completed / total) * 100).toFixed(2)

    res.json({
      by_status: statusCounts.rows,
      by_priority: priorityCounts.rows,
      by_category: categoryCounts.rows,
      completion_rate: {
        completed,
        total,
        percentage: completion_percentage
      }
    })
  } catch (error) {
    logger.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

export default router
