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
 *
 * Reference: CWE-89 (SQL Injection), CWE-862 (Missing Authorization)
 */

import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { getErrorMessage } from '../utils/error-handler';
import MicrosoftIntegrationService from '../services/microsoft-integration.service';

const router = express.Router();

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
  // Business reservations may not require approval (configurable)
  // Personal reservations always require approval
  if (purpose === 'personal') {
    return true;
  }

  // Check if user has auto-approval privilege for business reservations
  try {
    const result = await pool.query(
      'SELECT user_has_any_role($1, ARRAY['Admin', 'FleetManager']) as has_role`,
      [userId]
    );

    // Admin and FleetManager don't need approval for business reservations
    return !result.rows[0]?.has_role;
  } catch (error) {
    // Default to requiring approval on error
    return true;
  }
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

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const currentUser = req.user!;

    // Build WHERE clause based on permissions
    let whereConditions = ['vr.deleted_at IS NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    // Apply permission-based filtering
    if (!canViewAllReservations(currentUser)) {
      // Users can only see their own reservations
      whereConditions.push(`vr.user_id = $${paramIndex++}`);
      params.push(currentUser.id);
    }

    // Apply filters
    if (status) {
      whereConditions.push(`vr.status = $${paramIndex++}`);
      params.push(status);
    }
    if (vehicle_id) {
      whereConditions.push(`vr.vehicle_id = $${paramIndex++}`);
      params.push(vehicle_id);
    }
    if (user_id && canViewAllReservations(currentUser)) {
      whereConditions.push(`vr.user_id = $${paramIndex++}`);
      params.push(user_id);
    }
    if (start_date) {
      whereConditions.push(`vr.start_datetime >= $${paramIndex++}`);
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push(`vr.end_datetime <= $${paramIndex++}`);
      params.push(end_date);
    }
    if (purpose) {
      whereConditions.push(`vr.purpose = $${paramIndex++}`);
      params.push(purpose);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get reservations with vehicle and user details
    const query = `
      SELECT
        vr.*,
        v.unit_number,
        v.make,
        v.model,
        v.year,
        v.vin,
        v.license_plate,
        u.name as user_name,
        u.email as user_email,
        approver.name as approved_by_name,
        approver.email as approved_by_email
      FROM vehicle_reservations vr
      JOIN vehicles v ON vr.vehicle_id = v.id
      JOIN users u ON vr.user_id = u.id
      LEFT JOIN users approver ON vr.approved_by = approver.id
      WHERE ${whereClause}
      ORDER BY vr.start_datetime DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vehicle_reservations vr
      WHERE ${whereClause}
    `;

    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      reservations: result.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      error: 'Failed to fetch reservations',
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
    const currentUser = req.user!;

    // Build query with permission check
    let whereClause = 'vr.id = $1 AND vr.deleted_at IS NULL';
    const params: any[] = [id];

    if (!canViewAllReservations(currentUser)) {
      whereClause += ' AND vr.user_id = $2';
      params.push(currentUser.id);
    }

    const query = `
      SELECT
        vr.*,
        v.unit_number,
        v.make,
        v.model,
        v.year,
        v.vin,
        v.license_plate,
        v.classification,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        approver.name as approved_by_name,
        approver.email as approved_by_email
      FROM vehicle_reservations vr
      JOIN vehicles v ON vr.vehicle_id = v.id
      JOIN users u ON vr.user_id = u.id
      LEFT JOIN users approver ON vr.approved_by = approver.id
      WHERE ${whereClause}
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Reservation not found or access denied'
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching reservation:', error);
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

router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const data = createReservationSchema.parse(req.body);
    const currentUser = req.user!;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if vehicle exists
      const vehicleCheck = await client.query(
        'SELECT id, unit_number, make, model, year FROM vehicles WHERE id = $1 AND deleted_at IS NULL',
        [data.vehicle_id]
      );

      if (vehicleCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      const vehicle = vehicleCheck.rows[0];

      // Check for reservation conflicts using the database function
      const conflictCheck = await client.query(
        'SELECT check_reservation_conflict($1, $2, $3) as has_conflict',
        [data.vehicle_id, data.start_datetime, data.end_datetime]
      );

      if (conflictCheck.rows[0].has_conflict) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Reservation conflict',
          message: 'This vehicle is already reserved for the selected time period',
        });
      }

      // Determine if approval is required
      const needsApproval = await requiresApproval(data.purpose, currentUser.id);

      // Create reservation
      const insertQuery = `
        INSERT INTO vehicle_reservations (
          vehicle_id,
          user_id,
          reserved_by_name,
          reserved_by_email,
          start_datetime,
          end_datetime,
          purpose,
          status,
          notes,
          approval_required,
          tenant_id,
          org_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const initialStatus = needsApproval ? 'pending' : 'confirmed';

      const result = await client.query(insertQuery, [
        data.vehicle_id,
        currentUser.id,
        currentUser.name || currentUser.email,
        currentUser.email,
        data.start_datetime,
        data.end_datetime,
        data.purpose,
        initialStatus,
        data.notes || null,
        needsApproval,
        currentUser.tenant_id || null,
        currentUser.org_id || null,
      ]);

      const reservation = result.rows[0];

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
            await pool.query(
              'UPDATE vehicle_reservations SET microsoft_calendar_event_id = $1 WHERE id = $2',
              [eventId, reservation.id]
            );
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
          console.error('Microsoft integration error:', integrationError);
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
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
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

router.put('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateReservationSchema.parse(req.body);
    const currentUser = req.user!;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if reservation exists and user has permission
      const checkQuery = canViewAllReservations(currentUser)
        ? 'SELECT * FROM vehicle_reservations WHERE id = $1 AND deleted_at IS NULL'
        : 'SELECT * FROM vehicle_reservations WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL';

      const checkParams = canViewAllReservations(currentUser) ? [id] : [id, currentUser.id];
      const checkResult = await client.query(checkQuery, checkParams);

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Reservation not found or access denied'
        });
      }

      const existingReservation = checkResult.rows[0];

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

        const conflictCheck = await client.query(
          'SELECT check_reservation_conflict($1, $2, $3, $4) as has_conflict',
          [existingReservation.vehicle_id, newStart, newEnd, id]
        );

        if (conflictCheck.rows[0].has_conflict) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            error: 'Reservation conflict',
            message: 'The updated time period conflicts with another reservation',
          });
        }
      }

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (data.start_datetime) {
        updates.push(`start_datetime = $${paramIndex++}`);
        params.push(data.start_datetime);
      }
      if (data.end_datetime) {
        updates.push(`end_datetime = $${paramIndex++}`);
        params.push(data.end_datetime);
      }
      if (data.purpose) {
        updates.push(`purpose = $${paramIndex++}`);
        params.push(data.purpose);
      }
      if (data.notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        params.push(data.notes);
      }

      updates.push(`updated_at = NOW()`);
      params.push(id);

      const updateQuery = `
        UPDATE vehicle_reservations
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(updateQuery, params);
      const updatedReservation = result.rows[0];

      await client.query('COMMIT');

      // Update calendar event if it exists (non-blocking)
      if (existingReservation.microsoft_calendar_event_id) {
        setImmediate(async () => {
          try {
            await microsoftService.updateCalendarEvent(
              existingReservation.microsoft_calendar_event_id,
              updatedReservation,
              existingReservation.reserved_by_email
            );
          } catch (error) {
            console.error('Calendar update error:', error);
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
  } catch (error: any) {
    console.error('Error updating reservation:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
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

router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check permission
      const checkQuery = canViewAllReservations(currentUser)
        ? 'SELECT * FROM vehicle_reservations WHERE id = $1 AND deleted_at IS NULL'
        : 'SELECT * FROM vehicle_reservations WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL';

      const checkParams = canViewAllReservations(currentUser) ? [id] : [id, currentUser.id];
      const checkResult = await client.query(checkQuery, checkParams);

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Reservation not found or access denied'
        });
      }

      const reservation = checkResult.rows[0];

      // Update status to cancelled (soft delete)
      await client.query(
        `UPDATE vehicle_reservations
         SET status = 'cancelled', deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1',
        [id]
      );

      await client.query('COMMIT');

      // Delete calendar event if exists (non-blocking)
      if (reservation.microsoft_calendar_event_id) {
        setImmediate(async () => {
          try {
            await microsoftService.deleteCalendarEvent(
              reservation.microsoft_calendar_event_id,
              reservation.reserved_by_email
            );
            await microsoftService.sendOutlookEmail(reservation, 'cancelled');
          } catch (error) {
            console.error('Calendar deletion error:', error);
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
  } catch (error: any) {
    console.error('Error cancelling reservation:', error);
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

router.post('/:id/approve', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
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
      const reservationResult = await client.query(
        'SELECT * FROM vehicle_reservations WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );

      if (reservationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Reservation not found' });
      }

      const reservation = reservationResult.rows[0];

      if (reservation.status !== 'pending') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Only pending reservations can be approved or rejected',
        });
      }

      // Update reservation
      const newStatus = data.action === 'approve' ? 'confirmed' : 'cancelled';
      const updateQuery = `
        UPDATE vehicle_reservations
        SET
          status = $1,
          approved_by = $2,
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await client.query(updateQuery, [newStatus, currentUser.id, id]);
      const updatedReservation = result.rows[0];

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
          console.error('Notification error:', error);
        }
      });

      res.json({
        message: 'Reservation ${data.action === 'approve' ? 'approved' : 'rejected'} successfully`,
        reservation: updatedReservation,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error processing approval:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
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

    // Use the database function to get availability
    const query = `
      SELECT *
      FROM get_vehicle_availability($1, $2::DATE, $3::DATE)
    `;

    const result = await pool.query(query, [vehicleId, start_date, end_date]);

    res.json({
      vehicle_id: vehicleId,
      start_date,
      end_date,
      availability: result.rows,
    });
  } catch (error: any) {
    console.error('Error checking vehicle availability:', error);
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

    let whereConditions = ['vehicle_id = $1', 'deleted_at IS NULL'];
    const params: any[] = [vehicleId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (start_date) {
      whereConditions.push(`start_datetime >= $${paramIndex++}`);
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push(`end_datetime <= $${paramIndex++}`);
      params.push(end_date);
    }

    const query = `
      SELECT
        vr.*,
        u.name as user_name,
        u.email as user_email,
        approver.name as approved_by_name
      FROM vehicle_reservations vr
      JOIN users u ON vr.user_id = u.id
      LEFT JOIN users approver ON vr.approved_by = approver.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY vr.start_datetime DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      vehicle_id: vehicleId,
      reservations: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching vehicle reservations:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicle reservations',
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
    const currentUser = req.user!;

    if (!canApproveReservations(currentUser)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view pending approvals'
      });
    }

    const query = `
      SELECT * FROM pending_approval_reservations
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query);

    res.json({
      pending_reservations: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error('Error fetching pending reservations:', error);
    res.status(500).json({
      error: 'Failed to fetch pending reservations',
      details: getErrorMessage(error),
    });
  }
});

export default router;
