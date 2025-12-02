import { BaseRepository } from '../services/dal/BaseRepository'
import { connectionManager } from '../config/connection-manager'

/**
 * Driver/User entity interface
 */
export interface Driver {
  id: string
  tenant_id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: string
  status?: string
  driver_license_number?: string
  driver_license_state?: string
  driver_license_expiry?: Date
  certification_status?: string
  certification_type?: string
  certification_expiry?: Date
  certified_by?: string
  certified_at?: Date
  team_driver_ids?: string[]
  driver_id?: string
  scope_level?: string
  created_at?: Date
  updated_at?: Date
}

/**
 * Driver Repository
 * Provides data access operations for drivers (users) using the DAL
 */
export class DriverRepository extends BaseRepository<Driver> {
  constructor() {
    super('users', connectionManager.getWritePool())
  }

  /**
   * Find all drivers for a tenant
   */
  async findByTenant(tenantId: string): Promise<Driver[]> {
    return this.findAll({
      where: { tenant_id: tenantId },
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Get paginated drivers for a tenant
   */
  async getPaginatedDrivers(
    tenantId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    return this.paginate({
      where: { tenant_id: tenantId },
      page: options.page || 1,
      limit: options.limit || 50,
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Create a new driver
   */
  async createDriver(tenantId: string, data: Partial<Driver>): Promise<Driver> {
    return this.create({
      ...data,
      tenant_id: tenantId
    })
  }

  /**
   * Update a driver
   */
  async updateDriver(id: string, tenantId: string, data: Partial<Driver>): Promise<Driver> {
    return this.update(id, data, tenantId)
  }

  /**
   * Delete a driver
   */
  async deleteDriver(id: string, tenantId: string): Promise<boolean> {
    return this.delete(id, tenantId)
  }

  /**
   * Find driver by ID for a tenant
   */
  async findByIdAndTenant(id: string, tenantId: string): Promise<Driver | null> {
    return this.findById(id, tenantId)
  }

  /**
   * Find driver by email
   */
  async findByEmail(email: string, tenantId: string): Promise<Driver | null> {
    return this.findOne({ email, tenant_id: tenantId })
  }

  /**
   * Count drivers by status
   */
  async countByStatus(tenantId: string, status: string): Promise<number> {
    return this.count({ tenant_id: tenantId, status })
  }

  /**
   * Find drivers by certification status
   */
  async findByCertificationStatus(tenantId: string, certificationStatus: string): Promise<Driver[]> {
    return this.findAll({
      where: { tenant_id: tenantId, certification_status: certificationStatus },
      orderBy: 'created_at DESC'
    })
  }
}
