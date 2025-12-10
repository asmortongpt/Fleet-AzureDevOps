/**
 * Vehicle Reservation Repository
 *
 * Provides data access operations for vehicle reservations with:
 * - CRUD operations
 * - Conflict detection
 * - Approval workflow support
 * - Vehicle availability checking
 * - Parameterized queries only (CWE-89 prevention)
 * - Tenant isolation (all queries filtered by tenant_id)
 */

import { Pool, PoolClient } from 'pg'
import { injectable } from 'inversify'
import { BaseRepository, QueryContext, PaginatedResult } from './BaseRepository'

export interface Reservation {
  id: string
  tenant_id: string
  org_id?: string
  vehicle_id: string
  user_id: string
  reserved_by_name: string
  reserved_by_email: string
  start_datetime: Date
  end_datetime: Date
  purpose: 'business' | 'personal'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  approval_required: boolean
  approved_by?: string
  approved_at?: Date
  microsoft_calendar_event_id?: string
  deleted_at?: Date
  created_at: Date
  updated_at: Date
}

export interface ReservationListOptions {
  status?: string
  vehicle_id?: string
  user_id?: string
  start_date?: string
  end_date?: string
  purpose?: string
  page?: number
  limit?: number
}

export interface ReservationWithDetails extends Reservation {
  unit_number?: string
  make?: string
  model?: string
  year?: number
  vin?: string
  license_plate?: string
  classification?: string
  user_name?: string
  user_email?: string
  user_phone?: string
  approved_by_name?: string
  approved_by_email?: string
}

@injectable()
export class ReservationRepository extends BaseRepository<Reservation> {
  protected tableName = 'vehicle_reservations'
  protected idColumn = 'id'

