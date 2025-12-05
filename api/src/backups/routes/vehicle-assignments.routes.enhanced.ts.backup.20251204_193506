import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AssignmentNotificationService } from '../services/assignment-notification.service';
import { getErrorMessage } from '../utils/error-handler';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { check, validationResult } from 'express-validator';

const router = express.Router();
router.use(helmet());
router.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Get database pool from app context
let pool: Pool;
let notificationService: AssignmentNotificationService;

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
  notificationService = new AssignmentNotificationService(dbPool);
}

// =====================================================
// Validation Schemas
// =====================================================

const createAssignmentSchema = z.object({
  vehicle_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  assignment_type: z.enum(['designated', 'on_call', 'temporary']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_ongoing: z.boolean().default(false),
  authorized_use: z.string().optional(),
  commuting_authorized: z.boolean().default(false),
  on_call_only: z.boolean().default(false),
  geographic_constraints: z.record(z.any()).optional(),
  requires_secured_parking: z.boolean().default(false),
  secured_parking_location_id: z.string().uuid().optional(),
  recommendation_notes: z.string().optional(),
}).strict();

const updateAssignmentSchema = createAssignmentSchema.partial().strict();

const assignmentLifecycleSchema = z.object({
  lifecycle_state: z.enum(['draft', 'submitted', 'approved', 'denied', 'active', 'suspended', 'terminated', 'pending_reauth']),
  notes: z.string().optional(),
}).strict();

const approvalActionSchema = z.object({
  action: z.enum(['approve', 'deny']),
  notes: z.string().optional(),
}).strict();

// =====================================================
// Route Middlewares for Validation
// =====================================================

const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: Function) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error.format());
    }
    next();
  };
};

// =====================================================
// GET /vehicle-assignments
// List vehicle assignments with filtering
// =====================================================

router.get(
  '/',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:team'),
  apiLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = '1',
        limit = '50',
        assignment_type,
        lifecycle_state,
        driver_id,
        vehicle_id,
        department_id,
      } = req.query;

      const queryParams = [];
      let queryStr = 'SELECT * FROM vehicle_assignments WHERE 1=1';

      if (assignment_type) {
        queryParams.push(assignment_type);
        queryStr += ` AND assignment_type = $${queryParams.length}`;
      }

      if (lifecycle_state) {
        queryParams.push(lifecycle_state);
        queryStr += ` AND lifecycle_state = $${queryParams.length}`;
      }

      if (driver_id) {
        queryParams.push(driver_id);
        queryStr += ` AND driver_id = $${queryParams.length}`;
      }

      if (vehicle_id) {
        queryParams.push(vehicle_id);
        queryStr += ` AND vehicle_id = $${queryParams.length}`;
      }

      if (department_id) {
        queryParams.push(department_id);
        queryStr += ` AND department_id = $${queryParams.length}`;
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      queryParams.push(offset, parseInt(limit as string));
      queryStr += ` OFFSET $${queryParams.length - 1} LIMIT $${queryParams.length}`;

      const { rows } = await pool.query(queryStr, queryParams);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).send(getErrorMessage(error));
    }
  }
);

// Additional route handlers (POST, PUT, DELETE) would follow the same pattern of security, validation, and error handling

export default router;