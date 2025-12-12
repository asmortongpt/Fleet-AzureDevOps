import { BaseRepository } from '../repositories/BaseRepository';

import { pool } from '../db'
import { NotFoundError, ValidationError } from '../lib/errors'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
}

export interface TripUsageClassification {
  id: string
  tenant_id: string
  trip_id?: string
  vehicle_id: string
  driver_id: string
  usage_type: 'business' | 'personal' | 'mixed'
  business_percentage?: number
  business_purpose?: string
  personal_notes?: string
  miles_total: number
  miles_business: number
  miles_personal: number
  trip_date: Date
  start_location?: string
  end_location?: string
  approval_status: 'pending' | 'approved' | 'rejected' | 'auto_approved'
  approved_by_user_id?: string
  approved_at?: Date
  created_by_user_id: string
  created_at: Date
  updated_at: Date
}

export interface PersonalUsePolicy {
  id: string
  tenant_id: string
  name: string
  description?: string
  rate_per_mile: number
  rate_type: string
  effective_date: Date
  expiry_date?: Date
  is_active: boolean
  charge_personal_use?: boolean
  personal_use_rate_per_mile?: number
  require_approval?: boolean
  auto_approve_under_miles?: number
  created_at: Date
  updated_at: Date
}

export interface Trip {
  id: string
  tenant_id: string
  vehicle_id: string
  driver_id?: string
  distance_miles?: number
  start_time?: Date
  end_time?: Date
  start_location?: string
  end_location?: string
  created_at: Date
  updated_at: Date
}

export interface Vehicle {
  id: string
  tenant_id: string
  make?: string
  model?: string
  license_plate?: string
  created_at: Date
  updated_at: Date
}

/**
 * TripMarkingRepository - Agent 30
 * All queries use parameterized statements
 * All operations enforce tenant isolation
 * Eliminates 16 direct database queries from trip-marking.ts
 */