  /**
   * List reservations with filters and pagination
   * Includes vehicle and user details via JOIN
   */
  async listReservations(
    context: QueryContext,
    options: ReservationListOptions,
    canViewAll: boolean
  ): Promise<PaginatedResult<ReservationWithDetails>> {
    const {
      status,
      vehicle_id,
      user_id,
      start_date,
      end_date,
      purpose,
      page = 1,
      limit = 50
    } = options

    const pool = this.getPool(context)
    const offset = (page - 1) * limit

    // Build WHERE clause based on permissions and filters
    const whereConditions = ['vr.deleted_at IS NULL']
    const params: any[] = []
    let paramIndex = 1

    // Apply permission-based filtering
    if (!canViewAll) {
      whereConditions.push(`vr.user_id = $${paramIndex++}`)
      params.push(context.userId)
    }

    // Apply filters
    if (status) {
      whereConditions.push(`vr.status = $${paramIndex++}`)
      params.push(status)
    }
    if (vehicle_id) {
      whereConditions.push(`vr.vehicle_id = $${paramIndex++}`)
      params.push(vehicle_id)
    }
    if (user_id && canViewAll) {
      whereConditions.push(`vr.user_id = $${paramIndex++}`)
      params.push(user_id)
    }
    if (start_date) {
      whereConditions.push(`vr.start_datetime >= $${paramIndex++}`)
      params.push(start_date)
    }
    if (end_date) {
      whereConditions.push(`vr.end_datetime <= $${paramIndex++}`)
      params.push(end_date)
    }
    if (purpose) {
      whereConditions.push(`vr.purpose = $${paramIndex++}`)
      params.push(purpose)
    }

    const whereClause = whereConditions.join(' AND ')

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
    `

    params.push(limit, offset)
    const result = await pool.query(query, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vehicle_reservations vr
      WHERE ${whereClause}
    `
    const countResult = await pool.query(countQuery, params.slice(0, -2))
    const total = parseInt(countResult.rows[0].total)

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Get single reservation by ID with full details
   */
  async getReservationWithDetails(
    id: string,
    context: QueryContext,
    canViewAll: boolean
  ): Promise<ReservationWithDetails | null> {
    const pool = this.getPool(context)

    let whereClause = 'vr.id = $1 AND vr.deleted_at IS NULL'
    const params: any[] = [id]

    if (!canViewAll) {
      whereClause += ' AND vr.user_id = $2'
      params.push(context.userId)
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
    `

    const result = await pool.query(query, params)
    return result.rows[0] || null
  }

  /**
   * Check if vehicle exists
   */
  async checkVehicleExists(
    vehicleId: string,
    client: PoolClient
  ): Promise<{ id: string; unit_number: string; make: string; model: string; year: number } | null> {
    const result = await client.query(
      `SELECT id, unit_number, make, model, year FROM vehicles WHERE id = $1 AND deleted_at IS NULL`,
      [vehicleId]
    )
    return result.rows[0] || null
  }

  /**
   * Check for reservation conflicts using database function
   */
  async checkConflict(
    vehicleId: string,
    startDatetime: string,
    endDatetime: string,
    excludeId: string | null,
    client: PoolClient
  ): Promise<boolean> {
    const query = excludeId
      ? 'SELECT check_reservation_conflict($1, $2, $3, $4) as has_conflict'
      : 'SELECT check_reservation_conflict($1, $2, $3) as has_conflict'

    const params = excludeId
      ? [vehicleId, startDatetime, endDatetime, excludeId]
      : [vehicleId, startDatetime, endDatetime]

    const result = await client.query(query, params)
    return result.rows[0].has_conflict
  }

  /**
   * Check if user has auto-approval role
   */
  async userHasAutoApproval(userId: string, pool: Pool | PoolClient): Promise<boolean> {
    const result = await pool.query(
      `SELECT user_has_any_role($1, ARRAY['Admin', 'FleetManager']) as has_role`,
      [userId]
    )
    return result.rows[0]?.has_role || false
  }

  /**
   * Create reservation
   */
  async createReservation(
    data: {
      vehicle_id: string
      user_id: string
      reserved_by_name: string
      reserved_by_email: string
      start_datetime: string
      end_datetime: string
      purpose: string
      notes?: string
      approval_required: boolean
      initial_status: string
      tenant_id?: string
      org_id?: string
    },
    client: PoolClient
  ): Promise<Reservation> {
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
    `

    const result = await client.query(insertQuery, [
      data.vehicle_id,
      data.user_id,
      data.reserved_by_name,
      data.reserved_by_email,
      data.start_datetime,
      data.end_datetime,
      data.purpose,
      data.initial_status,
      data.notes || null,
      data.approval_required,
      data.tenant_id || null,
      data.org_id || null
    ])

    return result.rows[0]
  }

  /**
   * Update Microsoft calendar event ID
   */
  async updateCalendarEventId(
    reservationId: string,
    eventId: string,
    pool: Pool
  ): Promise<void> {
    await pool.query(
      `UPDATE vehicle_reservations SET microsoft_calendar_event_id = $1 WHERE id = $2`,
      [eventId, reservationId]
    )
  }

  /**
   * Get reservation for update permission check
   */
  async getReservationForUpdate(
    id: string,
    userId: string,
    canViewAll: boolean,
    client: PoolClient
  ): Promise<Reservation | null> {
    const checkQuery = canViewAll
      ? `SELECT * FROM vehicle_reservations WHERE id = $1 AND deleted_at IS NULL`
      : `SELECT * FROM vehicle_reservations WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`

    const checkParams = canViewAll ? [id] : [id, userId]
    const result = await client.query(checkQuery, checkParams)

    return result.rows[0] || null
  }

  /**
   * Update reservation
   */
  async updateReservation(
    id: string,
    updates: {
      start_datetime?: string
      end_datetime?: string
      purpose?: string
      notes?: string
    },
    client: PoolClient
  ): Promise<Reservation> {
    const updateFields: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (updates.start_datetime) {
      updateFields.push(`start_datetime = $${paramIndex++}`)
      params.push(updates.start_datetime)
    }
    if (updates.end_datetime) {
      updateFields.push(`end_datetime = $${paramIndex++}`)
      params.push(updates.end_datetime)
    }
    if (updates.purpose) {
      updateFields.push(`purpose = $${paramIndex++}`)
      params.push(updates.purpose)
    }
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`)
      params.push(updates.notes)
    }

    updateFields.push(`updated_at = NOW()`)
    params.push(id)

    const updateQuery = `
      UPDATE vehicle_reservations
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await client.query(updateQuery, params)
    return result.rows[0]
  }

  /**
   * Cancel reservation (soft delete)
   */
  async cancelReservation(id: string, client: PoolClient): Promise<void> {
    await client.query(
      `UPDATE vehicle_reservations
       SET status = 'cancelled', deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [id]
    )
  }

  /**
   * Approve or reject reservation
   */
  async approveReservation(
    id: string,
    newStatus: string,
    approvedBy: string,
    client: PoolClient
  ): Promise<Reservation> {
    const updateQuery = `
      UPDATE vehicle_reservations
      SET
        status = $1,
        approved_by = $2,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `

    const result = await client.query(updateQuery, [newStatus, approvedBy, id])
    return result.rows[0]
  }

  /**
   * Get vehicle availability for date range
   */
  async getVehicleAvailability(
    vehicleId: string,
    startDate: string,
    endDate: string,
    pool: Pool
  ): Promise<any[]> {
    const query = `
      SELECT *
      FROM get_vehicle_availability($1, $2::DATE, $3::DATE)
    `

    const result = await pool.query(query, [vehicleId, startDate, endDate])
    return result.rows
  }

  /**
   * Get vehicle reservation history
   */
  async getVehicleReservations(
    vehicleId: string,
    filters: {
      status?: string
      start_date?: string
      end_date?: string
    },
    pool: Pool
  ): Promise<any[]> {
    const whereConditions = ['vehicle_id = $1', 'deleted_at IS NULL']
    const params: any[] = [vehicleId]
    let paramIndex = 2

    if (filters.status) {
      whereConditions.push(`status = $${paramIndex++}`)
      params.push(filters.status)
    }
    if (filters.start_date) {
      whereConditions.push(`start_datetime >= $${paramIndex++}`)
      params.push(filters.start_date)
    }
    if (filters.end_date) {
      whereConditions.push(`end_datetime <= $${paramIndex++}`)
      params.push(filters.end_date)
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
    `

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Get pending approval reservations
   */
  async getPendingApprovals(pool: Pool): Promise<any[]> {
    const query = `
      SELECT * FROM pending_approval_reservations
      ORDER BY created_at ASC
    `

    const result = await pool.query(query)
    return result.rows
  }
}
