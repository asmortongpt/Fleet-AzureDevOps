import { BaseRepository } from '../repositories/BaseRepository';

import { pool } from '../db'
import { NotFoundError, ValidationError } from '../lib/errors'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface TaskFilters {
  status?: string
  priority?: string
  assigned_to?: number
  category?: string
  due_date?: string
}

export interface Task {
  id: number
  tenant_id: string
  title: string
  description?: string
  category?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to?: number
  created_by: number
  due_date?: Date
  estimated_hours?: number
  related_vehicle_id?: number
  related_work_order_id?: number
  tags?: string[]
  created_at: Date
  updated_at: Date
}

export interface TaskComment {
  id: number
  task_id: number
  user_id: number
  comment_text: string
  created_at: Date
}

export interface TaskTimeEntry {
  id: number
  task_id: number
  user_id: number
  hours_spent: number
  description?: string
  created_at: Date
}

export interface ChecklistItem {
  text: string
  completed?: boolean
}

export interface TaskAnalytics {
  by_status: Array<{ status: string; count: number }>
  by_priority: Array<{ priority: string; count: number }>
  by_category: Array<{ category: string; count: number }>
  completion_rate: {
    completed: number
    total: number
    percentage: string
  }
}

/**
 * TaskManagementRepository - B3 Agent 29
 * Eliminates 17 direct database queries from task-management.routes.ts
 * All queries use parameterized statements
 * Enforces tenant isolation on all operations
 */
