/**
 * Reservations Repository
 * 
 * Handles all database operations for vehicle reservations
 * with proper security, tenant isolation, and transaction support.
 * 
 * Security: CWE-89 (SQL Injection) - All queries use parameterization
 */


import { NotFoundError, DatabaseError } from '../middleware/errorHandler';

import { BaseRepository, QueryContext, PaginatedResult, PaginationOptions } from './base/BaseRepository';

export interface Reservation {
  id: string;
  vehicle_id: string;
  user_id: string;
  reserved_by_name: string;
  reserved_by_email: string;
  start_datetime: Date;
  end_datetime: Date;
  purpose: 'business' | 'personal';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: Date;
  microsoft_calendar_event_id?: string;
  tenant_id: string;
  org_id?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ReservationWithDetails extends Reservation {
  unit_number?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  license_plate?: string;
  classification?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  approved_by_name?: string;
  approved_by_email?: string;
}

export interface ReservationFilters {
  status?: string;
  vehicle_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  purpose?: string;
  user_can_view_all?: boolean;
}

export interface CreateReservationData {
  vehicle_id: string;
  start_datetime: string;
  end_datetime: string;
  purpose: 'business' | 'personal';
  notes?: string;
  approval_required?: boolean;
}

export interface UpdateReservationData {
  start_datetime?: string;
  end_datetime?: string;
  purpose?: 'business' | 'personal';
  notes?: string;
}

export interface ApprovalData {
  approved_by: string;
  status: 'confirmed' | 'cancelled';
}

export class ReservationsRepository extends BaseRepository<Reservation> {
  protected tableName = 'vehicle_reservations';
  protected idColumn = 'id';

