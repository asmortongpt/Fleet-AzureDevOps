import { injectable } from 'inversify'
import { pool } from '../db'
import { BaseRepository } from './base.repository'

export interface FuelTransaction {
  id: number
  tenant_id: number
  vehicle_id: number
  driver_id: number | null
  transaction_date: Date
  gallons: number
  cost_per_gallon: number
  total_cost: number
  odometer_reading: number | null
  fuel_type: string
  payment_method: string
  vendor_name: string | null
  location: string | null
  receipt_url: string | null
  created_at: Date
  updated_at: Date
}

@injectable()
export class FuelRepository extends BaseRepository<FuelTransaction> {
  constructor() {
    super('fuel_transactions')
  }

  /**
   * Find fuel transactions by vehicle ID with pagination
   * SECURITY: Parameterized query with tenant isolation
   */
  async findByVehicle(
    vehicleId: number,
    tenantId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: FuelTransaction[], total: number }> {
    const offset = (page - 1) * pageSize

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE vehicle_id = $1 AND tenant_id = $2`,
      [vehicleId, tenantId]
    )
    const total = parseInt(countResult.rows[0].count, 10)

    // Get paginated data
    const result = await pool.query(
      `SELECT * FROM ${this.tableName}
       WHERE vehicle_id = $1 AND tenant_id = $2
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT $3 OFFSET $4`,
      [vehicleId, tenantId, pageSize, offset]
    )

    return { data: result.rows, total }
  }

  /**
   * Find fuel transactions by driver ID with pagination
   * SECURITY: Parameterized query with tenant isolation
   */
  async findByDriver(
    driverId: number,
    tenantId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: FuelTransaction[], total: number }> {
    const offset = (page - 1) * pageSize

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE driver_id = $1 AND tenant_id = $2`,
      [driverId, tenantId]
    )
    const total = parseInt(countResult.rows[0].count, 10)

    // Get paginated data
    const result = await pool.query(
      `SELECT * FROM ${this.tableName}
       WHERE driver_id = $1 AND tenant_id = $2
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT $3 OFFSET $4`,
      [driverId, tenantId, pageSize, offset]
    )

    return { data: result.rows, total }
  }

  /**
   * Find fuel transactions by payment method with pagination
   * SECURITY: Parameterized query with tenant isolation
   */
  async findByPaymentMethod(
    paymentMethod: string,
    tenantId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: FuelTransaction[], total: number }> {
    const offset = (page - 1) * pageSize

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE payment_method = $1 AND tenant_id = $2`,
      [paymentMethod, tenantId]
    )
    const total = parseInt(countResult.rows[0].count, 10)

    // Get paginated data
    const result = await pool.query(
      `SELECT * FROM ${this.tableName}
       WHERE payment_method = $1 AND tenant_id = $2
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT $3 OFFSET $4`,
      [paymentMethod, tenantId, pageSize, offset]
    )

    return { data: result.rows, total }
  }

  /**
   * Find fuel transactions by date range with pagination
   * SECURITY: Parameterized query with tenant isolation
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: FuelTransaction[], total: number }> {
    const offset = (page - 1) * pageSize

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${this.tableName}
       WHERE transaction_date >= $1 AND transaction_date <= $2 AND tenant_id = $3`,
      [startDate, endDate, tenantId]
    )
    const total = parseInt(countResult.rows[0].count, 10)

    // Get paginated data
    const result = await pool.query(
      `SELECT * FROM ${this.tableName}
       WHERE transaction_date >= $1 AND transaction_date <= $2 AND tenant_id = $3
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT $4 OFFSET $5`,
      [startDate, endDate, tenantId, pageSize, offset]
    )

    return { data: result.rows, total }
  }

  /**
   * Search fuel transactions by vendor name or location with pagination
   * SECURITY: Parameterized query with tenant isolation and ILIKE for case-insensitive search
   */
  async search(
    searchTerm: string,
    tenantId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: FuelTransaction[], total: number }> {
    const offset = (page - 1) * pageSize
    const searchPattern = `%${searchTerm}%`

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${this.tableName}
       WHERE (vendor_name ILIKE $1 OR location ILIKE $1) AND tenant_id = $2`,
      [searchPattern, tenantId]
    )
    const total = parseInt(countResult.rows[0].count, 10)

    // Get paginated data
    const result = await pool.query(
      `SELECT * FROM ${this.tableName}
       WHERE (vendor_name ILIKE $1 OR location ILIKE $1) AND tenant_id = $2
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT $3 OFFSET $4`,
      [searchPattern, tenantId, pageSize, offset]
    )

    return { data: result.rows, total }
  }

  /**
   * Get all fuel transactions with pagination
   * SECURITY: Parameterized query with tenant isolation
   */
  async findAllPaginated(
    tenantId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: FuelTransaction[], total: number }> {
    const offset = (page - 1) * pageSize

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE tenant_id = $1`,
      [tenantId]
    )
    const total = parseInt(countResult.rows[0].count, 10)

    // Get paginated data
    const result = await pool.query(
      `SELECT * FROM ${this.tableName}
       WHERE tenant_id = $1
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, pageSize, offset]
    )

    return { data: result.rows, total }
  }
}
