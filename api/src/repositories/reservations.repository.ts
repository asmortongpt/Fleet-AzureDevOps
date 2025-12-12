import { BaseRepository } from '../repositories/BaseRepository';

/**
 * Reservations Repository
 * 
 * Handles all database operations for vehicle reservations with:
 * - Tenant isolation (all queries filter by tenant_id)
 * - Parameterized queries only (SQL injection prevention)
 * - Transaction support
 * - Conflict detection
 * - Permission-based queries
 * 
 * Security: CWE-89 (SQL Injection Prevention)
 */

import { Pool, PoolClient } from 'pg';

export interface VehicleReservation {
  id: string;
  vehicle_id: string;
  user_id: string;
  reserved_by_name: string;
  reserved_by_email: string;
  start_datetime: string;
  end_datetime: string;
  purpose: 'business' | 'personal';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: Date;
  microsoft_calendar_event_id?: string;
  tenant_id: number;
  org_id?: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ReservationWithDetails extends VehicleReservation {
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
  page?: number;
  limit?: number;
}

export interface ReservationCreateData {
  vehicle_id: string;
  user_id: string;
  reserved_by_name: string;
  reserved_by_email: string;
  start_datetime: string;
  end_datetime: string;
  purpose: 'business' | 'personal';
  status: 'pending' | 'confirmed';
  notes?: string;
  approval_required: boolean;
  tenant_id: number;
  org_id?: number;
}

export interface ReservationUpdateData {
  start_datetime?: string;
  end_datetime?: string;
  purpose?: 'business' | 'personal';
  notes?: string;
}

export class ReservationsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Get a database client (for transactions)
   */
  private async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Check if user has any of the specified roles
   */
  async userHasAnyRole(userId: string, roles: string[]): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT user_has_any_role($1, $2) as has_role',
      [userId, roles]
    );
    return result.rows[0]?.has_role || false;
  }

  /**
   * Find all reservations with filters and pagination
   */
  async findAll(
    tenantId: number,
    filters: ReservationFilters,
    canViewAll: boolean,
    currentUserId?: string
  ): Promise<{ reservations: ReservationWithDetails[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      status,
      vehicle_id,
      user_id,
      start_date,
      end_date,
      purpose,
    } = filters;

    const offset = (page - 1) * limit;

    const whereConditions = ['vr.deleted_at IS NULL', 'vr.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (!canViewAll && currentUserId) {
      whereConditions.push('vr.user_id = $' + paramIndex++);
      params.push(currentUserId);
    }

    if (status) {
      whereConditions.push('vr.status = $' + paramIndex++);
      params.push(status);
    }
    if (vehicle_id) {
      whereConditions.push('vr.vehicle_id = $' + paramIndex++);
      params.push(vehicle_id);
    }
    if (user_id && canViewAll) {
      whereConditions.push('vr.user_id = $' + paramIndex++);
      params.push(user_id);
    }
    if (start_date) {
      whereConditions.push('vr.start_datetime >= $' + paramIndex++);
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push('vr.end_datetime <= $' + paramIndex++);
      params.push(end_date);
    }
    if (purpose) {
      whereConditions.push('vr.purpose = $' + paramIndex++);
      params.push(purpose);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = 'SELECT vr.*, v.unit_number, v.make, v.model, v.year, v.vin, v.license_plate, u.name as user_name, u.email as user_email, approver.name as approved_by_name, approver.email as approved_by_email FROM vehicle_reservations vr JOIN vehicles v ON vr.vehicle_id = v.id JOIN users u ON vr.user_id = u.id LEFT JOIN users approver ON vr.approved_by = approver.id WHERE ' + whereClause + ' ORDER BY vr.start_datetime DESC LIMIT $' + paramIndex++ + ' OFFSET $' + paramIndex;

    params.push(limit, offset);

    const result = await this.pool.query(query, params);

    const countQuery = 'SELECT COUNT(*) as total FROM vehicle_reservations vr WHERE ' + whereClause;

    const countResult = await this.pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    return {
      reservations: result.rows,
      total,
    };
  }

  /**
   * Find single reservation by ID
   */
  async findById(
    id: string,
    tenantId: number,
    canViewAll: boolean,
    currentUserId?: string
  ): Promise<ReservationWithDetails | null> {
    let whereClause = 'vr.id = $1 AND vr.tenant_id = $2 AND vr.deleted_at IS NULL';
    const params: any[] = [id, tenantId];

    if (!canViewAll && currentUserId) {
      whereClause += ' AND vr.user_id = $3';
      params.push(currentUserId);
    }

    const query = 'SELECT vr.*, v.unit_number, v.make, v.model, v.year, v.vin, v.license_plate, v.classification, u.name as user_name, u.email as user_email, u.phone as user_phone, approver.name as approved_by_name, approver.email as approved_by_email FROM vehicle_reservations vr JOIN vehicles v ON vr.vehicle_id = v.id JOIN users u ON vr.user_id = u.id LEFT JOIN users approver ON vr.approved_by = approver.id WHERE ' + whereClause;

    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Check if vehicle exists
   */
  async getVehicle(vehicleId: string, tenantId: number): Promise<any | null> {
    const result = await this.pool.query(
      'SELECT id, unit_number, make, model, year FROM vehicles WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [vehicleId, tenantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Check for reservation conflicts
   */
  async checkConflict(
    vehicleId: string,
    startDatetime: string,
    endDatetime: string,
    excludeReservationId?: string
  ): Promise<boolean> {
    if (excludeReservationId) {
      const result = await this.pool.query(
        'SELECT check_reservation_conflict($1, $2, $3, $4) as has_conflict',
        [vehicleId, startDatetime, endDatetime, excludeReservationId]
      );
      return result.rows[0].has_conflict;
    } else {
      const result = await this.pool.query(
        'SELECT check_reservation_conflict($1, $2, $3) as has_conflict',
        [vehicleId, startDatetime, endDatetime]
      );
      return result.rows[0].has_conflict;
    }
  }

  /**
   * Create new reservation (within transaction)
   */
  async create(
    data: ReservationCreateData,
    client?: PoolClient
  ): Promise<VehicleReservation> {
    const db = client || this.pool;

    const insertQuery = 'INSERT INTO vehicle_reservations (vehicle_id, user_id, reserved_by_name, reserved_by_email, start_datetime, end_datetime, purpose, status, notes, approval_required, tenant_id, org_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *';

    const result = await db.query(insertQuery, [
      data.vehicle_id,
      data.user_id,
      data.reserved_by_name,
      data.reserved_by_email,
      data.start_datetime,
      data.end_datetime,
      data.purpose,
      data.status,
      data.notes || null,
      data.approval_required,
      data.tenant_id,
      data.org_id || null,
    ]);

    return result.rows[0];
  }

  /**
   * Update Microsoft calendar event ID
   */
  async updateCalendarEventId(
    reservationId: string,
    eventId: string,
    tenantId: number
  ): Promise<void> {
    await this.pool.query(
      'UPDATE vehicle_reservations SET microsoft_calendar_event_id = $1 WHERE id = $2 AND tenant_id = $3',
      [eventId, reservationId, tenantId]
    );
  }

  /**
   * Find reservation for update (with lock)
   */
  async findForUpdate(
    id: string,
    tenantId: number,
    canViewAll: boolean,
    currentUserId?: string,
    client?: PoolClient
  ): Promise<VehicleReservation | null> {
    const db = client || this.pool;

    const checkQuery = canViewAll
      ? 'SELECT id, created_at, updated_at FROM vehicle_reservations WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL'
      : 'SELECT id, created_at, updated_at FROM vehicle_reservations WHERE id = $1 AND tenant_id = $2 AND user_id = $3 AND deleted_at IS NULL';

    const checkParams = canViewAll ? [id, tenantId] : [id, tenantId, currentUserId];
    const result = await db.query(checkQuery, checkParams);

    return result.rows[0] || null;
  }

  /**
   * Update reservation
   */
  async update(
    id: string,
    tenantId: number,
    data: ReservationUpdateData,
    client?: PoolClient
  ): Promise<VehicleReservation> {
    const db = client || this.pool;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.start_datetime !== undefined) {
      updates.push('start_datetime = $' + paramIndex++);
      params.push(data.start_datetime);
    }
    if (data.end_datetime !== undefined) {
      updates.push('end_datetime = $' + paramIndex++);
      params.push(data.end_datetime);
    }
    if (data.purpose !== undefined) {
      updates.push('purpose = $' + paramIndex++);
      params.push(data.purpose);
    }
    if (data.notes !== undefined) {
      updates.push('notes = $' + paramIndex++);
      params.push(data.notes);
    }

    updates.push('updated_at = NOW()');
    params.push(id, tenantId);

    const updateQuery = 'UPDATE vehicle_reservations SET ' + updates.join(', ') + ' WHERE id = $' + paramIndex++ + ' AND tenant_id = $' + paramIndex + ' RETURNING *';

    const result = await db.query(updateQuery, params);
    return result.rows[0];
  }

  /**
   * Cancel reservation (soft delete)
   */
  async cancel(
    id: string,
    tenantId: number,
    client?: PoolClient
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      'UPDATE vehicle_reservations SET status = $1, deleted_at = NOW(), updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
      ['cancelled', id, tenantId]
    );
  }

  /**
   * Approve or reject reservation
   */
  async updateApprovalStatus(
    id: string,
    tenantId: number,
    newStatus: 'confirmed' | 'cancelled',
    approvedById: string,
    client?: PoolClient
  ): Promise<VehicleReservation> {
    const db = client || this.pool;

    const updateQuery = 'UPDATE vehicle_reservations SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3 AND tenant_id = $4 RETURNING *';

    const result = await db.query(updateQuery, [newStatus, approvedById, id, tenantId]);
    return result.rows[0];
  }

  /**
   * Get vehicle availability
   */
  async getVehicleAvailability(
    vehicleId: string,
    startDate: string,
    endDate: string,
    tenantId: number
  ): Promise<any[]> {
    const query = 'SELECT id, created_at, updated_at FROM get_vehicle_availability($1, $2::DATE, $3::DATE) WHERE tenant_id = $4';

    const result = await this.pool.query(query, [vehicleId, startDate, endDate, tenantId]);
    return result.rows;
  }

  /**
   * Get vehicle reservation history
   */
  async getVehicleReservations(
    vehicleId: string,
    tenantId: number,
    filters: {
      status?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<any[]> {
    const { status, start_date, end_date } = filters;

    const whereConditions = [
      'vehicle_id = $1',
      'tenant_id = $2',
      'deleted_at IS NULL',
    ];
    const params: any[] = [vehicleId, tenantId];
    let paramIndex = 3;

    if (status) {
      whereConditions.push('status = $' + paramIndex++);
      params.push(status);
    }
    if (start_date) {
      whereConditions.push('start_datetime >= $' + paramIndex++);
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push('end_datetime <= $' + paramIndex++);
      params.push(end_date);
    }

    const query = 'SELECT vr.*, u.name as user_name, u.email as user_email, approver.name as approved_by_name FROM vehicle_reservations vr JOIN users u ON vr.user_id = u.id LEFT JOIN users approver ON vr.approved_by = approver.id WHERE ' + whereConditions.join(' AND ') + ' ORDER BY vr.start_datetime DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get pending approval reservations
   */
  async getPendingApprovals(tenantId: number): Promise<any[]> {
    const query = 'SELECT id, created_at, updated_at FROM pending_approval_reservations WHERE tenant_id = $1 ORDER BY created_at ASC';

    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<PoolClient> {
    const client = await this.getClient();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(client: PoolClient): Promise<void> {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(client: PoolClient): Promise<void> {
    await client.query('ROLLBACK');
    client.release();
  }
}
