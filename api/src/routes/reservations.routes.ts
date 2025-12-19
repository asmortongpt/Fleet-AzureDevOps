/**
 * Vehicle Reservations API Routes
 *
 * Refactored to use Repository/Service pattern.
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
 *
 * Reference: CWE-89 (SQL Injection), CWE-862 (Missing Authorization)
 */

import express, { Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';

import logger from '../config/logger';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import ReservationsService, { UserContext } from '../services/reservations.service';
import { getErrorMessage } from '../utils/error-handler';

const router = express.Router();

// Database pool and service (will be set via setDatabasePool)
let pool: Pool;
let reservationsService: ReservationsService;

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
  reservationsService = new ReservationsService(dbPool);
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
// Helper: Convert AuthRequest user to UserContext
// ============================================

function getUserContext(req: AuthRequest): UserContext {
  const user = req.user!;
  return {
    id: user.id,
    name: user.name || user.email,
    email: user.email,
    roles: user.roles || [],
    tenant_id: user.tenant_id || '',
    org_id: user.org_id,
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
    const {
      page = '1',
      limit = '50',
      status,
      vehicle_id,
      user_id,
      start_date,
      end_date,
      purpose,
    } = req.query;

    const userContext = getUserContext(req);

    const filters = {
      status: status as string | undefined,
      vehicle_id: vehicle_id as string | undefined,
      user_id: user_id as string | undefined,
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
      purpose: purpose as string | undefined,
    };

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    const result = await reservationsService.getReservations(userContext, filters, options);

    res.json({
      reservations: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    logger.error('Error fetching reservations:', error);
    res.status(500).json({
      error: 'Failed to fetch reservations',
      details: getErrorMessage(error),
    });
  }
});

// ============================================
// GET /api/reservations/pending
// Get pending approval reservations (FleetManager, Admin)
// ============================================

router.get('/pending', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userContext = getUserContext(req);
    const pendingReservations = await reservationsService.getPendingApprovals(userContext);

    res.json({
      pending_reservations: pendingReservations,
      count: pendingReservations.length,
    });
  } catch (error: any) {
    logger.error('Error fetching pending reservations:', error);
    
    if (error.message.includes('permission')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to fetch pending reservations',
      details: getErrorMessage(error),
    });
  }
});

// ============================================
// GET /api/reservations/:id
// Get single reservation by ID
// ============================================

router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userContext = getUserContext(req);

    const reservation = await reservationsService.getReservationById(id, userContext);
    res.json(reservation);
  } catch (error: any) {
    logger.error('Error fetching reservation:', error);

    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to fetch reservation',
      details: getErrorMessage(error),
    });
  }
});

// ============================================
// POST /api/reservations
// Create new vehicle reservation
// ============================================

router.post('/', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const data = createReservationSchema.parse(req.body);
    const userContext = getUserContext(req);

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await reservationsService.createReservation(data, userContext, client);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Reservation created successfully',
        reservation: result.reservation,
        requires_approval: result.requires_approval,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    logger.error('Error creating reservation:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (error.message.includes('conflict') || error.message.includes('reserved')) {
      return res.status(409).json({
        error: 'Reservation conflict',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to create reservation',
      details: getErrorMessage(error),
    });
  }
});

// ============================================
// PUT /api/reservations/:id
// Update reservation
// ============================================

router.put('/:id', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateReservationSchema.parse(req.body);
    const userContext = getUserContext(req);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updatedReservation = await reservationsService.updateReservation(
        id,
        data,
        userContext,
        client
      );

      await client.query('COMMIT');

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
  } catch (error: any) {
    logger.error('Error updating reservation:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (error.message.includes('Only pending') || error.message.includes('conflict')) {
      return res.status(400).json({
        error: 'Cannot update reservation',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to update reservation',
      details: getErrorMessage(error),
    });
  }
});

// ============================================
// DELETE /api/reservations/:id
// Cancel reservation (soft delete)
// ============================================

router.delete('/:id', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userContext = getUserContext(req);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await reservationsService.cancelReservation(id, userContext, client);

      await client.query('COMMIT');

      res.json({
        message: 'Reservation cancelled successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    logger.error('Error cancelling reservation:', error);

    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to cancel reservation',
      details: getErrorMessage(error),
    });
  }
});

// ============================================
// POST /api/reservations/:id/approve
// Approve or reject reservation (FleetManager, Admin)
// ============================================

router.post('/:id/approve', csrfProtection, authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = approvalActionSchema.parse(req.body);
    const userContext = getUserContext(req);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updatedReservation = await reservationsService.approveReservation(
        id,
        data.action,
        userContext,
        client
      );

      await client.query('COMMIT');

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
  } catch (error: any) {
    logger.error('Error processing approval:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error.message.includes('permission')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (error.message.includes('Only pending')) {
      return res.status(400).json({
        error: 'Invalid status',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to process approval',
      details: getErrorMessage(error),
    });
  }
});

// ============================================
// GET /api/vehicles/:vehicleId/availability
// Check vehicle availability for a date range
// ============================================

router.get('/vehicles/:vehicleId/availability', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'start_date and end_date are required',
      });
    }

    const userContext = getUserContext(req);
    const availability = await reservationsService.getVehicleAvailability(
      vehicleId,
      start_date as string,
      end_date as string,
      userContext
    );

    res.json({
      vehicle_id: vehicleId,
      start_date,
      end_date,
      availability,
    });
  } catch (error: any) {
    logger.error('Error checking vehicle availability:', error);
    res.status(500).json({
      error: 'Failed to check vehicle availability',
      details: getErrorMessage(error),
    });
  }
});

// ============================================
// GET /api/vehicles/:vehicleId/reservations
// Get vehicle reservation history
// ============================================

router.get('/vehicles/:vehicleId/reservations', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const { status, start_date, end_date } = req.query;

    const userContext = getUserContext(req);
    const filters = {
      status: status as string | undefined,
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
    };

    const reservations = await reservationsService.getVehicleReservations(
      vehicleId,
      filters,
      userContext
    );

    res.json({
      vehicle_id: vehicleId,
      reservations,
    });
  } catch (error: any) {
    logger.error('Error fetching vehicle reservations:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicle reservations',
      details: getErrorMessage(error),
    });
  }
});

export default router;
