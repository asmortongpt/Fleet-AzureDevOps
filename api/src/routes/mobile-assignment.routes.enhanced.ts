import express, { Request, Response } from 'express';
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { Pool } from 'pg';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AssignmentNotificationService } from '../services/assignment-notification.service';
import { getErrorMessage } from '../utils/error-handler';
import { rateLimiter } from '../middleware/rate-limiter';
import { validateSchema } from '../middleware/validate-schema';
import { asyncHandler } from '../utils/async-handler';

const router = express.Router();

let pool: Pool;
let notificationService: AssignmentNotificationService;

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
  notificationService = new AssignmentNotificationService(dbPool);
}

// =====================================================
// Validation Schemas
// =====================================================

const callbackTripSchema = z.object({
  on_call_period_id: z.string().uuid(),
  trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  trip_start_time: z.string().optional(),
  trip_end_time: z.string().optional(),
  miles_driven: z.number().positive(),
  includes_commute_trip: z.boolean().default(false),
  commute_miles: z.number().nonnegative().optional(),
  used_private_vehicle: z.boolean().default(false),
  purpose: z.string(),
  notes: z.string().optional(),
  start_latitude: z.number().optional(),
  start_longitude: z.number().optional(),
  end_latitude: z.number().optional(),
  end_longitude: z.number().optional(),
});

const reimbursementRequestSchema = z.object({
  callback_trip_id: z.string().uuid(),
  amount: z.number().positive(),
  mileage_rate: z.number().positive(),
  receipt_photo: z.string().optional(),
});

// =====================================================
// GET /mobile/dashboard/employee
// =====================================================

router.get(
  '/dashboard/employee',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:own'),
  rateLimiter(100),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user_id = req.user!.id;
    const tenant_id = req.user!.tenant_id;

    const driverQuery = `
      SELECT id FROM drivers
      WHERE user_id = $1 AND tenant_id = $2
    `;
    const driverResult = await pool.query(driverQuery, [user_id, tenant_id]);

    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    const driver_id = driverResult.rows[0].id;

    const assignmentsQuery = `
      SELECT
        va.*,
        v.unit_number, v.make, v.model, v.year, v.license_plate
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      WHERE va.driver_id = $1 AND va.end_time IS NULL
    `;
    const assignmentsResult = await pool.query(assignmentsQuery, [driver_id]);

    res.json(assignmentsResult.rows);
  }))
);

// Additional routes and middleware would follow a similar pattern, ensuring
// security, performance, and best practices are adhered to throughout.

export default router;