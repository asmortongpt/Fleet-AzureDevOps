import { DriverRepository, Driver } from '../repositories/DriverRepository'
import pool from '../config/database'

/**
 * DriversService
 * Business logic layer for driver operations
 */
export class DriversService {
  private driverRepository: DriverRepository

  constructor() {
    this.driverRepository = new DriverRepository()
  }

  /**
   * Get paginated drivers with scope filtering
   */
  async getDrivers(
    tenantId: string,
    userId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    // Get user scope for row-level filtering
    const userResult = await pool.query(
      'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1',
      [userId]
    )

    const user = userResult.rows[0]

    // Handle scope-based filtering
    if (user.scope_level === 'own' && user.driver_id) {
      // Drivers only see themselves
      const driver = await this.driverRepository.findByIdAndTenant(user.driver_id, tenantId)
      return {
        data: driver ? [driver] : [],
        pagination: {
          page: 1,
          limit: 50,
          total: driver ? 1 : 0,
          pages: driver ? 1 : 0
        }
      }
    } else if (user.scope_level === 'team' && user.team_driver_ids && user.team_driver_ids.length > 0) {
      // Supervisors see drivers in their team
      const limit = options.limit || 50
      const offset = ((options.page || 1) - 1) * limit

      const result = await pool.query(
        `SELECT 
      id,
      tenant_id,
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      role,
      is_active,
      failed_login_attempts,
      account_locked_until,
      last_login_at,
      mfa_enabled,
      mfa_secret,
      created_at,
      updated_at FROM users WHERE tenant_id = $1 AND id = ANY($2::uuid[]) ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
        [tenantId, user.team_driver_ids, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND id = ANY($2::uuid[])`,
        [tenantId, user.team_driver_ids]
      )

      return {
        data: result.rows,
        pagination: {
          page: options.page || 1,
          limit,
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    }

    // Fleet/global scope sees all - use repository
    return this.driverRepository.getPaginatedDrivers(tenantId, options)
  }

  /**
   * Get driver by ID with scope validation
   */
  async getDriverById(driverId: string, tenantId: string, userId: string): Promise<Driver | null> {
    const driver = await this.driverRepository.findByIdAndTenant(driverId, tenantId)

    if (!driver) {
      return null
    }

    // Check IDOR protection
    const userResult = await pool.query(
      'SELECT team_driver_ids, driver_id, scope_level FROM users WHERE id = $1',
      [userId]
    )
    const user = userResult.rows[0]

    if (user.scope_level === 'own' && user.driver_id !== driverId) {
      throw new Error('Access denied: You can only view your own driver record')
    } else if (user.scope_level === 'team' && user.team_driver_ids) {
      if (!user.team_driver_ids.includes(driverId)) {
        throw new Error('Access denied: Driver not in your team')
      }
    }

    return driver
  }

  /**
   * Create a new driver
   */
  async createDriver(tenantId: string, data: Partial<Driver>): Promise<Driver> {
    return this.driverRepository.createDriver(tenantId, data)
  }

  /**
   * Update a driver
   */
  async updateDriver(id: string, tenantId: string, data: Partial<Driver>): Promise<Driver> {
    return this.driverRepository.updateDriver(id, tenantId, data)
  }

  /**
   * Delete a driver
   */
  async deleteDriver(id: string, tenantId: string): Promise<void> {
    const deleted = await this.driverRepository.deleteDriver(id, tenantId)

    if (!deleted) {
      throw new Error('Driver not found')
    }
  }

  /**
   * Certify a driver (with Separation of Duties check)
   */
  async certifyDriver(
    driverId: string,
    tenantId: string,
    certifiedById: string,
    data: {
      certification_type: string
      expiry_date: Date
    }
  ): Promise<Driver> {
    // Prevent self-certification (SoD)
    if (driverId === certifiedById) {
      throw new Error('Separation of Duties violation: You cannot certify yourself')
    }

    const result = await pool.query(
      `UPDATE users SET
         certification_status = 'certified',
         certification_type = $3,
         certification_expiry = $4,
         certified_by = $5,
         certified_at = NOW(),
         updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [driverId, tenantId, data.certification_type, data.expiry_date, certifiedById]
    )

    if (result.rows.length === 0) {
      throw new Error('Driver not found')
    }

    return result.rows[0]
  }
}

export default new DriversService()
