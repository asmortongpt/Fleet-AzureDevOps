import { connectionManager } from '../config/connection-manager'
import { BaseRepository } from '../services/dal/BaseRepository'

export interface PersonalUsePolicy {
  id: string
  tenant_id: string
  name?: string
  description?: string
  rate_per_mile?: number
  rate_type?: string
  effective_date?: Date
  expiry_date?: Date
  is_active: boolean
  charge_personal_use?: boolean
  personal_use_rate_per_mile?: number
  require_approval?: boolean
  auto_approve_under_miles?: number
  created_at?: Date
  updated_at?: Date
}

export class PersonalUsePolicyRepository extends BaseRepository<PersonalUsePolicy> {
  constructor() {
    super('personal_use_policies', connectionManager.getWritePool())
  }

  /**
   * Find active policy for tenant
   */
  async findActiveByTenant(tenantId: string): Promise<PersonalUsePolicy | null> {
    const query = `
      SELECT
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
      FROM ${this.tableName}
      WHERE tenant_id = $1
        AND is_active = true
      ORDER BY effective_date DESC
      LIMIT 1
    `
    const result = await this.query<PersonalUsePolicy>(query, [tenantId])
    return result.rows[0] || null
  }

  /**
   * Find policy by tenant (backward compatibility - gets first policy)
   */
  async findByTenant(tenantId: string): Promise<PersonalUsePolicy | null> {
    const query = `
      SELECT
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
      FROM ${this.tableName}
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `
    const result = await this.query<PersonalUsePolicy>(query, [tenantId])
    return result.rows[0] || null
  }

  /**
   * Get approval settings for tenant
   */
  async getApprovalSettings(tenantId: string): Promise<{
    auto_approve_under_miles: number | null
    require_approval: boolean
  } | null> {
    const query = `
      SELECT auto_approve_under_miles, require_approval
      FROM ${this.tableName}
      WHERE tenant_id = $1
        AND is_active = true
      ORDER BY effective_date DESC
      LIMIT 1
    `
    const result = await this.query<{
      auto_approve_under_miles: number | null
      require_approval: boolean
    }>(query, [tenantId])
    return result.rows[0] || null
  }

  /**
   * Create new policy
   */
  async createPolicy(tenantId: string, data: Partial<PersonalUsePolicy>): Promise<PersonalUsePolicy> {
    return this.create({
      ...data,
      tenant_id: tenantId
    })
  }

  /**
   * Update policy
   */
  async updatePolicy(
    id: string,
    tenantId: string,
    data: Partial<PersonalUsePolicy>
  ): Promise<PersonalUsePolicy> {
    return this.update(id, data, tenantId)
  }

  /**
   * Delete policy
   */
  async deletePolicy(id: string, tenantId: string): Promise<boolean> {
    return this.delete(id, tenantId)
  }
}