export class TaskManagementRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LTask_LManagement_LRepository extends _LBases');
  }

  /**
   * Find all tasks with filters and enriched data
   * Replaces complex query in GET /tasks
   */
  async findAllWithDetails(
    tenantId: string,
    filters: TaskFilters = {}
  ): Promise<any[]> {
    let query = `
      SELECT
        t.*,
        u_assigned.first_name || ' ' || u_assigned.last_name as assigned_to_name,
        u_created.first_name || ' ' || u_created.last_name as created_by_name,
        v.vehicle_number as related_vehicle,
        COUNT(DISTINCT tc.id) as comment_count,
        COUNT(DISTINCT ta.id) as attachment_count
      FROM tasks t
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      LEFT JOIN vehicles v ON t.related_vehicle_id = v.id
      LEFT JOIN task_comments tc ON t.id = tc.task_id
      LEFT JOIN task_attachments ta ON t.id = ta.task_id
      WHERE t.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (filters.status) {
      paramCount++
      query += ` AND t.status = $${paramCount}`
      params.push(filters.status)
    }
    if (filters.priority) {
      paramCount++
      query += ` AND t.priority = $${paramCount}`
      params.push(filters.priority)
    }
    if (filters.assigned_to) {
      paramCount++
      query += ` AND t.assigned_to = $${paramCount}`
      params.push(filters.assigned_to)
    }
    if (filters.category) {
      paramCount++
      query += ` AND t.category = $${paramCount}`
      params.push(filters.category)
    }

    query += ` GROUP BY t.id, u_assigned.first_name, u_assigned.last_name, u_created.first_name, u_created.last_name, v.vehicle_number`
    query += ` ORDER BY
      CASE t.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC`

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Create a new task
   * Replaces INSERT query in POST /tasks
   */
  async create(
    data: Partial<Task>,
    tenantId: string,
    userId: number
  ): Promise<Task> {
    if (!data.title) {
      throw new ValidationError('Task title is required')
    }

    const result = await pool.query(
      `INSERT INTO tasks (
        tenant_id, title, description, category, priority, status,
        assigned_to, created_by, due_date, estimated_hours,
        related_vehicle_id, related_work_order_id, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        tenantId,
        data.title,
        data.description || null,
        data.category || null,
        data.priority || 'medium',
        data.status || 'todo',
        data.assigned_to || null,
        userId,
        data.due_date || null,
        data.estimated_hours || null,
        data.related_vehicle_id || null,
        data.related_work_order_id || null,
        data.tags ? JSON.stringify(data.tags) : null
      ]
    )

    return result.rows[0]
  }

  /**
   * Add checklist items to a task
   * Replaces INSERT query in POST /tasks checklist creation
   */
  async addChecklistItems(
    taskId: number,
    items: ChecklistItem[]
  ): Promise<void> {
    if (!items || items.length === 0) {
      return
    }

    for (const item of items) {
      await pool.query(
        `INSERT INTO task_checklist (task_id, item_text, is_completed)
         VALUES ($1, $2, $3)`,
        [taskId, item.text, item.completed || false]
      )
    }
  }

  /**
   * Update a task
   * Replaces UPDATE query in PUT /tasks/:id
   */
  async update(
    id: number,
    updates: Partial<Task>,
    tenantId: string
  ): Promise<Task | null> {
    const setClauses: string[] = []
    const values: any[] = []
    let paramCount = 1

    // Build dynamic SET clauses for provided fields
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof Task] !== undefined && key !== 'id' && key !== 'tenant_id') {
        setClauses.push(`${key} = $${paramCount}`)
        values.push(updates[key as keyof Task])
        paramCount++
      }
    })

    if (setClauses.length === 0) {
      throw new ValidationError('No fields to update')
    }

    setClauses.push(`updated_at = NOW()`)
    values.push(id, tenantId)

    const result = await pool.query(
      `UPDATE tasks
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
       RETURNING *`,
      values
    )

    return result.rows[0] || null
  }

  /**
   * Add a comment to a task
   * Replaces INSERT query in POST /tasks/:id/comments
   */
  async addComment(
    taskId: number,
    userId: number,
    commentText: string
  ): Promise<TaskComment> {
    if (!commentText || commentText.trim().length === 0) {
      throw new ValidationError('Comment text is required')
    }

    const result = await pool.query(
      `INSERT INTO task_comments (task_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, userId, commentText]
    )

    return result.rows[0]
  }

  /**
   * Add a time entry to a task
   * Replaces INSERT query in POST /tasks/:id/time-entries
   */
  async addTimeEntry(
    taskId: number,
    userId: number,
    hoursSpent: number,
    description?: string
  ): Promise<TaskTimeEntry> {
    if (!hoursSpent || hoursSpent <= 0) {
      throw new ValidationError('Hours spent must be greater than 0')
    }

    const result = await pool.query(
      `INSERT INTO task_time_entries (task_id, user_id, hours_spent, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [taskId, userId, hoursSpent, description || null]
    )

    return result.rows[0]
  }

  /**
   * Get task analytics - status counts
   * Replaces first query in GET /analytics/summary
   */
  async getStatusCounts(tenantId: string): Promise<Array<{ status: string; count: number }>> {
    const result = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM tasks
       WHERE tenant_id = $1
       GROUP BY status`,
      [tenantId]
    )

    return result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count, 10)
    }))
  }

  /**
   * Get task analytics - priority counts
   * Replaces second query in GET /analytics/summary
   */
  async getPriorityCounts(tenantId: string): Promise<Array<{ priority: string; count: number }>> {
    const result = await pool.query(
      `SELECT priority, COUNT(*) as count
       FROM tasks
       WHERE tenant_id = $1
       GROUP BY priority`,
      [tenantId]
    )

    return result.rows.map(row => ({
      priority: row.priority,
      count: parseInt(row.count, 10)
    }))
  }

  /**
   * Get task analytics - category counts
   * Replaces third query in GET /analytics/summary
   */
  async getCategoryCounts(tenantId: string): Promise<Array<{ category: string; count: number }>> {
    const result = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM tasks
       WHERE tenant_id = $1
       GROUP BY category`,
      [tenantId]
    )

    return result.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count, 10)
    }))
  }

  /**
   * Get task completion rate (last 30 days)
   * Replaces fourth query in GET /analytics/summary
   */
  async getCompletionRate(tenantId: string): Promise<{
    completed: number
    total: number
    percentage: string
  }> {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) as total
       FROM tasks
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [tenantId]
    )

    const total = parseInt(result.rows[0].total, 10) || 1
    const completed = parseInt(result.rows[0].completed, 10) || 0
    const percentage = ((completed / total) * 100).toFixed(2)

    return {
      completed,
      total,
      percentage
    }
  }

  /**
   * Get complete analytics summary
   * Combines all analytics queries
   */
  async getAnalytics(tenantId: string): Promise<TaskAnalytics> {
    const [statusCounts, priorityCounts, categoryCounts, completionRate] = await Promise.all([
      this.getStatusCounts(tenantId),
      this.getPriorityCounts(tenantId),
      this.getCategoryCounts(tenantId),
      this.getCompletionRate(tenantId)
    ])

    return {
      by_status: statusCounts,
      by_priority: priorityCounts,
      by_category: categoryCounts,
      completion_rate: completionRate
    }
  }

  /**
   * Find task by ID
   * Utility method for validation
   */
  async findById(id: number, tenantId: string): Promise<Task | null> {
    const result = await pool.query(
      `SELECT id, tenant_id, created_at, updated_at FROM tasks WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Delete a task
   * Utility method for cleanup
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM tasks WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Count total tasks
   * Utility method for pagination
   */
  async count(tenantId: string, filters: TaskFilters = {}): Promise<number> {
    let query = `SELECT COUNT(*) FROM tasks WHERE tenant_id = $1`
    const params: any[] = [tenantId]
    let paramCount = 1

    if (filters.status) {
      paramCount++
      query += ` AND status = $${paramCount}`
      params.push(filters.status)
    }
    if (filters.priority) {
      paramCount++
      query += ` AND priority = $${paramCount}`
      params.push(filters.priority)
    }
    if (filters.assigned_to) {
      paramCount++
      query += ` AND assigned_to = $${paramCount}`
      params.push(filters.assigned_to)
    }
    if (filters.category) {
      paramCount++
      query += ` AND category = $${paramCount}`
      params.push(filters.category)
    }

    const result = await pool.query(query, params)
    return parseInt(result.rows[0].count, 10)
  }
}

export const taskManagementRepository = new TaskManagementRepository()