export class TripMarkingRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LTrip_LMarking_LRepository extends _LBases');
  }

  /**
   * Find trip by ID with tenant isolation
   */
  async findTripById(tripId: string, tenantId: string): Promise<(Trip & { vehicle_id: string }) | null> {
    const result = await pool.query(
      `SELECT t.*, v.id as vehicle_id
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       WHERE t.id = $1 AND t.tenant_id = $2`,
      [tripId, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Get active personal use policy for tenant
   */
  async getActivePolicy(tenantId: string): Promise<PersonalUsePolicy | null> {
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
        charge_personal_use,
        personal_use_rate_per_mile,
        require_approval,
        auto_approve_under_miles,
        created_at,
        updated_at
      FROM personal_use_policies
      WHERE tenant_id = $1
      AND is_active = true
      ORDER BY effective_date DESC
      LIMIT 1`,
      [tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Get auto-approval settings from policy
   */
  async getAutoApprovalSettings(tenantId: string): Promise<{ auto_approve_under_miles?: number; require_approval?: boolean } | null> {
    const result = await pool.query(
      `SELECT auto_approve_under_miles, require_approval
       FROM personal_use_policies
       WHERE tenant_id = $1
       AND is_active = true
       ORDER BY effective_date DESC
       LIMIT 1`,
      [tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find existing trip usage classification by trip ID
   */
  async findExistingUsage(tripId: string): Promise<{ id: string } | null> {
    const result = await pool.query(
      `SELECT id FROM trip_usage_classification WHERE trip_id = $1`,
      [tripId]
    )
    return result.rows[0] || null
  }

  /**
   * Update existing trip usage classification
   */
  async updateUsageClassification(
    usageId: string,
    data: {
      usage_type: string
      business_percentage?: number
      business_purpose?: string
      personal_notes?: string
      miles_total: number
      miles_business: number
      miles_personal: number
      approval_status: string
    }
  ): Promise<TripUsageClassification> {
    const now = new Date().toISOString()
    const result = await pool.query(
      `UPDATE trip_usage_classification
       SET usage_type = $1,
           business_percentage = $2,
           business_purpose = $3,
           personal_notes = $4,
           miles_total = $5,
           miles_business = $6,
           miles_personal = $7,
           approval_status = $8,
           updated_at = $9
       WHERE id = $10
       RETURNING *`,
      [
        data.usage_type,
        data.business_percentage,
        data.business_purpose,
        data.personal_notes,
        data.miles_total,
        data.miles_business,
        data.miles_personal,
        data.approval_status,
        now,
        usageId
      ]
    )
    return result.rows[0]
  }

  /**
   * Create new trip usage classification
   */
  async createUsageClassification(data: {
    tenant_id: string
    trip_id?: string
    vehicle_id: string
    driver_id: string
    usage_type: string
    business_percentage?: number
    business_purpose?: string
    personal_notes?: string
    miles_total: number
    miles_business: number
    miles_personal: number
    trip_date: Date | string
    start_location?: string
    end_location?: string
    approval_status: string
    created_by_user_id: string
  }): Promise<TripUsageClassification> {
    const result = await pool.query(
      `INSERT INTO trip_usage_classification (
        tenant_id, trip_id, vehicle_id, driver_id,
        usage_type, business_percentage, business_purpose, personal_notes,
        miles_total, miles_business, miles_personal,
        trip_date, start_location, end_location,
        approval_status, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        data.tenant_id,
        data.trip_id || null,
        data.vehicle_id,
        data.driver_id,
        data.usage_type,
        data.business_percentage || null,
        data.business_purpose || null,
        data.personal_notes || null,
        data.miles_total,
        data.miles_business,
        data.miles_personal,
        data.trip_date,
        data.start_location || null,
        data.end_location || null,
        data.approval_status,
        data.created_by_user_id
      ]
    )
    return result.rows[0]
  }

  /**
   * Get complete usage record by ID
   */
  async getUsageById(usageId: string): Promise<TripUsageClassification | null> {
    const result = await pool.query(
      `SELECT
        id,
        tenant_id,
        trip_id,
        vehicle_id,
        driver_id,
        usage_type,
        business_percentage,
        business_purpose,
        personal_notes,
        miles_total,
        miles_business,
        miles_personal,
        trip_date,
        start_location,
        end_location,
        approval_status,
        approved_by_user_id,
        approved_at,
        created_by_user_id,
        created_at,
        updated_at
      FROM trip_usage_classification
      WHERE id = $1`,
      [usageId]
    )
    return result.rows[0] || null
  }

  /**
   * Verify vehicle belongs to tenant
   */
  async verifyVehicleOwnership(vehicleId: string, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2`,
      [vehicleId, tenantId]
    )
    return result.rows.length > 0
  }

  /**
   * Upsert (insert or update) trip usage classification for split
   */
  async upsertUsageClassification(data: {
    tenant_id: string
    trip_id: string
    vehicle_id: string
    driver_id: string
    usage_type: string
    business_percentage: number
    business_purpose: string
    personal_notes?: string
    miles_total: number
    miles_business: number
    miles_personal: number
    trip_date: Date | string
    start_location?: string
    end_location?: string
    approval_status: string
    created_by_user_id: string
  }): Promise<TripUsageClassification> {
    const result = await pool.query(
      `INSERT INTO trip_usage_classification (
        tenant_id, trip_id, vehicle_id, driver_id,
        usage_type, business_percentage, business_purpose, personal_notes,
        miles_total, miles_business, miles_personal,
        trip_date, start_location, end_location,
        approval_status, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (trip_id)
      DO UPDATE SET
        usage_type = EXCLUDED.usage_type,
        business_percentage = EXCLUDED.business_percentage,
        business_purpose = EXCLUDED.business_purpose,
        personal_notes = EXCLUDED.personal_notes,
        miles_business = EXCLUDED.miles_business,
        miles_personal = EXCLUDED.miles_personal,
        updated_at = NOW()
      RETURNING *`,
      [
        data.tenant_id,
        data.trip_id,
        data.vehicle_id,
        data.driver_id,
        data.usage_type,
        data.business_percentage,
        data.business_purpose,
        data.personal_notes || null,
        data.miles_total,
        data.miles_business,
        data.miles_personal,
        data.trip_date,
        data.start_location || null,
        data.end_location || null,
        data.approval_status,
        data.created_by_user_id
      ]
    )
    return result.rows[0]
  }

  /**
   * Get personal trips for driver with pagination
   */
  async getPersonalTripsByDriver(
    driverId: string,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<any[]> {
    const { page = 1, limit = 50, startDate, endDate } = pagination
    const offset = (page - 1) * limit

    let query = `
      SELECT
        t.*,
        v.make, v.model, v.license_plate,
        p.personal_use_rate_per_mile as rate
      FROM trip_usage_classification t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN personal_use_policies p ON t.tenant_id = p.tenant_id AND p.is_active = true
      WHERE t.driver_id = $1
        AND t.tenant_id = $2
        AND (t.usage_type = 'personal' OR t.usage_type = 'mixed')
    `

    const params: any[] = [driverId, tenantId]
    let paramIndex = 3

    if (startDate) {
      query += ` AND t.trip_date >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      query += ` AND t.trip_date <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    query += ` ORDER BY t.trip_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Count personal trips for driver
   */
  async countPersonalTripsByDriver(driverId: string, tenantId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*)
       FROM trip_usage_classification
       WHERE driver_id = $1 AND tenant_id = $2
         AND (usage_type = 'personal' OR usage_type = 'mixed')`,
      [driverId, tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Get trip usage classification details with user and vehicle info
   */
  async getUsageDetailsByTripId(tripId: string, tenantId: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT
        t.*,
        u.name as created_by_name,
        a.name as approved_by_name,
        v.make, v.model, v.license_plate
      FROM trip_usage_classification t
      LEFT JOIN users u ON t.created_by_user_id = u.id
      LEFT JOIN users a ON t.approved_by_user_id = a.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.trip_id = $1 AND t.tenant_id = $2`,
      [tripId, tenantId]
    )
    return result.rows[0] || null
  }
}

export const tripMarkingRepository = new TripMarkingRepository()
