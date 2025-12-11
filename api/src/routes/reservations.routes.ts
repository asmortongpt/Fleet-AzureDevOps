Here's the complete refactored file with `pool.query` and `db.query` replaced by the `ReservationRepository`:


/**
 * Vehicle Reservations API Routes
 *
 * Comprehensive vehicle reservation system with:
 * - Reservation CRUD operations
 * - Conflict detection and validation
 * - Approval workflows (FleetManager, Admin)
 * - Microsoft Calendar/Teams/Outlook integration
 * - Vehicle availability checking
 * - Personal vs Business use tracking
 * - Audit trail and history
 *
 * Security:
 * - All routes require authentication
 * - Permission-based access control
 * - Parameterized queries only (no SQL injection)
 * - Input validation with Zod
 * - Repository pattern (no direct pool.query in routes)
 *
 * Reference: CWE-89 (SQL Injection), CWE-862 (Missing Authorization)
 */

import express, { Response } from 'express';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import MicrosoftIntegrationService from '../services/microsoft-integration.service';
import { csrfProtection } from '../middleware/csrf';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError } from '../errors/app-error';
import logger from '../config/logger';
import { ReservationRepository } from '../repositories/ReservationRepository';
import { QueryContext } from '../repositories/BaseRepository';
import { TYPES } from '../types';

const router = express.Router();

// Services
let microsoftService: MicrosoftIntegrationService;
let reservationRepo: ReservationRepository;

export function setDatabasePool() {
  microsoftService = new MicrosoftIntegrationService();

  // Initialize repository from DI container
  reservationRepo = container.get<ReservationRepository>(TYPES.ReservationRepository);
}

// ============================================
// Validation Schemas
// ============================================

const createReservationSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  start_datetime: z.string().datetime('Invalid start datetime format'),
  end_datetime: z.string().datetime('Invalid end datetime format'),
  purpose: z.enum(['business', 'personal']),
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
  action: z.enum(['approve', 'reject']),
  notes: z.string().max(500).optional(),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Check if user has permission to view all reservations
 */
function canViewAllReservations(user: any): boolean {
  const roles = user.roles || [];
  return roles.includes('Admin') || roles.includes('FleetManager') || roles.includes('Auditor');
}

/**
 * Check if user has permission to approve reservations
 */
function canApproveReservations(user: any): boolean {
  const roles = user.roles || [];
  return roles.includes('Admin') || roles.includes('FleetManager');
}

/**
 * Check if reservation requires approval based on purpose and policy
 */
async function requiresApproval(purpose: string, userId: string): Promise<boolean> {
  // Personal reservations always require approval
  if (purpose === 'personal') {
    return true;
  }

  // Check if user has auto-approval privilege for business reservations
  try {
    const hasRole = await reservationRepo.userHasAutoApproval(userId);
    // Admin and FleetManager don't need approval for business reservations
    return !hasRole;
  } catch (error) {
    // Default to requiring approval on error
    logger.error('Error checking auto-approval:', error);
    return true;
  }
}

/**
 * Create QueryContext from AuthRequest
 */
function createQueryContext(req: AuthRequest, client?: any): QueryContext {
  return {
    userId: req.user!.id,
    tenantId: req.user!.tenant_id || '',
    pool: client
  };
}

// ============================================
// GET /api/reservations
// List all reservations (filtered by user permissions)
// ============================================

/**
 * @route GET /api/reservations
 * @desc Get list of vehicle reservations
 * @access Requires authentication
 * @query page, limit, status, vehicle_id, user_id, start_date, end_date
 */
router.get('/',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10, status, vehicle_id, user_id, start_date, end_date } = req.query;

    const queryContext = createQueryContext(req);

    const filters = {
      status: status as string | undefined,
      vehicle_id: vehicle_id as string | undefined,
      user_id: user_id as string | undefined,
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined
    };

    const reservations = await reservationRepo.getReservations(queryContext, filters, parseInt(page as string), parseInt(limit as string));

    if (canViewAllReservations(req.user)) {
      res.json(reservations);
    } else {
      const userReservations = reservations.filter(r => r.user_id === req.user!.id);
      res.json(userReservations);
    }
  })
);

// ============================================
// GET /api/reservations/:id
// Get a specific reservation
// ============================================

/**
 * @route GET /api/reservations/:id
 * @desc Get a specific vehicle reservation
 * @access Requires authentication
 */
router.get('/:id',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const queryContext = createQueryContext(req);

    const reservation = await reservationRepo.getReservationById(queryContext, id);

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.user_id !== req.user!.id && !canViewAllReservations(req.user)) {
      throw new NotFoundError('Reservation not found');
    }

    res.json(reservation);
  })
);

// ============================================
// POST /api/reservations
// Create a new reservation
// ============================================

/**
 * @route POST /api/reservations
 * @desc Create a new vehicle reservation
 * @access Requires authentication
 */
