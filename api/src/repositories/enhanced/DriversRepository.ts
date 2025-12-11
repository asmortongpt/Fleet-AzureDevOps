/**
 * Enhanced Drivers Repository
 *
 * Handles all driver-related database operations with:
 * - Driver profiles and credentials
 * - Driver scoring and performance metrics
 * - License and certification tracking
 * - Driver-vehicle assignments
 *
 * Epic #1, Issue #1.2: Fleet Domain Repositories
 */

import { Pool } from 'pg'

import { DatabaseError } from "../../errors/AppError"'
import { GenericRepository } from '../base'

export interface Driver {
  id?: string | number
  tenant_id?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  license_number?: string
  license_state?: string
  license_class?: string
  license_expiry?: Date
  date_of_birth?: Date
  hire_date?: Date
  termination_date?: Date
  status?: string // active, inactive, suspended, terminated
  employee_id?: string
  department?: string
  manager_id?: string | number
  photo_url?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  certifications?: string[]
  endorsements?: string[]
  medical_cert_expiry?: Date
  driver_score?: number
  violation_count?: number
  accident_count?: number
  hours_driven?: number
  notes?: string
  created_at?: Date
  updated_at?: Date
  created_by?: string
  updated_by?: string
  deleted_at?: Date
  deleted_by?: string
}

export interface DriverScore {
  driver_id: string | number
  score: number
  harsh_braking_count: number
  harsh_acceleration_count: number
  harsh_cornering_count: number
  speeding_count: number
  idling_time_minutes: number
  total_trips: number
  total_miles: number
  violation_count: number
  accident_count: number
  last_updated: Date
}

export interface DriverFilters {
  status?: string
  department?: string
  manager_id?: string | number
  license_class?: string
  min_score?: number
  max_score?: number
  has_violations?: boolean
  has_expired_license?: boolean
  has_expired_medical?: boolean
  search?: string
}

/**
 * Drivers Repository
 *
 * Handles all driver data operations including performance tracking.
 */
export class DriversRepository extends GenericRepository<Driver> {
  protected tableName = 'drivers'
  protected idColumn = 'id'

  constructor(pool: Pool) {
    super(pool)
  }

