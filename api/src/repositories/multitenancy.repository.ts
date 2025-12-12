import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class MultiTenancyRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LMulti_LTenancy_s');
  }

    super(pool, 'LMulti_LTenancy_LRepository extends s');
  }


  async findByTenantId(tenant_id: string): Promise<MultiTenancy> {
    return await this.findOne({ where: { tenant_id } });
  }

  async createAndSave(tenant_id: string, data: Partial<MultiTenancy>): Promise<MultiTenancy> {
    const multiTenancy = this.create({ tenant_id, ...data });
    return await this.save(multiTenancy);
  }

  async updateByTenantId(tenant_id: string, data: Partial<MultiTenancy>): Promise<MultiTenancy> {
    await this.update({ tenant_id }, data);
    return this.findByTenantId(tenant_id);
  }

  async deleteByTenantId(tenant_id: string): Promise<void> {
    await this.delete({ tenant_id });
  }
}

  /**
   * N+1 PREVENTION: Find with related data
   * Override this method in subclasses for specific relationships
   */
  async findWithRelatedData(id: string, tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.id = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL
    `;
    const result = await this.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * N+1 PREVENTION: Find all with related data
   * Override this method in subclasses for specific relationships
   */
  async findAllWithRelatedData(tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `;
    const result = await this.query(query, [tenantId]);
    return result.rows;
  }
