Here's the complete refactored file with the `TaskRepository` class implemented and used in place of `pool.query`:


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

    queryString += `
      GROUP BY t.id, u_assigned.id, u_created.id, v.id
      ORDER BY t.created_at DESC
    `

    const client = await this.pool.connect()
    try {
      const result = await client.query(queryString, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  async createTask(taskData: {
    title: string
    description?: string
    category: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    status: 'open' | 'in_progress' | 'completed' | 'closed'
    assigned_to?: string
    due_date?: string
    tenant_id: string
  }): Promise<number> {
    const queryString = `
      INSERT INTO tasks (
        title, description, category, priority, status, assigned_to, due_date, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `

    const params = [
      taskData.title,
      taskData.description,
      taskData.category,
      taskData.priority,
      taskData.status,
      taskData.assigned_to,
      taskData.due_date,
      taskData.tenant_id
    ]

    const client = await this.pool.connect()
    try {
      const result = await client.query(queryString, params)
      return result.rows[0].id
    } finally {
      client.release()
    }
  }
}


Now, here's the refactored router file using the `TaskRepository`:


// File: src/routes/task-routes.ts

import { Router } from 'express'
import { z } from 'zod'

import { ValidationError } from '../errors/app-error'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'

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


This refactored version replaces all instances of `pool.query` with calls to the `TaskRepository` methods. The `TaskRepository` encapsulates the database operations, making the code more modular and easier to maintain. 

Note that you'll need to ensure that the `pool` object is properly imported or injected into the `TaskRepository` constructor. Also, make sure to update any other parts of your application that might be using `pool.query` directly to use the `TaskRepository` instead.