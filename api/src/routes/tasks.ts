import { Router, Response } from "express"

import { pool } from '../config/database'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { setTenantContext } from '../middleware/tenant-context'
import logger from '../config/logger'

const router = Router()

// Apply authentication and tenant context to all routes
router.use(authenticateJWT)
router.use(setTenantContext)

router.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const { status, priority, assignedTo, type, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  let whereClause = 'WHERE tenant_id = $1'
  const params: (string | number | boolean | null | undefined)[] = [tenantId]

  if (status && typeof status === 'string') {
    params.push(status)
    whereClause += ` AND status = $${params.length}`
  }

  if (priority && typeof priority === 'string') {
    params.push(priority)
    whereClause += ` AND priority = $${params.length}`
  }

  if (assignedTo && typeof assignedTo === 'string') {
    params.push(assignedTo)
    whereClause += ` AND assigned_to_id = $${params.length}`
  }

  if (type && typeof type === 'string') {
    params.push(type)
    whereClause += ` AND type = $${params.length}`
  }

  const result = await client.query(
    `SELECT id, title, description, type, priority, status,
            assigned_to_id as "assignedToId", created_by_id as "createdById",
            related_entity_type as "relatedEntityType", related_entity_id as "relatedEntityId",
            due_date as "dueDate", completed_at as "completedAt", notes,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM tasks 
     ${whereClause}
     ORDER BY due_date ASC NULLS LAST, priority DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  const countResult = await client.query(
    `SELECT COUNT(*) FROM tasks ${whereClause}`,
    params
  )

  res.json({
    data: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page: Number(page),
    limit: Number(limit)
  })
}))

router.get("/:id", asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const result = await client.query(
    `SELECT id, title, description, type, priority, status,
            assigned_to_id as "assignedToId", created_by_id as "createdById",
            related_entity_type as "relatedEntityType", related_entity_id as "relatedEntityId",
            due_date as "dueDate", completed_at as "completedAt", notes, metadata,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM tasks 
     WHERE id = $1 AND tenant_id = $2`,
    [req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Task not found' })
  }

  res.json({ data: result.rows[0] })
}))

router.post("/", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const userId = req.user?.id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const { title, description, type, priority, status, assignedToId, relatedEntityType, relatedEntityId, dueDate, notes } = req.body

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' })
  }

  const result = await client.query(
    `INSERT INTO tasks (
      tenant_id, title, description, type, priority, status,
      assigned_to_id, created_by_id, related_entity_type, related_entity_id,
      due_date, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, title, priority, status, due_date as "dueDate"`,
    [tenantId, title, description || null, type || null, priority || 'medium',
      status || 'pending', assignedToId || null, userId, relatedEntityType || null,
      relatedEntityId || null, dueDate || null, notes || null]
  )

  logger.info('Task created', { taskId: result.rows[0].id, tenantId })
  res.status(201).json({ data: result.rows[0] })
}))

router.put("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const { title, description, priority, status, assignedToId, dueDate, notes } = req.body

  // Handle completed_at timestamp
  let completedAt = null
  if (status === 'completed') {
    completedAt = new Date()
  }

  const result = await client.query(
    `UPDATE tasks 
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         priority = COALESCE($3, priority),
         status = COALESCE($4, status),
         assigned_to_id = COALESCE($5, assigned_to_id),
         due_date = COALESCE($6, due_date),
         notes = COALESCE($7, notes),
         completed_at = CASE WHEN $4 = 'completed' THEN NOW() ELSE completed_at END,
         updated_at = NOW()
     WHERE id = $8 AND tenant_id = $9
     RETURNING id, title, status, priority`,
    [title, description, priority, status, assignedToId, dueDate, notes, req.params.id, tenantId]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Task not found' })
  }

  logger.info('Task updated', { taskId: req.params.id, tenantId })
  res.json({ data: result.rows[0] })
}))

router.delete("/:id", csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id
  const client = req.dbClient

  if (!client) {
    return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
  }

  const result = await client.query(
    'DELETE FROM tasks WHERE id = $1 AND tenant_id = $2',
    [req.params.id, tenantId]
  )

  if ((result.rowCount ?? 0) === 0) {
    return res.status(404).json({ error: 'Task not found' })
  }

  logger.info('Task deleted', { taskId: req.params.id, tenantId })
  res.json({ message: "Task deleted successfully" })
}))

export default router
