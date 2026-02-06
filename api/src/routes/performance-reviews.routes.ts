import { Router, Request, Response } from 'express'

import { pool } from '../config/database'
import { authenticateJWT } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

router.use(authenticateJWT)

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenant_id
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' })

    const result = await pool.query(
      `
      SELECT
        pr.id,
        pr.employee_id AS "employeeId",
        pr.reviewer_id AS "reviewerId",
        pr.rating,
        pr.review_date AS "date",
        pr.status,
        pr.notes,
        pr.created_at AS "createdAt"
      FROM performance_reviews pr
      WHERE pr.tenant_id = $1
      ORDER BY pr.review_date DESC
      `,
      [tenantId]
    )

    return res.json({ data: result.rows })
  })
)

export default router