  /**
   * Find reservations with filters and pagination
   */
  async findWithFilters(
    context: QueryContext,
    filters: ReservationFilters,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ReservationWithDetails>> {
    try {
      const pool = this.getPool(context);
      const { page = 1, limit = 50 } = options;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const whereConditions = ['vr.deleted_at IS NULL', 'vr.tenant_id = '];
      const params: any[] = [context.tenantId];
      let paramIndex = 2;

      // Apply permission-based filtering
      if (!filters.user_can_view_all) {
        whereConditions.push(`vr.user_id = $${paramIndex++}`);
        params.push(context.userId);
      }

      // Apply filters
      if (filters.status) {
        whereConditions.push(`vr.status = $${paramIndex++}`);
        params.push(filters.status);
      }
      if (filters.vehicle_id) {
        whereConditions.push(`vr.vehicle_id = $${paramIndex++}`);
        params.push(filters.vehicle_id);
      }
      if (filters.user_id && filters.user_can_view_all) {
        whereConditions.push(`vr.user_id = $${paramIndex++}`);
        params.push(filters.user_id);
      }
      if (filters.start_date) {
        whereConditions.push(`vr.start_datetime >= $${paramIndex++}`);
        params.push(filters.start_date);
      }
      if (filters.end_date) {
        whereConditions.push(`vr.end_datetime <= $${paramIndex++}`);
        params.push(filters.end_date);
      }
      if (filters.purpose) {
        whereConditions.push(`vr.purpose = $${paramIndex++}`);
        params.push(filters.purpose);
      }

      const whereClause = whereConditions.join(' AND ');

      // Query with joins
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

      params.push(limit, offset);
      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM vehicle_reservations vr
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new DatabaseError('Failed to find reservations with filters', { filters, error });
    }
  }

  /**
   * Find single reservation by ID with details
   */
  async findByIdWithDetails(
    id: string,
    context: QueryContext,
    userCanViewAll: boolean
  ): Promise<ReservationWithDetails | null> {
    try {
      const pool = this.getPool(context);
      
      let whereClause = 'vr.id =  AND vr.tenant_id =  AND vr.deleted_at IS NULL';
      const params: any[] = [id, context.tenantId];

      if (!userCanViewAll) {
        whereClause += ' AND vr.user_id = ';
        params.push(context.userId);
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
      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find reservation by ID with details', { id, error });
    }
  }

  /**
   * Check if vehicle exists and is active
   */
  async checkVehicleExists(vehicleId: string, context: QueryContext): Promise<{
    id: string;
    unit_number: string;
    make: string;
    model: string;
    year: number;
  } | null> {
    try {
      const pool = this.getPool(context);
      const result = await pool.query(
        'SELECT id, unit_number, make, model, year FROM vehicles WHERE id =  AND tenant_id =  AND deleted_at IS NULL',
        [vehicleId, context.tenantId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to check vehicle exists', { vehicleId, error });
    }
  }

  /**
   * Check for reservation conflicts using database function
   */
  async checkConflict(
    vehicleId: string,
    startDatetime: string,
    endDatetime: string,
    excludeReservationId?: string
  ): Promise<boolean> {
    try {
      const pool = this.getPool({ userId: '', tenantId: '' } as QueryContext);
      
      const query = excludeReservationId
        ? 'SELECT check_reservation_conflict(, , , ) as has_conflict'
        : 'SELECT check_reservation_conflict(, , ) as has_conflict';
      
      const params = excludeReservationId
        ? [vehicleId, startDatetime, endDatetime, excludeReservationId]
        : [vehicleId, startDatetime, endDatetime];

      const result = await pool.query(query, params);
      return result.rows[0]?.has_conflict || false;
    } catch (error) {
      throw new DatabaseError('Failed to check reservation conflict', { vehicleId, error });
    }
  }

  /**
   * Check if user has auto-approval privilege
   */
  async userHasAutoApproval(userId: string, context: QueryContext): Promise<boolean> {
    try {
      const pool = this.getPool(context);
      const result = await pool.query(
        "SELECT user_has_any_role(, ARRAY['Admin', 'FleetManager']) as has_role",
        [userId]
      );
      return result.rows[0]?.has_role || false;
    } catch (error) {
      // Default to requiring approval on error
      return false;
    }
  }

  /**
   * Create new reservation
   */
  async create(
    data: CreateReservationData,
    userInfo: {
      userId: string;
      name: string;
      email: string;
      tenantId: string;
      orgId?: string;
    },
    needsApproval: boolean
  ): Promise<Reservation> {
    try {
      const pool = this.getPool({ userId: userInfo.userId, tenantId: userInfo.tenantId });
      
      const query = `
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
        ) VALUES (, , , , , , , , , , , )
        RETURNING *
      `;

      const initialStatus = needsApproval ? 'pending' : 'confirmed';
      const params = [
        data.vehicle_id,
        userInfo.userId,
        userInfo.name,
        userInfo.email,
        data.start_datetime,
        data.end_datetime,
        data.purpose,
        initialStatus,
        data.notes || null,
        needsApproval,
        userInfo.tenantId,
        userInfo.orgId || null,
      ];

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Failed to create reservation', { data, error });
    }
  }

  /**
   * Update reservation
   */
  async update(
    id: string,
    data: UpdateReservationData,
    context: QueryContext
  ): Promise<Reservation> {
    try {
      const pool = this.getPool(context);

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
      params.push(id, context.tenantId);

      const query = `
        UPDATE vehicle_reservations
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Reservation');
      }

      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Failed to update reservation', { id, data, error });
    }
  }

  /**
   * Update calendar event ID
   */
  async updateCalendarEventId(
    id: string,
    eventId: string,
    context: QueryContext
  ): Promise<void> {
    try {
      const pool = this.getPool(context);
      await pool.query(
        'UPDATE vehicle_reservations SET microsoft_calendar_event_id =  WHERE id = ',
        [eventId, id]
      );
    } catch (error) {
      throw new DatabaseError('Failed to update calendar event ID', { id, eventId, error });
    }
  }

  /**
   * Cancel reservation (soft delete)
   */
  async cancel(id: string, context: QueryContext): Promise<void> {
    try {
      const pool = this.getPool(context);
      await pool.query(
        'UPDATE vehicle_reservations SET status = \'cancelled\', deleted_at = NOW(), updated_at = NOW() WHERE id =  AND tenant_id = ',
        [id, context.tenantId]
      );
    } catch (error) {
      throw new DatabaseError('Failed to cancel reservation', { id, error });
    }
  }

  /**
   * Approve or reject reservation
   */
  async approveOrReject(
    id: string,
    approvalData: ApprovalData,
    context: QueryContext
  ): Promise<Reservation> {
    try {
      const pool = this.getPool(context);
      
      const query = `
        UPDATE vehicle_reservations
        SET
          status = ,
          approved_by = ,
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id =  AND tenant_id = 
        RETURNING *
      `;

      const result = await pool.query(query, [
        approvalData.status,
        approvalData.approved_by,
        id,
        context.tenantId,
      ]);

      if (result.rows.length === 0) {
        throw new NotFoundError('Reservation');
      }

      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Failed to approve/reject reservation', { id, error });
    }
  }

  /**
   * Get vehicle availability
   */
  async getVehicleAvailability(
    vehicleId: string,
    startDate: string,
    endDate: string,
    context: QueryContext
  ): Promise<any[]> {
    try {
      const pool = this.getPool(context);
      const query = 'SELECT * FROM get_vehicle_availability(, ::DATE, ::DATE)';
      const result = await pool.query(query, [vehicleId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to get vehicle availability', { vehicleId, error });
    }
  }

  /**
   * Get vehicle reservations history
   */
  async getVehicleReservations(
    vehicleId: string,
    filters: { status?: string; start_date?: string; end_date?: string },
    context: QueryContext
  ): Promise<any[]> {
    try {
      const pool = this.getPool(context);
      
      const whereConditions = ['vehicle_id = ', 'deleted_at IS NULL', 'tenant_id = '];
      const params: any[] = [vehicleId, context.tenantId];
      let paramIndex = 3;

      if (filters.status) {
        whereConditions.push(`status = $${paramIndex++}`);
        params.push(filters.status);
      }
      if (filters.start_date) {
        whereConditions.push(`start_datetime >= $${paramIndex++}`);
        params.push(filters.start_date);
      }
      if (filters.end_date) {
        whereConditions.push(`end_datetime <= $${paramIndex++}`);
        params.push(filters.end_date);
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
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to get vehicle reservations', { vehicleId, error });
    }
  }

  /**
   * Get pending approval reservations
   */
  async getPendingApprovals(context: QueryContext): Promise<ReservationWithDetails[]> {
    try {
      const pool = this.getPool(context);
      const query = 'SELECT * FROM pending_approval_reservations WHERE tenant_id =  ORDER BY created_at ASC';
      const result = await pool.query(query, [context.tenantId]);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to get pending approvals', { error });
    }
  }
}

export default ReservationsRepository;
