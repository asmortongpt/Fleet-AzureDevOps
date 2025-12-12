import { BaseRepository } from '../services/dal/BaseRepository'
import { connectionManager } from '../config/connection-manager'
import { buildInsertClause, buildUpdateClause, validateColumnNames } from '../../utils/sql-safety'

export interface TripUsageClassification {
  id: string
  tenant_id: string
  trip_id?: string
  vehicle_id?: string
  driver_id?: string
  usage_type: string
  business_percentage?: number
  business_purpose?: string
  personal_notes?: string
  miles_total: number
  miles_business: number
  miles_personal: number
  trip_date: Date
  start_location?: string
  end_location?: string
  approval_status: string
  approved_by_user_id?: string
  approved_at?: Date
  created_by_user_id: string
  created_at?: Date
  updated_at?: Date
}

export class TripUsageRepository extends BaseRepository<TripUsageClassification> {
  constructor() {
    super('trip_usage_classification', connectionManager.getWritePool())
  }

  /**
   * Find usage classification by trip ID
   */
  async findByTripId(tripId: string): Promise<TripUsageClassification | null> {
    const query = `
      SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
      WHERE trip_id = $1
    `
    const result = await this.query<TripUsageClassification>(query, [tripId])
    return result.rows[0] || null
  }

  /**
   * Find usage classification by trip ID and tenant
   */
  async findByTripIdAndTenant(tripId: string, tenantId: string): Promise<TripUsageClassification | null> {
    const query = `
      SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
      WHERE trip_id = $1 AND tenant_id = $2
    `
    const result = await this.query<TripUsageClassification>(query, [tripId, tenantId])
    return result.rows[0] || null
  }

  /**
   * Create new trip usage classification
   */
  async createUsageClassification(data: Partial<TripUsageClassification>): Promise<TripUsageClassification> {
    return this.create(data)
  }

  /**
   * Update existing trip usage classification
   */
  async updateUsageClassification(
    id: string,
    data: Partial<TripUsageClassification>
  ): Promise<TripUsageClassification> {
    const { fields: setClause, values } = buildUpdateClause(data, 2, 'trip_usage')

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `

    const result = await this.query<TripUsageClassification>(
      query,
      [id, ...values]
    )
    return result.rows[0]
  }

  /**
   * Upsert trip usage classification (insert or update)
   */
  async upsertUsageClassification(
    data: Partial<TripUsageClassification>
  ): Promise<TripUsageClassification> {
    const keys = Object.keys(data)
    validateColumnNames(keys) // Validate column names for SQL safety

    const values = Object.values(data)
    const columns = keys.join(', ')
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')

    // Build UPDATE SET clause excluding trip_id (the conflict target)
    const updateSet = keys
      .filter(key => key !== 'trip_id')
      .map(key => `${key} = EXCLUDED.${key}`)
      .join(', ')

    const query = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      ON CONFLICT (trip_id)
      DO UPDATE SET
        ${updateSet},
        updated_at = NOW()
      RETURNING *
    `

    const result = await this.query<TripUsageClassification>(query, values)
    return result.rows[0]
  }

  /**
   * Find usage classification with user details
   */
  async findWithUserDetails(tripId: string, tenantId: string): Promise<any | null> {
    const query = `
      SELECT
        t.*,
        u.name as created_by_name,
        a.name as approved_by_name,
        v.make, v.model, v.license_plate
      FROM ${this.tableName} t
      LEFT JOIN users u ON t.created_by_user_id = u.id
      LEFT JOIN users a ON t.approved_by_user_id = a.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.trip_id = $1 AND t.tenant_id = $2
    `
    const result = await this.query<any>(query, [tripId, tenantId])
    return result.rows[0] || null
  }

  /**
   * Get driver's personal trip history with pagination
   */
  async getDriverPersonalTrips(
    driverId: string,
    tenantId: string,
    filters: {
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ trips: any[], total: number }> {
    const { startDate, endDate, limit = 50, offset = 0 } = filters

    let query = `
      SELECT
        t.*,
        v.make, v.model, v.license_plate,
        p.personal_use_rate_per_mile as rate
      FROM ${this.tableName} t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN personal_use_policies p ON t.tenant_id = p.tenant_id
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

    const result = await this.query<any>(query, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*)
      FROM ${this.tableName}
      WHERE driver_id = $1 AND tenant_id = $2
        AND (usage_type = 'personal' OR usage_type = 'mixed')
    `
    const countResult = await this.query<{ count: string }>(countQuery, [driverId, tenantId])
    const total = parseInt(countResult.rows[0].count, 10)

    return {
      trips: result.rows,
      total
    }
  }
}
