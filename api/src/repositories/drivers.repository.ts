import { Pool, QueryResult } from 'pg';

import { NotFoundError, ValidationError } from '../lib/errors';

import { BaseRepository } from './base/BaseRepository';

export interface Driver {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  licenseNumber: string
  licenseExpiryDate: Date
  licenseState?: string
  licenseClass?: string
  cdl: boolean
  status: 'active' | 'inactive' | 'suspended' | 'terminated' | 'on_leave' | 'training'
  hireDate?: Date
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export class DriversRepository extends BaseRepository<any> {


  constructor(pool: Pool) {
    super(pool, 'drivers');
  }

  async findById(id: string, tenantId: string): Promise<Driver | null> {
    const result: QueryResult<Driver> = await this.pool.query(
      'SELECT id, first_name AS "firstName", last_name AS "lastName", license_number AS "licenseNumber", license_expiry_date AS "licenseExpiryDate", status, phone, email, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt" FROM drivers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  async findByTenant(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Driver[]> {
    const { page = 1, limit = 20, sortBy = 'last_name', sortOrder = 'asc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'first_name', 'last_name', 'email', 'license_number', 'status', 'created_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'last_name'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result: QueryResult<Driver> = await this.pool.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", license_number AS "licenseNumber", license_expiry_date AS "licenseExpiryDate", status, phone, email, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt" FROM drivers 
       WHERE tenant_id = $1 
       ORDER BY ${safeSortBy} ${safeSortOrder} 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )
    return result.rows
  }

  async findByLicenseNumber(licenseNumber: string, tenantId: string): Promise<Driver | null> {
    const result: QueryResult<Driver> = await this.pool.query(
      'SELECT id, first_name AS "firstName", last_name AS "lastName", license_number AS "licenseNumber", license_expiry_date AS "licenseExpiryDate", status, phone, email, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt" FROM drivers WHERE license_number = $1 AND tenant_id = $2',
      [licenseNumber, tenantId]
    )
    return result.rows[0] || null
  }

  async findByEmail(email: string, tenantId: string): Promise<Driver | null> {
    const result: QueryResult<Driver> = await this.pool.query(
      'SELECT id, first_name AS "firstName", last_name AS "lastName", license_number AS "licenseNumber", license_expiry_date AS "licenseExpiryDate", status, phone, email, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt" FROM drivers WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    )
    return result.rows[0] || null
  }

  async findByStatus(
    status: Driver['status'],
    tenantId: string
  ): Promise<Driver[]> {
    const result: QueryResult<Driver> = await this.pool.query(
      'SELECT id, first_name AS "firstName", last_name AS "lastName", license_number AS "licenseNumber", license_expiry_date AS "licenseExpiryDate", status, phone, email, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt" FROM drivers WHERE status = $1 AND tenant_id = $2 ORDER BY last_name ASC',
      [status, tenantId]
    )
    return result.rows
  }

  async findExpiringLicenses(tenantId: string): Promise<Driver[]> {
    const result: QueryResult<Driver> = await this.pool.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", license_number AS "licenseNumber", license_expiry_date AS "licenseExpiryDate", status, phone, email, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt" FROM drivers 
       WHERE tenant_id = $1 
       AND status = $2
       AND license_expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' 
       ORDER BY license_expiry_date ASC`,
      [tenantId, 'active']
    )
    return result.rows
  }

  async create(tenantId: string, data: Partial<Driver>): Promise<Driver> {
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.licenseNumber || !data.licenseExpiryDate) {
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

    const result: QueryResult<Driver> = await this.pool.query(
      `INSERT INTO drivers (
        first_name, last_name, email, phone, license_number, license_expiry_date, 
        license_class, status, hire_date, tenant_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, first_name AS "firstName", last_name AS "lastName", license_number AS "licenseNumber", license_expiry_date AS "licenseExpiryDate", status, phone, email, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.firstName,
        data.lastName,
        data.email,
        data.phone || null,
        data.licenseNumber,
        data.licenseExpiryDate,
        data.licenseClass || null,
        data.status || 'active',
        data.hireDate || null,
        tenantId
      ]
    )
    return result.rows[0]
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Driver>
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

    const result: QueryResult<Driver> = await this.pool.query(
      `UPDATE drivers 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           license_number = COALESCE($5, license_number),
           license_expiry_date = COALESCE($6, license_expiry_date),
           license_class = COALESCE($7, license_class),
           status = COALESCE($8, status),
           hire_date = COALESCE($9, hire_date),
           updated_at = NOW()
       WHERE id = $10 AND tenant_id = $11
       RETURNING id, first_name AS "firstName", last_name AS "lastName", license_number AS "licenseNumber", license_expiry_date AS "licenseExpiryDate", status, phone, email, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.firstName,
        data.lastName,
        data.email,
        data.phone,
        data.licenseNumber,
        data.licenseExpiryDate,
        data.licenseClass,
        data.status,
        data.hireDate,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const result: QueryResult = await this.pool.query(
      'DELETE FROM drivers WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  async count(filters: Record<string, unknown> = {}, tenantId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) FROM drivers WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  async search(tenantId: string, keyword: string): Promise<Driver[]> {
    const searchTerm = `%${keyword}%`
    const result: QueryResult<Driver> = await this.pool.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", license_number AS "licenseNumber", license_expiry_date AS "licenseExpiryDate", status, phone, email, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt" FROM drivers
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

  async validateOwnership(tenantId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return result.rows.length > 0
  }

  async findWithVehicles(tenantId: string, id: string) {
    const query = `
      SELECT
        d.id, d.first_name, d.last_name, d.email, d.phone, d.license_number, d.license_expiry_date, d.status,
        v.id as vehicle_id, v.make as vehicle_make, v.model as vehicle_model,
        v.year as vehicle_year, v.vin as vehicle_vin, v.license_plate as vehicle_license_plate
      FROM drivers d
      LEFT JOIN vehicles v ON v.assigned_driver_id = d.id
      WHERE d.id = $1 AND d.tenant_id = $2
    `;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows;
  }

  async findAllWithVehicleCount(tenantId: string) {
    const query = `
      SELECT
        d.id, d.first_name, d.last_name, d.email, d.phone, d.status,
        COUNT(v.id) as vehicle_count
      FROM drivers d
      LEFT JOIN vehicles v ON v.assigned_driver_id = d.id
      WHERE d.tenant_id = $1
      GROUP BY d.id, d.first_name, d.last_name, d.email, d.phone, d.status
      ORDER BY d.last_name ASC
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }
}
