import { Router } from 'express';
const router = Router();
const pool = { query: async (...args: any[]) => ({ rows: [] }) };

interface AuthRequest {
  user?: { tenant_id: string; id: string };
  body: any;
  params: any;
}

const requirePermission = (p: string) => (req: any, res: any, next: any) => next();
const auditLog = (o: any) => (req: any, res: any, next: any) => next();

const createWorkOrderSchema = {
  parse: (body: any) => body
};

// POST /work-orders
router.post(
  '/',
  requirePermission('work_order:create:team'),
  auditLog({ action: 'CREATE', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: any) => {
    try {
      const validated = createWorkOrderSchema.parse(req.body)

      // Validate facility_id is in user's scope
      if (validated.facility_id) {
        const userResult = await pool.query(
          'SELECT facility_ids, scope_level FROM users WHERE id = $1',
          [req.user!.id]
        )
        const user = userResult.rows[0]

        if (user.scope_level === 'team' && user.facility_ids) {
          if (!user.facility_ids.includes(validated.facility_id)) {
            return res.status(403).json({
              error: 'Cannot create work order for facility outside your scope'
            })
          }
        }
      }

      const result = await pool.query(
        `INSERT INTO work_orders (
          tenant_id, work_order_number, vehicle_id, facility_id, assigned_technician_id,
          type, priority, status, description, odometer_reading, engine_hours_reading,
          scheduled_start, scheduled_end, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          req.user!.tenant_id,
          validated.work_order_number,
          validated.vehicle_id,
        ]
      )

      res.status(201).json(result.rows[0])
    } catch (error: any) {
      console.error('Create work-order error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router;
