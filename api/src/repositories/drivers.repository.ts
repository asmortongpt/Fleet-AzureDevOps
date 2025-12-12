import { BaseRepository } from '../repositories/BaseRepository';

import { pool } from '../db'
import { NotFoundError, ValidationError } from '../lib/errors'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface Driver {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  licenseNumber: string
  licenseExpiry: Date
  licenseClass?: string
  status: 'active' | 'inactive' | 'suspended'
  hireDate?: Date
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * DriversRepository - BACKEND-19
 * All queries use parameterized statements
 * All operations enforce tenant isolation
 * Includes validation for required fields
 */
export class DriversRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LDrivers_LRepository extends _LBases');
  }

  /**
   * Find driver by ID with tenant isolation
   */
  async findById(id: number, tenantId: string): Promise<Driver | null> {
    const result = await pool.query(
      'SELECT id, vehicle_id, name, license_number, license_expiry, status, phone, email, tenant_id, created_at, updated_at FROM drivers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find all drivers for a tenant with pagination
   */
  async findByTenant(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Driver[]> {
    const { page = 1, limit = 20, sortBy = 'last_name', sortOrder = 'asc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'first_name', 'last_name', 'email', 'license_number', 'status', 'created_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'last_name'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await pool.query(
      `SELECT id, vehicle_id, name, license_number, license_expiry, status, phone, email, tenant_id, created_at, updated_at FROM drivers 
       WHERE tenant_id = $1 
       ORDER BY ${safeSortBy} ${safeSortOrder} 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find driver by license number
   */
  async findByLicenseNumber(licenseNumber: string, tenantId: string): Promise<Driver | null> {
    const result = await pool.query(
      'SELECT id, vehicle_id, name, license_number, license_expiry, status, phone, email, tenant_id, created_at, updated_at FROM drivers WHERE license_number = $1 AND tenant_id = $2',
      [licenseNumber, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find driver by email
   */
  async findByEmail(email: string, tenantId: string): Promise<Driver | null> {
    const result = await pool.query(
      'SELECT id, vehicle_id, name, license_number, license_expiry, status, phone, email, tenant_id, created_at, updated_at FROM drivers WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find drivers by status
   */
  async findByStatus(
    status: 'active' | 'inactive' | 'suspended',
    tenantId: string
  ): Promise<Driver[]> {
    const result = await pool.query(
      'SELECT id, vehicle_id, name, license_number, license_expiry, status, phone, email, tenant_id, created_at, updated_at FROM drivers WHERE status = $1 AND tenant_id = $2 ORDER BY last_name ASC',
      [status, tenantId]
    )
    return result.rows
  }

  /**
   * Find drivers with expiring licenses (within 30 days)
   */
  async findExpiringLicenses(tenantId: string): Promise<Driver[]> {
    const result = await pool.query(
      `SELECT id, vehicle_id, name, license_number, license_expiry, status, phone, email, tenant_id, created_at, updated_at FROM drivers 
       WHERE tenant_id = $1 
       AND status = $2
       AND license_expiry BETWEEN NOW() AND NOW() + INTERVAL '30 days' 
       ORDER BY license_expiry ASC`,
      [tenantId, 'active']
    )
    return result.rows
  }

  /**
   * Create new driver with validation
   */
  async create(data: Partial<Driver>, tenantId: string): Promise<Driver> {
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.licenseNumber || !data.licenseExpiry) {
      throw new ValidationError('First name, last name, email, license number, and license expiry are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('Invalid email format')
    }

    // Check for duplicate license number
    const existingLicense = await this.findByLicenseNumber(data.licenseNumber, tenantId)
    if (existingLicense) {
      throw new ValidationError(`Driver with license number ${data.licenseNumber} already exists`)
    }

    // Check for duplicate email
    const existingEmail = await this.findByEmail(data.email, tenantId)
    if (existingEmail) {
      throw new ValidationError(`Driver with email ${data.email} already exists`)
    }

    const result = await pool.query(
      `INSERT INTO drivers (
        first_name, last_name, email, phone, license_number, license_expiry, 
        license_class, status, hire_date, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.firstName,
        data.lastName,
        data.email,
        data.phone || null,
        data.licenseNumber,
        data.licenseExpiry,
        data.licenseClass || null,
        data.status || 'active',
        data.hireDate || null,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Update driver
   */
  async update(
    id: number,
    data: Partial<Driver>,
    tenantId: string
  ): Promise<Driver> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('Driver')
    }

    // Validate email format if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        throw new ValidationError('Invalid email format')
      }
    }

    const result = await pool.query(
      `UPDATE drivers 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           license_number = COALESCE($5, license_number),
           license_expiry = COALESCE($6, license_expiry),
           license_class = COALESCE($7, license_class),
           status = COALESCE($8, status),
           hire_date = COALESCE($9, hire_date),
           updated_at = NOW()
       WHERE id = $10 AND tenant_id = $11
       RETURNING *`,
      [
        data.firstName,
        data.lastName,
        data.email,
        data.phone,
        data.licenseNumber,
        data.licenseExpiry,
        data.licenseClass,
        data.status,
        data.hireDate,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Delete driver
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM drivers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Count drivers for a tenant
   */
  async count(tenantId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM drivers WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Search drivers by keyword
   */
  async search(keyword: string, tenantId: string): Promise<Driver[]> {
    const searchTerm = `%${keyword}%`
    const result = await pool.query(
      `SELECT id, vehicle_id, name, license_number, license_expiry, status, phone, email, tenant_id, created_at, updated_at FROM drivers
       WHERE tenant_id = $1
       AND (
         first_name ILIKE $2 OR
         last_name ILIKE $2 OR
         email ILIKE $2 OR
         license_number ILIKE $2
       )
       ORDER BY last_name ASC`,
      [tenantId, searchTerm]
    )
    return result.rows
  }

  /**
   * Validate that a driver exists and belongs to the tenant
   * @param id Driver ID
   * @param tenantId Tenant ID for isolation
   * @returns true if driver exists and belongs to tenant
   */
  async validateOwnership(id: number, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return result.rows.length > 0
  }
}

export const driversRepository = new DriversRepository()

/**
 * N+1 PREVENTION: Fetch driver with all assigned vehicles
 */
async findWithVehicles(id: string, tenantId: string) {
  const query = `
    SELECT
      d.id, d.name, d.email, d.phone, d.license_number, d.license_expiry, d.status,
      v.id as vehicle_id, v.make as vehicle_make, v.model as vehicle_model,
      v.year as vehicle_year, v.vin as vehicle_vin, v.license_plate as vehicle_license_plate
    FROM drivers d
    LEFT JOIN vehicles v ON v.driver_id = d.id AND v.deleted_at IS NULL
    WHERE d.id = $1 AND d.tenant_id = $2 AND d.deleted_at IS NULL
  `;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows;
}

/**
 * N+1 PREVENTION: Fetch all drivers with vehicle counts
 */
async findAllWithVehicleCount(tenantId: string) {
  const query = `
    SELECT
      d.id, d.name, d.email, d.phone, d.status,
      COUNT(v.id) as vehicle_count
    FROM drivers d
    LEFT JOIN vehicles v ON v.driver_id = d.id AND v.deleted_at IS NULL
    WHERE d.tenant_id = $1 AND d.deleted_at IS NULL
    GROUP BY d.id, d.name, d.email, d.phone, d.status
    ORDER BY d.name ASC
  `;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
