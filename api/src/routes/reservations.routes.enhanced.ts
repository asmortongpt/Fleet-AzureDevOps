import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { checkPermissions } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler';
import MicrosoftIntegrationService from '../services/microsoft-integration.service';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';

const router = express.Router();

router.use(helmet());
router.use(express.json());
router.use(csurf({ cookie: true }));
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}));

// Database pool (will be set via setDatabasePool)
let pool: Pool;
let microsoftService: MicrosoftIntegrationService;

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
  microsoftService = new MicrosoftIntegrationService(dbPool);
}

// ============================================
// Validation Schemas
// ============================================

const createReservationSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  start_datetime: z.string().datetime('Invalid start datetime format'),
  end_datetime: z.string().datetime('Invalid end datetime format'),
  purpose: z.enum(['business', 'personal'], {
    errorMap: () => ({ message: 'Purpose must be either "business" or "personal"' })
  }),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  approval_required: z.boolean().optional().default(true),
}).refine(
  (data) => new Date(data.end_datetime) > new Date(data.start_datetime),
  { message: 'End datetime must be after start datetime' }
);

const updateReservationSchema = z.object({
  start_datetime: z.string().datetime().optional(),
  end_datetime: z.string().datetime().optional(),
  purpose: z.enum(['business', 'personal']).optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    if (data.start_datetime && data.end_datetime) {
      return new Date(data.end_datetime) > new Date(data.start_datetime);
    }
    return true;
  },
  { message: 'End datetime must be after start datetime' }
);

const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be either "approve" or "reject"' })
  }),
  notes: z.string().max(500).optional(),
});

// ============================================
// Routes
// ============================================

// POST /reservations - Create a new reservation
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const parsedData = createReservationSchema.parse(req.body);
    const { vehicle_id, start_datetime, end_datetime, purpose, notes, approval_required } = parsedData;

    // Permission check
    if (!checkPermissions(req.user, 'createReservation')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Insert into database
    const result = await pool.query(
      'INSERT INTO reservations (vehicle_id, start_datetime, end_datetime, purpose, notes, approval_required) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [vehicle_id, start_datetime, end_datetime, purpose, notes, approval_required]
    );

    // Microsoft Calendar integration
    await microsoftService.createEvent(req.user.email, start_datetime, end_datetime, vehicle_id, purpose, notes);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// Additional routes (GET, PUT, DELETE) would follow the same structure, including:
// - Authentication and permission checks
// - Input validation with Zod schemas
// - Parameterized SQL queries to prevent SQL injection
// - Integration with external services (e.g., Microsoft services)
// - Error handling with user-friendly messages

export default router;