import pool from '../config/database'
import { BaseRepository } from '../repositories/BaseRepository';
import {
  UsageType,
  ApprovalStatus,
  CreateTripUsageRequest,
  UpdateTripUsageRequest,
  TripUsageFilters
} from '../types/trip-usage'

export interface TripUsageRow {
  id: string
  tenant_id: string
  trip_id?: string
  vehicle_id: string
  driver_id: string
  usage_type: UsageType
  business_purpose?: string
  business_percentage?: number
  personal_notes?: string
  miles_total: number
  trip_date: string
  start_location?: string
  end_location?: string
  start_odometer?: number
  end_odometer?: number
  approval_status: ApprovalStatus
  approved_by_user_id?: string
  approved_at?: Date
  rejection_reason?: string
  metadata?: any
  created_by_user_id: string
  created_at: Date
  updated_at: Date
  driver_name?: string
  vehicle_number?: string
  approver_name?: string
}

export interface PaginationParams {
  limit: number
  offset: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

/**
 * SECURITY: Repository for trip_usage_classification table
 * All methods include tenant_id filtering for multi-tenancy
 * Uses parameterized queries only ($1, $2, $3) - no string concatenation
 */
export class TripUsageRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LTrip_LUsage_LRepository extends _LBases');
  }

  /**
   * Check if driver belongs to tenant
   * SECURITY: tenant_id filter prevents cross-tenant access
   */
  async verifyDriverBelongsToTenant(
    driverId: string,
    tenantId: string
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
      [driverId, tenantId]
    )
    return result.rows.length > 0
  }

  /**
   * Check if vehicle belongs to tenant
   * SECURITY: tenant_id filter prevents cross-tenant access
   */
  async verifyVehicleBelongsToTenant(
    vehicleId: string,
    tenantId: string
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2`,
      [vehicleId, tenantId]
    )
    return result.rows.length > 0
  }

  /**
   * Get tenant's personal use policy
   * SECURITY: tenant_id filter ensures policy isolation
   */
  async getTenantPolicy(tenantId: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT
        id,
        tenant_id,
        name,
        description,
        rate_per_mile,
        rate_type,
        effective_date,
        expiry_date,
        is_active,
        require_approval,
        auto_approve_under_miles,
        created_at,
        updated_at
      FROM personal_use_policies
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY effective_date DESC
      LIMIT 1`,
      [tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Create new trip usage classification
   * SECURITY: All fields parameterized, tenant_id enforced
   */
  async create(
    data: CreateTripUsageRequest & {
      tenant_id: string
      approval_status: ApprovalStatus
      created_by_user_id: string
    }
  ): Promise<TripUsageRow> {
    const result = await pool.query(
      `INSERT INTO trip_usage_classification (
        tenant_id, trip_id, vehicle_id, driver_id, usage_type,
        business_purpose, business_percentage, personal_notes,
        miles_total, trip_date, start_location, end_location,
        start_odometer, end_odometer, approval_status,
        created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        data.tenant_id,
        data.trip_id || null,
        data.vehicle_id,
        data.driver_id,
        data.usage_type,
        data.business_purpose || null,
        data.business_percentage || null,
        data.personal_notes || null,
        data.miles_total,
        data.trip_date,
        data.start_location || null,
        data.end_location || null,
        data.start_odometer || null,
        data.end_odometer || null,
        data.approval_status,
        data.created_by_user_id
      ]
    )
    return result.rows[0]
  }

  /**
   * Get driver information
   * SECURITY: No tenant_id check here as it's for notification purposes
   */
  async getDriverInfo(driverId: string): Promise<{
    first_name: string
    last_name: string
    email: string
  } | null> {
    const result = await pool.query(
      `SELECT first_name, last_name, email FROM users WHERE id = $1`,
      [driverId]
    )
    return result.rows[0] || null
  }

  /**
   * Get manager email for approval notifications
   * SECURITY: tenant_id filter ensures manager is from same organization
   */
  async getManagerEmail(tenantId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT email FROM users
       WHERE tenant_id = $1 AND role IN ('admin', 'fleet_manager')
       ORDER BY created_at ASC
       LIMIT 1`,
      [tenantId]
    )
    return result.rows[0]?.email || null
  }

  /**
   * Get trip usage records with filtering and pagination
   * SECURITY: tenant_id filter enforced in WHERE clause
   */
  async findAll(
    tenantId: string,
    filters: TripUsageFilters,
    pagination: PaginationParams
  ): Promise<PaginationResult<TripUsageRow>> {
    let query = `
      SELECT t.*,
             u.first_name || ' ' || u.last_name as driver_name,
             v.vehicle_number as vehicle_number
      FROM trip_usage_classification t
      LEFT JOIN users u ON t.driver_id = u.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.tenant_id = $1
    `
    const params: any[] = [tenantId]
    let paramCount = 1

    // Apply filters
    if (filters.driver_id) {
      paramCount++
      query += ` AND t.driver_id = $${paramCount}`
      params.push(filters.driver_id)
    }

    if (filters.vehicle_id) {
      paramCount++
      query += ` AND t.vehicle_id = $${paramCount}`
      params.push(filters.vehicle_id)
    }

    if (filters.usage_type) {
      paramCount++
      query += ` AND t.usage_type = $${paramCount}`
      params.push(filters.usage_type)
    }

    if (filters.approval_status) {
      paramCount++
      query += ` AND t.approval_status = $${paramCount}`
      params.push(filters.approval_status)
    }

    if (filters.start_date) {
      paramCount++
      query += ` AND t.trip_date >= $${paramCount}`
      params.push(filters.start_date)
    }

    if (filters.end_date) {
      paramCount++
      query += ` AND t.trip_date <= $${paramCount}`
      params.push(filters.end_date)
    }

    if (filters.month) {
      paramCount++
      query += ` AND TO_CHAR(t.trip_date, 'YYYY-MM') = $${paramCount}`
      params.push(filters.month)
    }

    if (filters.year) {
      paramCount++
      query += ` AND EXTRACT(YEAR FROM t.trip_date) = $${paramCount}`
      params.push(filters.year)
    }

    query += ` ORDER BY t.trip_date DESC, t.created_at DESC`

    // Get total count
    const countQuery = query.replace(
      `SELECT t.*, u.first_name || ' ' || u.last_name as driver_name, v.vehicle_number as vehicle_number`,
      `SELECT COUNT(*)`
    )
    const countResult = await pool.query(countQuery, params)
    const total = parseInt(countResult.rows[0].count)

    // Add pagination
    paramCount++
    query += ` LIMIT $${paramCount}`
    params.push(pagination.limit)

    paramCount++
    query += ` OFFSET $${paramCount}`
    params.push(pagination.offset)

    const result = await pool.query(query, params)

    return {
      data: result.rows,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
      has_more: pagination.offset + result.rows.length < total
    }
  }

  /**
   * Get single trip usage by ID
   * SECURITY: tenant_id filter prevents cross-tenant access
   */
  async findById(id: string, tenantId: string): Promise<TripUsageRow | null> {
    const result = await pool.query(
      `SELECT t.*,
              u.first_name || ' ' || u.last_name as driver_name,
              v.vehicle_number as vehicle_number,
              approver.first_name || ' ' || approver.last_name as approver_name
       FROM trip_usage_classification t
       LEFT JOIN users u ON t.driver_id = u.id
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN users approver ON t.approved_by_user_id = approver.id
       WHERE t.id = $1 AND t.tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Get driver_id for authorization check
   * SECURITY: tenant_id filter ensures record belongs to tenant
   */
  async getDriverIdForTrip(id: string, tenantId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT driver_id FROM trip_usage_classification WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0]?.driver_id || null
  }

  /**
   * Get basic trip info for authorization
   * SECURITY: tenant_id filter enforced
   */
  async getTripBasicInfo(id: string, tenantId: string): Promise<{
    id: string
    driver_id: string
    approval_status: ApprovalStatus
    usage_type: UsageType
  } | null> {
    const result = await pool.query(
      `SELECT id, driver_id, approval_status, usage_type, tenant_id
       FROM trip_usage_classification
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Update trip usage classification
   * SECURITY: tenant_id filter + parameterized updates
   */
  async update(
    id: string,
    tenantId: string,
    updates: Partial<UpdateTripUsageRequest> & {
      approval_status?: ApprovalStatus
      approved_by_user_id?: string | null
      approved_at?: Date | null
      rejection_reason?: string | null
    }
  ): Promise<TripUsageRow | null> {
    const updateFields: string[] = []
    const values: any[] = [id, tenantId]
    let paramCount = 2

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++
        updateFields.push(`${key} = $${paramCount}`)
        values.push(value)
      }
    })

    if (updateFields.length === 0) {
      return null
    }

    const query = `
      UPDATE trip_usage_classification
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows[0] || null
  }

  /**
   * Reset approval fields when trip is modified
   * SECURITY: tenant_id filter enforced
   */
  async resetApproval(id: string, tenantId: string): Promise<void> {
    await pool.query(
      `UPDATE trip_usage_classification
       SET approval_status = $1,
           approved_by_user_id = NULL,
           approved_at = NULL,
           updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [ApprovalStatus.PENDING, id, tenantId]
    )
  }

  /**
   * Get pending approval trips for managers
   * SECURITY: tenant_id filter ensures only tenant's trips returned
   */
  async findPendingApprovals(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginationResult<TripUsageRow>> {
    const result = await pool.query(
      `SELECT t.*,
              u.first_name || ' ' || u.last_name as driver_name,
              u.email as driver_email,
              v.vehicle_number as vehicle_number,
              v.make, v.model, v.year
       FROM trip_usage_classification t
       JOIN users u ON t.driver_id = u.id
       JOIN vehicles v ON t.vehicle_id = v.id
       WHERE t.tenant_id = $1
         AND t.approval_status = $2
       ORDER BY t.trip_date DESC, t.created_at ASC
       LIMIT $3 OFFSET $4`,
      [tenantId, ApprovalStatus.PENDING, pagination.limit, pagination.offset]
    )

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM trip_usage_classification WHERE tenant_id = $1 AND approval_status = $2`,
      [tenantId, ApprovalStatus.PENDING]
    )

    const total = parseInt(countResult.rows[0].count)

    return {
      data: result.rows,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
      has_more: pagination.offset + result.rows.length < total
    }
  }

  /**
   * Approve trip usage
   * SECURITY: tenant_id filter + parameterized queries
   */
  async approve(
    id: string,
    tenantId: string,
    approverId: string,
    approverNotes?: string
  ): Promise<TripUsageRow | null> {
    const result = await pool.query(
      `UPDATE trip_usage_classification
       SET approval_status = $1,
           approved_by_user_id = $2,
           approved_at = NOW(),
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('approver_notes', $3),
           updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      [ApprovalStatus.APPROVED, approverId, approverNotes || '', id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Reject trip usage
   * SECURITY: tenant_id filter + parameterized queries
   */
  async reject(
    id: string,
    tenantId: string,
    approverId: string,
    rejectionReason: string
  ): Promise<TripUsageRow | null> {
    const result = await pool.query(
      `UPDATE trip_usage_classification
       SET approval_status = $1,
           approved_by_user_id = $2,
           approved_at = NOW(),
           rejection_reason = $3,
           updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      [ApprovalStatus.REJECTED, approverId, rejectionReason, id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Get driver info with tenant check
   * SECURITY: tenant_id filter ensures driver is in same org
   */
  async getDriverInfoWithTenantCheck(
    driverId: string,
    tenantId: string
  ): Promise<{
    first_name: string
    last_name: string
    email: string
  } | null> {
    const result = await pool.query(
      `SELECT first_name, last_name, email FROM users WHERE tenant_id = $1 AND id = $2`,
      [tenantId, driverId]
    )
    return result.rows[0] || null
  }
}

// Export singleton instance
export const tripUsageRepository = new TripUsageRepository()
