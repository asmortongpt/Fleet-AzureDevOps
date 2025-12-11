Here's the complete refactored file with all direct database queries replaced by repository methods:


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

// Import necessary repositories
import { ReservationRepository } from '../repositories/reservation.repository';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { UserRepository } from '../repositories/user.repository';

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

    // Check if vehicle exists
    const vehicleRepository = new VehicleRepository(pool);
    const vehicle = await vehicleRepository.getVehicleById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if vehicle is available
    const reservationRepository = new ReservationRepository(pool);
    const isAvailable = await reservationRepository.checkVehicleAvailability(vehicle_id, start_datetime, end_datetime);
    if (!isAvailable) {
      return res.status(400).json({ error: 'Vehicle is not available for the requested time' });
    }

    // Create reservation
    const newReservation = await reservationRepository.createReservation(
      vehicle_id, start_datetime, end_datetime, purpose, notes, approval_required, req.user.tenant_id
    );

    // Sync with Microsoft
    await microsoftService.syncReservation(newReservation);

    res.status(201).json(newReservation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reservations - Get all reservations
router.get('/', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const reservationRepository = new ReservationRepository(pool);
    const reservations = await reservationRepository.getAllReservations(req.user.tenant_id);
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reservations/:id - Get a specific reservation
router.get('/:id', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const reservationRepository = new ReservationRepository(pool);
    const reservation = await reservationRepository.getReservationById(id, req.user.tenant_id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /reservations/:id - Update a reservation
router.put('/:id', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsedData = updateReservationSchema.parse(req.body);
    const { start_datetime, end_datetime, purpose, notes } = parsedData;

    // Permission check
    if (!checkPermissions(req.user, 'updateReservation')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const reservationRepository = new ReservationRepository(pool);
    const existingReservation = await reservationRepository.getReservationById(id, req.user.tenant_id);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check if vehicle is available for new time range
    if (start_datetime || end_datetime) {
      const newStart = start_datetime || existingReservation.start_datetime;
      const newEnd = end_datetime || existingReservation.end_datetime;
      const isAvailable = await reservationRepository.checkVehicleAvailability(
        existingReservation.vehicle_id, newStart, newEnd, id
      );
      if (!isAvailable) {
        return res.status(400).json({ error: 'Vehicle is not available for the requested time' });
      }
    }

    // Update reservation
    const updatedReservation = await reservationRepository.updateReservation(
      id, start_datetime, end_datetime, purpose, notes, req.user.tenant_id
    );

    // Sync with Microsoft
    await microsoftService.syncReservation(updatedReservation);

    res.json(updatedReservation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /reservations/:id - Delete a reservation
router.delete('/:id', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Permission check
    if (!checkPermissions(req.user, 'deleteReservation')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const reservationRepository = new ReservationRepository(pool);
    const existingReservation = await reservationRepository.getReservationById(id, req.user.tenant_id);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    await reservationRepository.deleteReservation(id, req.user.tenant_id);

    // Sync with Microsoft
    await microsoftService.syncReservationDeletion(id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reservations/:id/approve - Approve a reservation
router.post('/:id/approve', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsedData = approvalActionSchema.parse(req.body);
    const { notes } = parsedData;

    // Permission check
    if (!checkPermissions(req.user, 'approveReservation')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const reservationRepository = new ReservationRepository(pool);
    const existingReservation = await reservationRepository.getReservationById(id, req.user.tenant_id);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (existingReservation.status !== 'pending') {
      return res.status(400).json({ error: 'Reservation is not in a pending state' });
    }

    const approvedReservation = await reservationRepository.approveReservation(id, req.user.id, notes);

    // Sync with Microsoft
    await microsoftService.syncReservation(approvedReservation);

    res.json(approvedReservation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error approving reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reservations/:id/reject - Reject a reservation
router.post('/:id/reject', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsedData = approvalActionSchema.parse(req.body);
    const { notes } = parsedData;

    // Permission check
    if (!checkPermissions(req.user, 'rejectReservation')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const reservationRepository = new ReservationRepository(pool);
    const existingReservation = await reservationRepository.getReservationById(id, req.user.tenant_id);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (existingReservation.status !== 'pending') {
      return res.status(400).json({ error: 'Reservation is not in a pending state' });
    }

    const rejectedReservation = await reservationRepository.rejectReservation(id, req.user.id, notes);

    // Sync with Microsoft
    await microsoftService.syncReservation(rejectedReservation);

    res.json(rejectedReservation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error rejecting reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


This refactored version of `reservations.routes.enhanced.ts` has eliminated all direct database queries and replaced them with repository methods. The changes include:

1. Importing necessary repository classes at the top of the file.
2. Creating instances of the required repositories within each route handler.
3. Replacing all direct database queries with corresponding repository methods.
4. Ensuring that all database operations are now handled through the repository layer.

The repository methods used in this file are:

- `VehicleRepository.getVehicleById()`
- `ReservationRepository.checkVehicleAvailability()`
- `ReservationRepository.createReservation()`
- `ReservationRepository.getAllReservations()`
- `ReservationRepository.getReservationById()`
- `ReservationRepository.updateReservation()`
- `ReservationRepository.deleteReservation()`
- `ReservationRepository.approveReservation()`
- `ReservationRepository.rejectReservation()`

These methods should be implemented in the respective repository classes to handle the database operations previously performed by direct queries.