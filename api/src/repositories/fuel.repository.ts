import { BaseRepository } from '../repositories/BaseRepository';

import { pool } from '../db'
import { NotFoundError, ValidationError } from '../lib/errors'
import { PoolClient } from 'pg'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FuelTransaction {
  id: number
  vehicleId: number
  driverId?: number
  transactionDate: Date
  gallons: number
  costPerGallon: number
  totalCost: number
  odometerReading?: number
  fuelType?: string
  vendor?: string
  location?: string
  receiptNumber?: string
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * FuelRepository - BACKEND-20
 * All queries use parameterized statements
 * Includes transaction support for batch operations
 * Enforces tenant isolation
 */
export class FuelRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LFuel_LRepository extends _LBases');
  }

  /**
   * Find fuel transaction by ID
   */
  async findById(id: number, tenantId: string): Promise<FuelTransaction | null> {
    const result = await pool.query(
      'SELECT id, vehicle_id, driver_id, transaction_date, gallons, cost_per_gallon, total_cost, odometer_reading, fuel_type, vendor, location, receipt_number, tenant_id, created_at, updated_at FROM fuel_transactions WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find all fuel transactions for a tenant
   */
  async findByTenant(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<FuelTransaction[]> {
    const { page = 1, limit = 20, sortBy = 'transaction_date', sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'transaction_date', 'total_cost', 'gallons', 'created_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'transaction_date'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await pool.query(
      `SELECT id, vehicle_id, driver_id, transaction_date, gallons, cost_per_gallon, total_cost, odometer_reading, fuel_type, vendor, location, receipt_number, tenant_id, created_at, updated_at FROM fuel_transactions 
       WHERE tenant_id = $1 
       ORDER BY ${safeSortBy} ${safeSortOrder} 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find fuel transactions by vehicle
   */
  async findByVehicle(
    vehicleId: number,
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FuelTransaction[]> {
    if (startDate && endDate) {
      const result = await pool.query(
        `SELECT id, vehicle_id, driver_id, transaction_date, gallons, cost_per_gallon, total_cost, odometer_reading, fuel_type, vendor, location, receipt_number, tenant_id, created_at, updated_at FROM fuel_transactions 
         WHERE vehicle_id = $1 AND tenant_id = $2 
         AND transaction_date BETWEEN $3 AND $4 
         ORDER BY transaction_date DESC`,
        [vehicleId, tenantId, startDate, endDate]
      )
      return result.rows
    }

    const result = await pool.query(
      `SELECT id, vehicle_id, driver_id, transaction_date, gallons, cost_per_gallon, total_cost, odometer_reading, fuel_type, vendor, location, receipt_number, tenant_id, created_at, updated_at FROM fuel_transactions 
       WHERE vehicle_id = $1 AND tenant_id = $2 
       ORDER BY transaction_date DESC`,
      [vehicleId, tenantId]
    )
    return result.rows
  }

  /**
   * Find fuel transactions by driver
   */
  async findByDriver(
    driverId: number,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<FuelTransaction[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT id, vehicle_id, driver_id, transaction_date, gallons, cost_per_gallon, total_cost, odometer_reading, fuel_type, vendor, location, receipt_number, tenant_id, created_at, updated_at FROM fuel_transactions 
       WHERE driver_id = $1 AND tenant_id = $2 
       ORDER BY transaction_date DESC 
       LIMIT $3 OFFSET $4`,
      [driverId, tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Create fuel transaction
   */
  async create(data: Partial<FuelTransaction>, tenantId: string): Promise<FuelTransaction> {
    if (!data.vehicleId || !data.transactionDate || !data.gallons || !data.costPerGallon) {
      throw new ValidationError('Vehicle ID, transaction date, gallons, and cost per gallon are required')
    }

    // Calculate total cost
    const totalCost = data.gallons * data.costPerGallon

    const result = await pool.query(
      `INSERT INTO fuel_transactions (
        vehicle_id, driver_id, transaction_date, gallons, cost_per_gallon, 
        total_cost, odometer_reading, fuel_type, vendor, location, receipt_number, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        data.vehicleId,
        data.driverId || null,
        data.transactionDate,
        data.gallons,
        data.costPerGallon,
        totalCost,
        data.odometerReading || null,
        data.fuelType || null,
        data.vendor || null,
        data.location || null,
        data.receiptNumber || null,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Create multiple fuel transactions in a transaction
   */
  async createBatch(
    transactions: Partial<FuelTransaction>[],
    tenantId: string
  ): Promise<FuelTransaction[]> {
    const client: PoolClient = await pool.connect()
    try {
      await client.query('BEGIN')

      const results: FuelTransaction[] = []
      for (const data of transactions) {
        if (!data.vehicleId || !data.transactionDate || !data.gallons || !data.costPerGallon) {
          throw new ValidationError('Each transaction must have vehicle ID, date, gallons, and cost per gallon')
        }

        const totalCost = data.gallons * data.costPerGallon

        const result = await client.query(
          `INSERT INTO fuel_transactions (
            vehicle_id, driver_id, transaction_date, gallons, cost_per_gallon, 
            total_cost, odometer_reading, fuel_type, vendor, location, receipt_number, tenant_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *`,
          [
            data.vehicleId,
            data.driverId || null,
            data.transactionDate,
            data.gallons,
            data.costPerGallon,
            totalCost,
            data.odometerReading || null,
            data.fuelType || null,
            data.vendor || null,
            data.location || null,
            data.receiptNumber || null,
            tenantId
          ]
        )
        results.push(result.rows[0])
      }

      await client.query('COMMIT')
      return results
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update fuel transaction
   */
  async update(
    id: number,
    data: Partial<FuelTransaction>,
    tenantId: string
  ): Promise<FuelTransaction> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('FuelTransaction')
    }

    // Recalculate total cost if gallons or cost per gallon changed
    let totalCost = existing.totalCost
    if (data.gallons && data.costPerGallon) {
      totalCost = data.gallons * data.costPerGallon
    } else if (data.gallons) {
      totalCost = data.gallons * existing.costPerGallon
    } else if (data.costPerGallon) {
      totalCost = existing.gallons * data.costPerGallon
    }

    const result = await pool.query(
      `UPDATE fuel_transactions 
       SET transaction_date = COALESCE($1, transaction_date),
           gallons = COALESCE($2, gallons),
           cost_per_gallon = COALESCE($3, cost_per_gallon),
           total_cost = $4,
           odometer_reading = COALESCE($5, odometer_reading),
           fuel_type = COALESCE($6, fuel_type),
           vendor = COALESCE($7, vendor),
           location = COALESCE($8, location),
           receipt_number = COALESCE($9, receipt_number),
           updated_at = NOW()
       WHERE id = $10 AND tenant_id = $11
       RETURNING *`,
      [
        data.transactionDate,
        data.gallons,
        data.costPerGallon,
        totalCost,
        data.odometerReading,
        data.fuelType,
        data.vendor,
        data.location,
        data.receiptNumber,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Delete fuel transaction
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM fuel_transactions WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Get total fuel cost for a vehicle in a date range
   */
  async getTotalCost(
    vehicleId: number,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(SUM(total_cost), 0) as total 
       FROM fuel_transactions 
       WHERE vehicle_id = $1 AND tenant_id = $2 
       AND transaction_date BETWEEN $3 AND $4`,
      [vehicleId, tenantId, startDate, endDate]
    )
    return parseFloat(result.rows[0].total) || 0
  }

  /**
   * Get fuel efficiency (MPG) for a vehicle
   */
  async getFuelEfficiency(
    vehicleId: number,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await pool.query(
      `SELECT 
         MAX(odometer_reading) - MIN(odometer_reading) as miles_driven,
         SUM(gallons) as total_gallons
       FROM fuel_transactions 
       WHERE vehicle_id = $1 AND tenant_id = $2 
       AND transaction_date BETWEEN $3 AND $4
       AND odometer_reading IS NOT NULL`,
      [vehicleId, tenantId, startDate, endDate]
    )

    const { miles_driven, total_gallons } = result.rows[0]
    if (!miles_driven || !total_gallons || total_gallons === 0) {
      return 0
    }

    return miles_driven / total_gallons
  }

  /**
   * Count fuel transactions
   */
  async count(tenantId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM fuel_transactions WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }
}

export const fuelRepository = new FuelRepository()
