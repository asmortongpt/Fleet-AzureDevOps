To refactor the code and replace `pool.query` with a repository pattern, we'll need to create a new `TaskRepository` class and modify the existing code to use it. Here's the complete refactored file:


import { Router } from 'express'
import { z } from 'zod'

import { ValidationError } from '../errors/app-error'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'

// Import the new TaskRepository
import { TaskRepository } from '../repositories/task-repository'

const router = Router()
router.use(authenticateJWT)

const taskQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  category: z.string().optional(),
})

// Initialize the TaskRepository
const taskRepository = new TaskRepository()

// Get all tasks
router.get('/', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const queryValidation = taskQuerySchema.safeParse(req.query)
    if (!queryValidation.success) {
      throw new ValidationError("Invalid query parameters")
    }
    const { status, priority, assigned_to, category } = queryValidation.data
    const tenantId = req.user?.tenant_id

    const tasks = await taskRepository.getAllTasks(tenantId, {
      status,
      priority,
      assigned_to,
      category
    })

    res.json({
      tasks,
      total: tasks.length,
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// Enhanced Create Task Endpoint with Input Validation
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'in_progress', 'completed', 'closed']),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
})

router.post('/', csrfProtection, requirePermission('report:generate:global'), async (req: AuthRequest, res) => {
  const parseResult = createTaskSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid task data', details: parseResult.error.format() })
  }
  const { title, description, category, priority, status, assigned_to, due_date } = parseResult.data

  try {
    const tenantId = req.user?.tenant_id
    const taskId = await taskRepository.createTask({
      title,
      description,
      category,
      priority,
      status,
      assigned_to,
      due_date,
      tenant_id: tenantId
    })

    res.status(201).json({ message: 'Task created successfully', taskId })
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

export default router


Now, we need to create the `TaskRepository` class. Here's an example implementation:


// File: src/repositories/task-repository.ts

import { PoolClient } from 'pg'

export interface Task {
  id: number
  title: string
  description?: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'completed' | 'closed'
  assigned_to?: string
  due_date?: string
  tenant_id: string
  created_at: Date
  updated_at: Date
}

export interface TaskQuery {
  status?: string
  priority?: string
  assigned_to?: string
  category?: string
}

export class TaskRepository {
  private pool: any // Assuming you're using a pool from a database connection

  constructor() {
    this.pool = pool // Import or inject the pool
  }

  async getAllTasks(tenantId: string, query: TaskQuery): Promise<Task[]> {
    let queryString = `
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

    if (query.status) {
      paramCount++
      queryString += ` AND t.status = $${paramCount}`
      params.push(query.status)
    }
    if (query.priority) {
      paramCount++
      queryString += ` AND t.priority = $${paramCount}`
      params.push(query.priority)
    }
    if (query.assigned_to) {
      paramCount++
      queryString += ` AND t.assigned_to = $${paramCount}`
      params.push(query.assigned_to)
    }
    if (query.category) {
      paramCount++
      queryString += ` AND t.category = $${paramCount}`
      params.push(query.category)
    }

    queryString += ` GROUP BY t.id, u_assigned.first_name, u_assigned.last_name, u_created.first_name, u_created.last_name, v.vehicle_number`
    queryString += ` ORDER BY
      CASE t.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC`

    const result = await this.pool.query(queryString, params)
    return result.rows
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      const insertQuery = `
        INSERT INTO tasks (title, description, category, priority, status, assigned_to, due_date, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `
      const result = await client.query(insertQuery, [
        task.title,
        task.description,
        task.category,
        task.priority,
        task.status,
        task.assigned_to,
        task.due_date,
        task.tenant_id,
      ])

      await client.query('COMMIT')
      return result.rows[0].id
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}


This refactored version moves the database operations into a separate `TaskRepository` class, which encapsulates the data access logic. The router now uses methods from this repository instead of directly querying the database.

Note that you'll need to adjust the import for the `pool` in the `TaskRepository` class to match your project's structure. Also, make sure to create the `src/repositories/task-repository.ts` file with the provided content.

This refactoring improves the separation of concerns, making the code more maintainable and easier to test. The repository pattern allows for easier switching of the underlying data source if needed in the future.