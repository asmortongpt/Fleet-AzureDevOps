import { Router } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { z } from 'zod'

const router = Router()
router.use(authenticateJWT)

const taskQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  category: z.string().optional(),
})

// Get all tasks
router.get('/', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const queryValidation = taskQuerySchema.safeParse(req.query)
    if (!queryValidation.success) {
      return throw new ValidationError("Invalid query parameters")
    }
    const { status, priority, assigned_to, category } = queryValidation.data
    const tenantId = req.user?.tenant_id

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
      query += ` AND t.assigned_to = $${paramCount}`
      params.push(assigned_to)
    }
    if (category) {
      paramCount++
      query += ` AND t.category = $${paramCount}`
      params.push(category)
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

    res.json({
      tasks: result.rows,
      total: result.rows.length,
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

router.post('/', requirePermission('report:generate:global'), async (req: AuthRequest, res) => {
  const parseResult = createTaskSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid task data', details: parseResult.error.format() })
  }
  const { title, description, category, priority, status, assigned_to, due_date } = parseResult.data

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const insertQuery = `
      INSERT INTO tasks (title, description, category, priority, status, assigned_to, due_date, tenant_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `
    const tenantId = req.user?.tenant_id
    const result = await client.query(insertQuery, [
      title,
      description,
      category,
      priority,
      status,
      assigned_to,
      due_date,
      tenantId,
    ])

    await client.query('COMMIT')
    res.status(201).json({ message: 'Task created successfully', taskId: result.rows[0].id })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creating task:', error)
    res.status(500).json({ error: 'Failed to create task' })
  } finally {
    client.release()
  }
})

export default router