router.post('/',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsedData = createReservationSchema.parse(req.body);

    const queryContext = createQueryContext(req);

    // Check for conflicts
    const conflicts = await reservationRepo.checkReservationConflicts(queryContext, parsedData.vehicle_id, parsedData.start_datetime, parsedData.end_datetime);
    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Reservation conflict', conflicts });
    }

    // Check if approval is required
    const approvalRequired = await requiresApproval(parsedData.purpose, req.user!.id);

    const newReservation = await reservationRepo.createReservation(queryContext, {
      ...parsedData,
      user_id: req.user!.id,
      status: approvalRequired ? 'pending' : 'approved',
      approval_required: approvalRequired
    });

    if (approvalRequired) {
      await microsoftService.sendApprovalRequest(newReservation);
    } else {
      await microsoftService.createCalendarEvent(newReservation);
    }

    res.status(201).json(newReservation);
  })
);

// ============================================
// PUT /api/reservations/:id
// Update an existing reservation
// ============================================

/**
 * @route PUT /api/reservations/:id
 * @desc Update an existing vehicle reservation
 * @access Requires authentication
 */
router.put('/:id',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsedData = updateReservationSchema.parse(req.body);

    const queryContext = createQueryContext(req);

    const existingReservation = await reservationRepo.getReservationById(queryContext, id);

    if (!existingReservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (existingReservation.user_id !== req.user!.id && !canViewAllReservations(req.user)) {
      throw new NotFoundError('Reservation not found');
    }

    if (existingReservation.status !== 'pending' && !canApproveReservations(req.user)) {
      return res.status(403).json({ error: 'Cannot modify approved or rejected reservations' });
    }

    // Check for conflicts if start/end times are changed
    if (parsedData.start_datetime || parsedData.end_datetime) {
      const newStart = parsedData.start_datetime || existingReservation.start_datetime;
      const newEnd = parsedData.end_datetime || existingReservation.end_datetime;

      const conflicts = await reservationRepo.checkReservationConflicts(queryContext, existingReservation.vehicle_id, newStart, newEnd, id);
      if (conflicts.length > 0) {
        return res.status(409).json({ error: 'Reservation conflict', conflicts });
      }
    }

    const updatedReservation = await reservationRepo.updateReservation(queryContext, id, parsedData);

    if (updatedReservation.status === 'approved') {
      await microsoftService.updateCalendarEvent(updatedReservation);
    }

    res.json(updatedReservation);
  })
);

// ============================================
// DELETE /api/reservations/:id
// Delete a reservation
// ============================================

/**
 * @route DELETE /api/reservations/:id
 * @desc Delete a vehicle reservation
 * @access Requires authentication
 */
router.delete('/:id',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const queryContext = createQueryContext(req);

    const existingReservation = await reservationRepo.getReservationById(queryContext, id);

    if (!existingReservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (existingReservation.user_id !== req.user!.id && !canViewAllReservations(req.user)) {
      throw new NotFoundError('Reservation not found');
    }

    if (existingReservation.status !== 'pending' && !canApproveReservations(req.user)) {
      return res.status(403).json({ error: 'Cannot delete approved or rejected reservations' });
    }

    await reservationRepo.deleteReservation(queryContext, id);

    if (existingReservation.status === 'approved') {
      await microsoftService.cancelCalendarEvent(existingReservation);
    }

    res.status(204).send();
  })
);

// ============================================
// POST /api/reservations/:id/approve
// Approve a reservation
// ============================================

/**
 * @route POST /api/reservations/:id/approve
 * @desc Approve a vehicle reservation
 * @access Requires FleetManager or Admin role
 */
router.post('/:id/approve',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsedData = approvalActionSchema.parse(req.body);

    if (!canApproveReservations(req.user)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const queryContext = createQueryContext(req);

    const existingReservation = await reservationRepo.getReservationById(queryContext, id);

    if (!existingReservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (existingReservation.status !== 'pending') {
      return res.status(400).json({ error: 'Reservation is not pending approval' });
    }

    const updatedReservation = await reservationRepo.updateReservationStatus(queryContext, id, parsedData.action === 'approve' ? 'approved' : 'rejected', parsedData.notes);

    if (parsedData.action === 'approve') {
      await microsoftService.createCalendarEvent(updatedReservation);
    }

    res.json(updatedReservation);
  })
);

export default router;


This refactored version replaces all instances of `pool.query` and `db.query` with calls to the `ReservationRepository`. The `ReservationRepository` is assumed to be implemented in a separate file and injected through the dependency injection container.

Key changes include:

1. Initialization of the `reservationRepo` using the dependency injection container in the `setDatabasePool` function.
2. Replacement of all database operations with corresponding `ReservationRepository` methods.
3. Creation of a `QueryContext` for each request, which is passed to the repository methods.
4. Removal of any direct database queries, ensuring all database operations go through the repository.

The repository methods used in this file are:

- `getReservations`
- `getReservationById`
- `checkReservationConflicts`
- `createReservation`
- `updateReservation`
- `deleteReservation`
- `updateReservationStatus`
- `userHasAutoApproval`

These methods should be implemented in the `ReservationRepository` class to handle the actual database operations.