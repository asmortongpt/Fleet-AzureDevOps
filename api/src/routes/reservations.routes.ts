Here's the refactored version of the file, replacing `pool.query` and `db.query` with the `ReservationRepository`. I've completed the file and made the necessary adjustments:


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
 * @query page, limit, status, vehicle_id, user_id, start_date, end_date, purpose
 */
router.get('/', authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, status, vehicle_id, user_id, start_date, end_date, purpose } = req.query;

  const queryContext = createQueryContext(req);

  const filters = {
    status,
    vehicleId: vehicle_id,
    userId: user_id,
    startDate: start_date,
    endDate: end_date,
    purpose
  };

  const canViewAll = canViewAllReservations(req.user);

  const reservations = await reservationRepo.getReservations(queryContext, {
    page: Number(page),
    limit: Number(limit),
    filters,
    canViewAll
  });

  res.json(reservations);
}));

// ============================================
// GET /api/reservations/:id
// Get a specific reservation
// ============================================

/**
 * @route GET /api/reservations/:id
 * @desc Get a specific vehicle reservation
 * @access Requires authentication
 */
router.get('/:id', authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const queryContext = createQueryContext(req);

  const reservation = await reservationRepo.getReservationById(queryContext, id);

  if (!reservation) {
    throw new NotFoundError('Reservation not found');
  }

  res.json(reservation);
}));

// ============================================
// POST /api/reservations
// Create a new reservation
// ============================================

/**
 * @route POST /api/reservations
 * @desc Create a new vehicle reservation
 * @access Requires authentication
 */
router.post('/', authenticateJWT, csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsedData = createReservationSchema.parse(req.body);

  const queryContext = createQueryContext(req);

  // Check for conflicts
  const conflicts = await reservationRepo.checkForConflicts(queryContext, {
    vehicleId: parsedData.vehicle_id,
    startDatetime: new Date(parsedData.start_datetime),
    endDatetime: new Date(parsedData.end_datetime)
  });

  if (conflicts.length > 0) {
    return res.status(409).json({ error: 'Reservation conflict detected', conflicts });
  }

  // Check if approval is required
  const needsApproval = await requiresApproval(parsedData.purpose, req.user!.id);

  const newReservation = await reservationRepo.createReservation(queryContext, {
    ...parsedData,
    userId: req.user!.id,
    approvalRequired: needsApproval
  });

  // Integrate with Microsoft services
  if (newReservation.approvalRequired) {
    await microsoftService.createApprovalRequest(newReservation.id, req.user!.id);
  }

  await microsoftService.createCalendarEvent(newReservation.id, req.user!.id);

  res.status(201).json(newReservation);
}));

// ============================================
// PUT /api/reservations/:id
// Update an existing reservation
// ============================================

/**
 * @route PUT /api/reservations/:id
 * @desc Update an existing vehicle reservation
 * @access Requires authentication
 */
router.put('/:id', authenticateJWT, csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const parsedData = updateReservationSchema.parse(req.body);

  const queryContext = createQueryContext(req);

  const existingReservation = await reservationRepo.getReservationById(queryContext, id);

  if (!existingReservation) {
    throw new NotFoundError('Reservation not found');
  }

  // Check if user has permission to update this reservation
  if (existingReservation.userId !== req.user!.id && !canApproveReservations(req.user)) {
    return res.status(403).json({ error: 'Not authorized to update this reservation' });
  }

  // Check for conflicts if dates are being updated
  if (parsedData.start_datetime || parsedData.end_datetime) {
    const conflicts = await reservationRepo.checkForConflicts(queryContext, {
      vehicleId: existingReservation.vehicleId,
      startDatetime: parsedData.start_datetime ? new Date(parsedData.start_datetime) : new Date(existingReservation.startDatetime),
      endDatetime: parsedData.end_datetime ? new Date(parsedData.end_datetime) : new Date(existingReservation.endDatetime),
      excludeReservationId: id
    });

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Reservation conflict detected', conflicts });
    }
  }

  const updatedReservation = await reservationRepo.updateReservation(queryContext, id, parsedData);

  // Update Microsoft services
  await microsoftService.updateCalendarEvent(updatedReservation.id, req.user!.id);

  res.json(updatedReservation);
}));

// ============================================
// DELETE /api/reservations/:id
// Delete a reservation
// ============================================

/**
 * @route DELETE /api/reservations/:id
 * @desc Delete a vehicle reservation
 * @access Requires authentication
 */
router.delete('/:id', authenticateJWT, csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const queryContext = createQueryContext(req);

  const existingReservation = await reservationRepo.getReservationById(queryContext, id);

  if (!existingReservation) {
    throw new NotFoundError('Reservation not found');
  }

  // Check if user has permission to delete this reservation
  if (existingReservation.userId !== req.user!.id && !canApproveReservations(req.user)) {
    return res.status(403).json({ error: 'Not authorized to delete this reservation' });
  }

  await reservationRepo.deleteReservation(queryContext, id);

  // Remove from Microsoft services
  await microsoftService.deleteCalendarEvent(id, req.user!.id);

  res.status(204).send();
}));

// ============================================
// POST /api/reservations/:id/approve
// Approve or reject a reservation
// ============================================

/**
 * @route POST /api/reservations/:id/approve
 * @desc Approve or reject a vehicle reservation
 * @access Requires authentication and approval permissions
 */
router.post('/:id/approve', authenticateJWT, csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const parsedData = approvalActionSchema.parse(req.body);

  const queryContext = createQueryContext(req);

  const existingReservation = await reservationRepo.getReservationById(queryContext, id);

  if (!existingReservation) {
    throw new NotFoundError('Reservation not found');
  }

  if (!canApproveReservations(req.user)) {
    return res.status(403).json({ error: 'Not authorized to approve/reject reservations' });
  }

  const updatedReservation = await reservationRepo.updateApprovalStatus(queryContext, id, parsedData.action, parsedData.notes);

  // Update Microsoft services
  if (parsedData.action === 'approve') {
    await microsoftService.approveReservation(id, req.user!.id);
  } else {
    await microsoftService.rejectReservation(id, req.user!.id);
  }

  res.json(updatedReservation);
}));

export default router;


In this refactored version:

1. I've removed the `Pool` import and the `pool` variable, as we're now using the repository pattern.

2. The `setDatabasePool` function no longer takes a `Pool` parameter. Instead, it initializes the `microsoftService` and `reservationRepo`.

3. All database operations that previously used `pool.query` or `db.query` have been replaced with calls to methods on the `ReservationRepository`.

4. The `QueryContext` is created using the `createQueryContext` helper function for each database operation.

5. The `requiresApproval` function now uses the `reservationRepo.userHasAutoApproval` method instead of directly querying the database.

6. The `MicrosoftIntegrationService` no longer takes a `Pool` in its constructor, as it should now use the repository pattern for any database operations it needs to perform.

7. All routes have been completed, including the GET, POST, PUT, DELETE, and approval routes.

8. Error handling and input validation using Zod have been maintained.

9. The security measures mentioned in the file's documentation (authentication, permission-based access control, parameterized queries, and input validation) are still in place.

This refactored version adheres to the repository pattern and removes all direct database queries from the routes, improving the separation of concerns and making the code more maintainable and testable.