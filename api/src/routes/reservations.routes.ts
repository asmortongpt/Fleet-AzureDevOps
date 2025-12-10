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
import { Pool } from 'pg';
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

// Database pool and services
let pool: Pool;
let microsoftService: MicrosoftIntegrationService;
let reservationRepo: ReservationRepository;

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
  microsoftService = new MicrosoftIntegrationService(dbPool);

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
    const hasRole = await reservationRepo.userHasAutoApproval(userId, pool);
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
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user!;
    const context = createQueryContext(req);

    const options = {
      status: req.query.status as string,
      vehicle_id: req.query.vehicle_id as string,
      user_id: req.query.user_id as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      purpose: req.query.purpose as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50
    };

    const canViewAll = canViewAllReservations(currentUser);
    const result = await reservationRepo.listReservations(context, options, canViewAll);

    res.json({
      reservations: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// ============================================
// GET /api/reservations/:id
// Get single reservation by ID
// ============================================

router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const context = createQueryContext(req);

    const canViewAll = canViewAllReservations(currentUser);
    const reservation = await reservationRepo.getReservationWithDetails(id, context, canViewAll);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found or access denied' });
    }

    res.json(reservation);
  } catch (error) {
    logger.error('Error fetching reservation:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// ============================================
// POST /api/reservations
// Create new vehicle reservation
// ============================================

router.post('/', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const data = createReservationSchema.parse(req.body);
    const currentUser = req.user!;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if vehicle exists
      const vehicle = await reservationRepo.checkVehicleExists(data.vehicle_id, client);
      if (!vehicle) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Check for reservation conflicts
      const hasConflict = await reservationRepo.checkConflict(
        data.vehicle_id,
        data.start_datetime,
        data.end_datetime,
        null,
        client
      );

      if (hasConflict) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Reservation conflict',
          message: 'This vehicle is already reserved for the selected time period',
        });
      }

      // Determine if approval is required
      const needsApproval = await requiresApproval(data.purpose, currentUser.id);

      // Create reservation
      const reservation = await reservationRepo.createReservation(
        {
          vehicle_id: data.vehicle_id,
          user_id: currentUser.id,
          reserved_by_name: currentUser.email, // Use email since name isn't in interface
          reserved_by_email: currentUser.email,
          start_datetime: data.start_datetime,
          end_datetime: data.end_datetime,
          purpose: data.purpose,
          notes: data.notes,
          approval_required: needsApproval,
          initial_status: needsApproval ? 'pending' : 'confirmed',
          tenant_id: currentUser.tenant_id,
          org_id: undefined // org_id not in AuthRequest interface
        },
        client
      );

    await client.query('COMMIT');

    // After successful creation, handle Microsoft integrations (non-blocking)
    setImmediate(async () => {
      try {
        // Create calendar event
        const eventId = await microsoftService.createCalendarEvent({
          ...reservation,
          unit_number: vehicle.unit_number,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
        });

        if (eventId) {
          await reservationRepo.updateCalendarEventId(reservation.id, eventId, pool);
        }

        // Send email confirmation to user
        await microsoftService.sendOutlookEmail(
          { ...reservation, ...vehicle },
          'created'
        );

        // If approval required, notify fleet managers
        if (needsApproval) {
          await microsoftService.notifyFleetManagers({ ...reservation, ...vehicle });
        }
      } catch (integrationError) {
        logger.error('Microsoft integration error:', integrationError);
        // Don't fail the request if integration fails
      }
    });

      res.status(201).json({
        message: 'Reservation created successfully',
        reservation,
        requires_approval: needsApproval,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error creating reservation:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// ============================================
// PUT /api/reservations/:id
// Update reservation
// ============================================

router.put('/:id', csrfProtection, authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateReservationSchema.parse(req.body);
  const currentUser = req.user!;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if reservation exists and user has permission
    const canViewAll = canViewAllReservations(currentUser);
    const existingReservation = await reservationRepo.getReservationForUpdate(
      id,
      currentUser.id,
      canViewAll,
      client
    );

    if (!existingReservation) {
      await client.query('ROLLBACK');
      throw new NotFoundError('Reservation not found or access denied');
    }

    // Only allow updates to pending or confirmed reservations
    if (!['pending', 'confirmed'].includes(existingReservation.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Cannot update reservation',
        message: 'Only pending or confirmed reservations can be updated',
      });
    }

    // If updating times, check for conflicts
    if (data.start_datetime || data.end_datetime) {
      const newStart = data.start_datetime || existingReservation.start_datetime;
      const newEnd = data.end_datetime || existingReservation.end_datetime;

      const hasConflict = await reservationRepo.checkConflict(
        existingReservation.vehicle_id,
        newStart.toString(),
        newEnd.toString(),
        id,
        client
      );

      if (hasConflict) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Reservation conflict',
          message: 'The updated time period conflicts with another reservation',
        });
      }
    }

    // Update reservation
    const updatedReservation = await reservationRepo.updateReservation(id, data, client);

    await client.query('COMMIT');

    // Update calendar event if it exists (non-blocking)
    if (existingReservation.microsoft_calendar_event_id) {
      setImmediate(async () => {
        try {
          await microsoftService.updateCalendarEvent(
            existingReservation.microsoft_calendar_event_id!,
            updatedReservation,
            existingReservation.reserved_by_email
          );
        } catch (error) {
          logger.error('Calendar update error:', error);
        }
      });
    }

    res.json({
      message: 'Reservation updated successfully',
      reservation: updatedReservation,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// ============================================
// DELETE /api/reservations/:id
// Cancel reservation (soft delete)
// ============================================

router.delete('/:id', csrfProtection, authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check permission
    const canViewAll = canViewAllReservations(currentUser);
    const reservation = await reservationRepo.getReservationForUpdate(
      id,
      currentUser.id,
      canViewAll,
      client
    );

    if (!reservation) {
      await client.query('ROLLBACK');
      throw new NotFoundError('Reservation not found or access denied');
    }

    // Cancel reservation (soft delete)
    await reservationRepo.cancelReservation(id, client);

    await client.query('COMMIT');

    // Delete calendar event if exists (non-blocking)
    if (reservation.microsoft_calendar_event_id) {
      setImmediate(async () => {
        try {
          await microsoftService.deleteCalendarEvent(
            reservation.microsoft_calendar_event_id!,
            reservation.reserved_by_email
          );
          await microsoftService.sendOutlookEmail(reservation, 'cancelled');
        } catch (error) {
          logger.error('Calendar deletion error:', error);
        }
      });
    }

    res.json({
      message: 'Reservation cancelled successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// ============================================
// POST /api/reservations/:id/approve
// Approve or reject reservation (FleetManager, Admin)
// ============================================

router.post('/:id/approve', csrfProtection, authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = approvalActionSchema.parse(req.body);
  const currentUser = req.user!;

  // Check permission
  if (!canApproveReservations(currentUser)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to approve reservations'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get reservation
    const context = createQueryContext(req, client);
    const reservation = await reservationRepo.findById(id, context);

    if (!reservation) {
      await client.query('ROLLBACK');
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Only pending reservations can be approved or rejected',
      });
    }

    // Update reservation
    const newStatus = data.action === 'approve' ? 'confirmed' : 'cancelled';
    const updatedReservation = await reservationRepo.approveReservation(
      id,
      newStatus,
      currentUser.id,
      client
    );

    await client.query('COMMIT');

    // Send notifications (non-blocking)
    setImmediate(async () => {
      try {
        await microsoftService.sendOutlookEmail(
          updatedReservation,
          data.action === 'approve' ? 'approved' : 'rejected'
        );

        if (data.action === 'approve') {
          await microsoftService.sendTeamsNotification(updatedReservation, 'approved');
        }
      } catch (error) {
        logger.error('Notification error:', error);
      }
    });

    res.json({
      message: `Reservation ${data.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      reservation: updatedReservation,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// ============================================
// GET /api/vehicles/:vehicleId/availability
// Check vehicle availability for a date range
// ============================================

router.get('/vehicles/:vehicleId/availability', authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { vehicleId } = req.params;
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'start_date and end_date are required',
    });
  }

  const availability = await reservationRepo.getVehicleAvailability(
    vehicleId,
    start_date as string,
    end_date as string,
    pool
  );

  res.json({
    vehicle_id: vehicleId,
    start_date,
    end_date,
    availability,
  });
}));

// ============================================
// GET /api/vehicles/:vehicleId/reservations
// Get vehicle reservation history
// ============================================

router.get('/vehicles/:vehicleId/reservations', authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { vehicleId } = req.params;
  const { status, start_date, end_date } = req.query;

  const reservations = await reservationRepo.getVehicleReservations(
    vehicleId,
    {
      status: status as string,
      start_date: start_date as string,
      end_date: end_date as string
    },
    pool
  );

  res.json({
    vehicle_id: vehicleId,
    reservations,
  });
}));

// ============================================
// GET /api/reservations/pending
// Get pending approval reservations (FleetManager, Admin)
// ============================================

router.get('/pending', authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUser = req.user!;

  if (!canApproveReservations(currentUser)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to view pending approvals'
    });
  }

  const pendingReservations = await reservationRepo.getPendingApprovals(pool);

  res.json({
    pending_reservations: pendingReservations,
    count: pendingReservations.length,
  });
}));

export default router;
