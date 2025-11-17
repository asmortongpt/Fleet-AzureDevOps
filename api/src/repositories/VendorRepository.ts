import { BaseRepository } from '../services/dal/BaseRepository'
import { connectionManager } from '../config/connection-manager'

/**
 * Vendor entity interface
 */
export interface Vendor {
  id: string
  tenant_id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  vendor_type?: string
  tax_id?: string
  payment_terms?: string
  notes?: string
  is_active?: boolean
  created_at?: Date
  updated_at?: Date
}

/**
 * Vendor Repository
 * Provides data access operations for vendors using the DAL
 *
 * Example Usage:
 *
 * // Create repository instance
 * const vendorRepo = new VendorRepository()
 *
 * // Find all vendors for a tenant
 * const vendors = await vendorRepo.findByTenant(tenantId)
 *
 * // Get paginated vendors
 * const result = await vendorRepo.getPaginatedVendors(tenantId, { page: 1, limit: 50 })
 *
 * // Create a vendor
 * const newVendor = await vendorRepo.createVendor(tenantId, { name: 'ACME Corp', ... })
 *
 * // Update a vendor
 * const updated = await vendorRepo.updateVendor(id, tenantId, { email: 'new@email.com' })
 *
 * // Soft delete a vendor
 * await vendorRepo.softDeleteVendor(id, tenantId)
 */
export class VendorRepository extends BaseRepository<Vendor> {
  constructor() {
    super('vendors', connectionManager.getWritePool())
  }

  /**
   * Find all vendors for a tenant
   */
  async findByTenant(tenantId: string): Promise<Vendor[]> {
    return this.findAll({
      where: { tenant_id: tenantId },
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Find active vendors for a tenant
   */
  async findActiveByTenant(tenantId: string): Promise<Vendor[]> {
    return this.findAll({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: 'name ASC'
    })
  }

  /**
   * Get paginated vendors for a tenant
   */
  async getPaginatedVendors(
    tenantId: string,
    options: { page?: number; limit?: number; orderBy?: string } = {}
  ) {
    return this.paginate({
      where: { tenant_id: tenantId },
      page: options.page || 1,
      limit: options.limit || 50,
      orderBy: options.orderBy || 'created_at DESC'
    })
  }

  /**
   * Create a new vendor
   */
  async createVendor(tenantId: string, data: Partial<Vendor>): Promise<Vendor> {
    return this.create({
      ...data,
      tenant_id: tenantId
    })
  }

  /**
   * Update a vendor
   */
  async updateVendor(id: string, tenantId: string, data: Partial<Vendor>): Promise<Vendor> {
    return this.update(id, data, tenantId)
  }

  /**
   * Delete a vendor (hard delete)
   */
  async deleteVendor(id: string, tenantId: string): Promise<boolean> {
    return this.delete(id, tenantId)
  }

  /**
   * Soft delete a vendor (sets deleted_at timestamp)
   */
  async softDeleteVendor(id: string, tenantId: string): Promise<Vendor> {
    return this.softDelete(id, tenantId)
  }

  /**
   * Find vendor by ID for a tenant
   */
  async findByIdAndTenant(id: string, tenantId: string): Promise<Vendor | null> {
    return this.findById(id, tenantId)
  }

  /**
   * Search vendors by name
   */
  async searchByName(tenantId: string, searchTerm: string): Promise<Vendor[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE tenant_id = $1 AND name ILIKE $2
      ORDER BY name ASC
    `
    const result = await this.query<Vendor>(query, [tenantId, `%${searchTerm}%`])
    return result.rows
  }

  /**
   * Find vendors by type
   */
  async findByType(tenantId: string, vendorType: string): Promise<Vendor[]> {
    return this.findAll({
      where: { tenant_id: tenantId, vendor_type: vendorType },
      orderBy: 'name ASC'
    })
  }

  /**
   * Count vendors for a tenant
   */
  async countByTenant(tenantId: string): Promise<number> {
    return this.count({ tenant_id: tenantId })
  }

  /**
   * Check if vendor with email exists
   */
  async existsByEmail(tenantId: string, email: string): Promise<boolean> {
    return this.exists({ tenant_id: tenantId, email })
  }

  /**
   * Get vendor statistics for a tenant
   */
  async getVendorStats(tenantId: string): Promise<{
    total: number
    active: number
    inactive: number
    byType: Record<string, number>
  }> {
    const statsQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_active = false) as inactive,
        vendor_type,
        COUNT(*) as type_count
      FROM ${this.tableName}
      WHERE tenant_id = $1
      GROUP BY vendor_type
    `

    const result = await this.query(statsQuery, [tenantId])

    const byType: Record<string, number> = {}
    let total = 0
    let active = 0
    let inactive = 0

    result.rows.forEach((row: any) => {
      total += parseInt(row.total)
      active += parseInt(row.active)
      inactive += parseInt(row.inactive)

      if (row.vendor_type) {
        byType[row.vendor_type] = parseInt(row.type_count)
      }
    })

    return { total, active, inactive, byType }
  }
}