  /**
   * Find driver by email
   */
  async findByEmail(email: string, tenantId: string): Promise<Driver | null> {
    const results = await this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE email = $1 AND tenant_id = $2`,
      [email.toLowerCase(), tenantId]
    )
    return results[0] || null
  }

  /**
   * Find driver by employee ID
   */
  async findByEmployeeId(employeeId: string, tenantId: string): Promise<Driver | null> {
    const results = await this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE employee_id = $1 AND tenant_id = $2`,
      [employeeId, tenantId]
    )
    return results[0] || null
  }

  /**
   * Find driver by license number
   */
  async findByLicenseNumber(licenseNumber: string, tenantId: string): Promise<Driver | null> {
    const results = await this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE license_number = $1 AND tenant_id = $2`,
      [licenseNumber, tenantId]
    )
    return results[0] || null
  }

  /**
   * Find drivers by status
   */
  async findByStatus(status: string, tenantId: string): Promise<Driver[]> {
    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE status = $1 AND tenant_id = $2
       ORDER BY last_name, first_name`,
      [status, tenantId]
    )
  }

  /**
   * Find drivers by department
   */
  async findByDepartment(department: string, tenantId: string): Promise<Driver[]> {
    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE department = $1 AND tenant_id = $2
       ORDER BY last_name, first_name`,
      [department, tenantId]
    )
  }

  /**
   * Find drivers by manager
   */
  async findByManager(managerId: string | number, tenantId: string): Promise<Driver[]> {
    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE manager_id = $1 AND tenant_id = $2
       ORDER BY last_name, first_name`,
      [managerId, tenantId]
    )
  }

  /**
   * Find drivers with expired licenses
   */
  async findWithExpiredLicense(tenantId: string): Promise<Driver[]> {
    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND license_expiry IS NOT NULL
         AND license_expiry < CURRENT_DATE
       ORDER BY license_expiry ASC`,
      [tenantId]
    )
  }

  /**
   * Find drivers with licenses expiring soon
   */
  async findWithExpiringLicense(tenantId: string, daysAhead: number = 30): Promise<Driver[]> {
    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND license_expiry IS NOT NULL
         AND license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '$2 days'
       ORDER BY license_expiry ASC`,
      [tenantId, daysAhead]
    )
  }

  /**
   * Find drivers with expired medical certifications
   */
  async findWithExpiredMedical(tenantId: string): Promise<Driver[]> {
    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND medical_cert_expiry IS NOT NULL
         AND medical_cert_expiry < CURRENT_DATE
       ORDER BY medical_cert_expiry ASC`,
      [tenantId]
    )
  }

  /**
   * Find drivers with violations
   */
  async findWithViolations(tenantId: string, minViolations: number = 1): Promise<Driver[]> {
    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND violation_count >= $2
       ORDER BY violation_count DESC`,
      [tenantId, minViolations]
    )
  }

  /**
   * Find drivers by score range
   */
  async findByScoreRange(
    minScore: number,
    maxScore: number,
    tenantId: string
  ): Promise<Driver[]> {
    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND driver_score >= $2
         AND driver_score <= $3
       ORDER BY driver_score DESC`,
      [tenantId, minScore, maxScore]
    )
  }

  /**
   * Get top performing drivers
   */
  async getTopDrivers(tenantId: string, limit: number = 10): Promise<Driver[]> {
    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND driver_score IS NOT NULL
       ORDER BY driver_score DESC
       LIMIT $2`,
      [tenantId, limit]
    )
  }

  /**
   * Get drivers needing attention (low scores or compliance issues)
   */
  async getDriversNeedingAttention(tenantId: string): Promise<Driver[]> {
    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND (
           driver_score < 70
           OR violation_count > 0
           OR accident_count > 0
           OR license_expiry < CURRENT_DATE + INTERVAL '30 days'
           OR medical_cert_expiry < CURRENT_DATE + INTERVAL '30 days'
         )
       ORDER BY driver_score ASC`,
      [tenantId]
    )
  }

  /**
   * Update driver score
   */
  async updateScore(
    driverId: string | number,
    score: number,
    tenantId: string,
    userId: string
  ): Promise<Driver> {
    return this.update(driverId, { driver_score: score } as Partial<Driver>, tenantId, userId)
  }

  /**
   * Increment violation count
   */
  async incrementViolations(
    driverId: string | number,
    tenantId: string,
    userId: string
  ): Promise<Driver> {
    const results = await this.executeQuery<Driver>(
      `UPDATE ${this.tableName}
       SET violation_count = COALESCE(violation_count, 0) + 1,
           updated_at = NOW(),
           updated_by = $3
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [driverId, tenantId, userId]
    )

    if (results.length === 0) {
      throw new DatabaseError('Driver not found', { driverId, tenantId })
    }

    return results[0]
  }

  /**
   * Increment accident count
   */
  async incrementAccidents(
    driverId: string | number,
    tenantId: string,
    userId: string
  ): Promise<Driver> {
    const results = await this.executeQuery<Driver>(
      `UPDATE ${this.tableName}
       SET accident_count = COALESCE(accident_count, 0) + 1,
           updated_at = NOW(),
           updated_by = $3
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [driverId, tenantId, userId]
    )

    if (results.length === 0) {
      throw new DatabaseError('Driver not found', { driverId, tenantId })
    }

    return results[0]
  }

  /**
   * Get driver statistics summary
   */
  async getDriverStats(tenantId: string) {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
        AVG(driver_score) FILTER (WHERE driver_score IS NOT NULL) as avg_score,
        COUNT(*) FILTER (WHERE license_expiry < CURRENT_DATE) as expired_licenses,
        COUNT(*) FILTER (WHERE medical_cert_expiry < CURRENT_DATE) as expired_medical,
        COUNT(*) FILTER (WHERE violation_count > 0) as with_violations,
        COUNT(*) FILTER (WHERE accident_count > 0) as with_accidents
      FROM ${this.tableName}
      WHERE tenant_id = $1
    `

    interface StatsRow {
      total: string
      active: string
      inactive: string
      suspended: string
      avg_score: string
      expired_licenses: string
      expired_medical: string
      with_violations: string
      with_accidents: string
    }

    const result = await this.executeQuery<StatsRow>(query, [tenantId])
    const row = result[0]

    return {
      total: parseInt(row?.total || '0', 10),
      active: parseInt(row?.active || '0', 10),
      inactive: parseInt(row?.inactive || '0', 10),
      suspended: parseInt(row?.suspended || '0', 10),
      avg_score: parseFloat(row?.avg_score || '0'),
      expired_licenses: parseInt(row?.expired_licenses || '0', 10),
      expired_medical: parseInt(row?.expired_medical || '0', 10),
      with_violations: parseInt(row?.with_violations || '0', 10),
      with_accidents: parseInt(row?.with_accidents || '0', 10)
    }
  }

  /**
   * Search drivers by name, email, or employee ID
   */
  async search(searchTerm: string, tenantId: string): Promise<Driver[]> {
    const search = `%${searchTerm.toLowerCase()}%`

    return this.executeQuery<Driver>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND (
           LOWER(first_name) LIKE $2
           OR LOWER(last_name) LIKE $2
           OR LOWER(email) LIKE $2
           OR LOWER(employee_id) LIKE $2
           OR LOWER(license_number) LIKE $2
         )
       ORDER BY last_name, first_name
       LIMIT 50`,
      [tenantId, search]
    )
  }

  /**
   * Bulk update driver status
   */
  async bulkUpdateStatus(
    driverIds: (string | number)[],
    status: string,
    tenantId: string,
    userId: string
  ): Promise<number> {
    if (driverIds.length === 0) return 0

    const placeholders = driverIds.map((_, i) => `$${i + 3}`).join(', ')

    const result = await this.executeQuery<{ id: string }>(
      `UPDATE ${this.tableName}
       SET status = $1, updated_at = NOW(), updated_by = $2
       WHERE id IN (${placeholders}) AND tenant_id = $3
       RETURNING id`,
      [status, userId, tenantId, ...driverIds]
    )

    return result.length
  }
}
