Here's the complete refactored file with the `pool.query` replaced by a `ReservationRepository`:


import express, { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { checkPermissions } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler';
import MicrosoftIntegrationService from '../services/microsoft-integration.service';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import { csrfProtection } from '../middleware/csrf';

const router = express.Router();

router.use(helmet());
router.use(express.json());
router.use(csurf({ cookie: true }));
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}));

// Database pool (will be set via setDatabasePool)
let pool: any;
let microsoftService: MicrosoftIntegrationService;

export function setDatabasePool(dbPool: any) {
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
// Reservation Repository
// ============================================

class ReservationRepository {
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  async createReservation(vehicle_id: string, start_datetime: string, end_datetime: string, purpose: string, notes: string | null, approval_required: boolean): Promise<any> {
    const result = await this.pool.query(
      'INSERT INTO reservations (vehicle_id, start_datetime, end_datetime, purpose, notes, approval_required) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [vehicle_id, start_datetime, end_datetime, purpose, notes, approval_required]
    );
    return result.rows[0];
  }

  async getReservationById(id: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM reservations WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async updateReservation(id: string, start_datetime: string | null, end_datetime: string | null, purpose: string | null, notes: string | null): Promise<any> {
    const setClause = [];
    const values = [id];
    let paramIndex = 2;

    if (start_datetime !== null) {
      setClause.push(`start_datetime = $${paramIndex}`);
      values.push(start_datetime);
      paramIndex++;
    }

    if (end_datetime !== null) {
      setClause.push(`end_datetime = $${paramIndex}`);
      values.push(end_datetime);
      paramIndex++;
    }

    if (purpose !== null) {
      setClause.push(`purpose = $${paramIndex}`);
      values.push(purpose);
      paramIndex++;
    }

    if (notes !== null) {
      setClause.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }

    const query = `
      UPDATE reservations
      SET ${setClause.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteReservation(id: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM reservations WHERE id = $1',
      [id]
    );
  }

  async approveOrRejectReservation(id: string, action: string, notes: string | null): Promise<any> {
    const result = await this.pool.query(
      `
        UPDATE reservations
        SET status = $2, approval_notes = $3
        WHERE id = $1
        RETURNING *
      `,
      [id, action === 'approve' ? 'approved' : 'rejected', notes]
    );
    return result.rows[0];
  }
}

// ============================================
// Routes
// ============================================

// POST /reservations - Create a new reservation
router.post('/', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const parsedData = createReservationSchema.parse(req.body);
    const { vehicle_id, start_datetime, end_datetime, purpose, notes, approval_required } = parsedData;

    // Permission check
    if (!checkPermissions(req.user, 'createReservation')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Create Reservation Repository
    const reservationRepository = new ReservationRepository(pool);

    // Insert into database using repository
    const newReservation = await reservationRepository.createReservation(
      vehicle_id, start_datetime, end_datetime, purpose, notes, approval_required
    );

    // Microsoft Calendar integration
    await microsoftService.createEvent(req.user.email, start_datetime, end_datetime, vehicle_id, purpose, notes);

    res.status(201).json(newReservation);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// GET /reservations/:id - Get a specific reservation
router.get('/:id', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Permission check
    if (!checkPermissions(req.user, 'viewReservation')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Create Reservation Repository
    const reservationRepository = new ReservationRepository(pool);

    // Get reservation from database using repository
    const reservation = await reservationRepository.getReservationById(id);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /reservations/:id - Update a specific reservation
router.put('/:id', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsedData = updateReservationSchema.parse(req.body);
    const { start_datetime, end_datetime, purpose, notes } = parsedData;

    // Permission check
    if (!checkPermissions(req.user, 'updateReservation')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Create Reservation Repository
    const reservationRepository = new ReservationRepository(pool);

    // Get existing reservation
    const existingReservation = await reservationRepository.getReservationById(id);

    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Update reservation using repository
    const updatedReservation = await reservationRepository.updateReservation(
      id,
      start_datetime || null,
      end_datetime || null,
      purpose || null,
      notes || null
    );

    // Microsoft Calendar integration
    await microsoftService.updateEvent(
      req.user.email,
      existingReservation.start_datetime,
      existingReservation.end_datetime,
      start_datetime || existingReservation.start_datetime,
      end_datetime || existingReservation.end_datetime,
      existingReservation.vehicle_id,
      purpose || existingReservation.purpose,
      notes || existingReservation.notes
    );

    res.json(updatedReservation);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

// DELETE /reservations/:id - Delete a specific reservation
router.delete('/:id', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Permission check
    if (!checkPermissions(req.user, 'deleteReservation')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Create Reservation Repository
    const reservationRepository = new ReservationRepository(pool);

    // Get existing reservation
    const existingReservation = await reservationRepository.getReservationById(id);

    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Delete reservation using repository
    await reservationRepository.deleteReservation(id);

    // Microsoft Calendar integration
    await microsoftService.deleteEvent(
      req.user.email,
      existingReservation.start_datetime,
      existingReservation.end_datetime,
      existingReservation.vehicle_id
    );

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reservations/:id/approve - Approve a reservation
router.post('/:id/approve', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsedData = approvalActionSchema.parse(req.body);
    const { action, notes } = parsedData;

    // Permission check
    if (!checkPermissions(req.user, 'approveReservation')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Create Reservation Repository
    const reservationRepository = new ReservationRepository(pool);

    // Get existing reservation
    const existingReservation = await reservationRepository.getReservationById(id);

    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Update reservation status using repository
    const updatedReservation = await reservationRepository.approveOrRejectReservation(id, action, notes);

    res.json(updatedReservation);
  } catch (error) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

export default router;


This refactored version includes the following changes:

1. A new `ReservationRepository` class has been added, encapsulating all database operations related to reservations.

2. The `pool.query` calls have been replaced with methods from the `ReservationRepository` in all routes.

3. The `ReservationRepository` is instantiated within each route handler, passing the `pool` object to its constructor.

4. All existing routes (POST, GET, PUT, DELETE) have been updated to use the repository methods instead of direct database queries.

5. The approval/rejection route has been added, using the `approveOrRejectReservation` method from the repository.

6. Error handling and permission checks remain in place, ensuring the same level of security and robustness.

This refactoring improves the code's maintainability and separation of concerns by moving database operations into a dedicated repository class. It also makes it easier to switch database implementations or add caching layers in the future if needed.