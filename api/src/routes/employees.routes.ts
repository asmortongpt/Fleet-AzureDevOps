import { Router, Request, Response } from 'express'

import { pool } from '../config/database'
import logger from '../config/logger'
import { authenticateJWT } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

router.use(authenticateJWT)

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenant_id
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await pool.query(
      `
      SELECT
        id,
        CONCAT(first_name, ' ', last_name) AS name,
        email,
        phone,
        role,
        department,
        status,
        employee_type AS "employeeType",
        hire_date AS "hireDate",
        manager_id AS "managerId",
        performance_rating AS "performanceRating",
        certifications,
        last_review_date AS "lastReviewDate",
        next_review_date AS "nextReviewDate",
        created_at AS "createdAt"
      FROM employees
      WHERE tenant_id = $1
      ORDER BY last_name, first_name
      `,
      [tenantId]
    )

    return res.json({ data: result.rows })
  })
)

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenant_id
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' })

    const result = await pool.query(
      `
      SELECT
        id,
        CONCAT(first_name, ' ', last_name) AS name,
        email,
        phone,
        role,
        department,
        status,
        employee_type AS "employeeType",
        hire_date AS "hireDate",
        manager_id AS "managerId",
        performance_rating AS "performanceRating",
        certifications,
        last_review_date AS "lastReviewDate",
        next_review_date AS "nextReviewDate",
        created_at AS "createdAt"
      FROM employees
      WHERE tenant_id = $1 AND id = $2
      `,
      [tenantId, req.params.id]
    )

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    return res.json({ data: result.rows[0] })
  })
)

export default router
