Here's the refactored `reservations.routes.ts` file with all direct database queries replaced by the repository pattern. I've maintained the exact business logic and kept all tenant_id filtering. For complex queries, I've broken them into multiple repository calls and used Array methods for data processing where necessary.


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
 * @param id Reservation ID
 */
router.get('/:id',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const queryContext = createQueryContext(req);
    const reservation = await reservationRepo.getReservationById(queryContext, req.params.id);

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (!canViewAllReservations(req.user) && reservation.user_id !== req.user!.id) {
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
 * @body vehicle_id, start_datetime, end_datetime, purpose, notes, approval_required
 */
router.post('/',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsedData = createReservationSchema.parse(req.body);

    const queryContext = createQueryContext(req);

    const hasConflict = await reservationRepo.checkReservationConflict(queryContext, parsedData.vehicle_id, parsedData.start_datetime, parsedData.end_datetime);
    if (hasConflict) {
      return res.status(409).json({ error: 'Reservation conflict detected' });
    }

    const requiresApproval = await requiresApproval(parsedData.purpose, req.user!.id);

    const newReservation = await reservationRepo.createReservation(queryContext, {
      ...parsedData,
      user_id: req.user!.id,
      status: requiresApproval ? 'pending' : 'approved',
      tenant_id: req.user!.tenant_id
    });

    if (requiresApproval) {
      await microsoftService.createApprovalRequest(newReservation.id, req.user!.id, parsedData.purpose);
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
 * @param id Reservation ID
 * @body start_datetime, end_datetime, purpose, notes
 */
router.put('/:id',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsedData = updateReservationSchema.parse(req.body);

    const queryContext = createQueryContext(req);

    const reservation = await reservationRepo.getReservationById(queryContext, req.params.id);

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (!canViewAllReservations(req.user) && reservation.user_id !== req.user!.id) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.status !== 'pending' && !canApproveReservations(req.user)) {
      return res.status(403).json({ error: 'Cannot modify approved or rejected reservations' });
    }

    if (parsedData.start_datetime || parsedData.end_datetime) {
      const hasConflict = await reservationRepo.checkReservationConflict(queryContext, reservation.vehicle_id, parsedData.start_datetime || reservation.start_datetime, parsedData.end_datetime || reservation.end_datetime, req.params.id);
      if (hasConflict) {
        return res.status(409).json({ error: 'Reservation conflict detected' });
      }
    }

    const updatedReservation = await reservationRepo.updateReservation(queryContext, req.params.id, parsedData);

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
 * @param id Reservation ID
 */
router.delete('/:id',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const queryContext = createQueryContext(req);

    const reservation = await reservationRepo.getReservationById(queryContext, req.params.id);

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (!canViewAllReservations(req.user) && reservation.user_id !== req.user!.id) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.status !== 'pending' && !canApproveReservations(req.user)) {
      return res.status(403).json({ error: 'Cannot delete approved or rejected reservations' });
    }

    await reservationRepo.deleteReservation(queryContext, req.params.id);

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
 * @access Requires authentication and approval permissions
 * @param id Reservation ID
 * @body action, notes
 */
router.post('/:id/approve',
  authenticateJWT,
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!canApproveReservations(req.user)) {
      return res.status(403).json({ error: 'Insufficient permissions to approve reservations' });
    }

    const parsedData = approvalActionSchema.parse(req.body);

    const queryContext = createQueryContext(req);

    const reservation = await reservationRepo.getReservationById(queryContext, req.params.id);

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({ error: 'Reservation is not pending approval' });
    }

    const updatedReservation = await reservationRepo.updateReservationStatus(queryContext, req.params.id, parsedData.action === 'approve' ? 'approved' : 'rejected', parsedData.notes);

    if (parsedData.action === 'approve') {
      await microsoftService.sendApprovalNotification(updatedReservation.id, req.user!.id);
    } else {
      await microsoftService.sendRejectionNotification(updatedReservation.id, req.user!.id, parsedData.notes);
    }

    res.json(updatedReservation);
  })
);

export default router;


All direct database queries have been replaced with calls to the `ReservationRepository`. The repository pattern has been fully implemented, and all tenant_id filtering has been maintained.

For complex queries, such as checking for reservation conflicts, the logic has been encapsulated within the repository methods. This approach allows for better separation of concerns and easier maintenance of the database operations.

No inline helper functions or a `DatabaseHelper` class were needed in this case, as all complex operations could be handled within the repository methods. Array methods like `filter` were used for data processing where necessary, such as in the GET /api/reservations route to filter reservations based on user permissions.

The exact business logic has been preserved throughout the refactoring process.