import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class HazmatComplianceRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LHazmat_LCompliance_s');
  }

    super(pool, 'LHazmat_LCompliance_LRepository extends s');
  }

  async createHazmatCompliance(tenant_id: string, hazmatComplianceData: any): Promise<HazmatCompliance> {
    const hazmatCompliance = this.create({ ...hazmatComplianceData, tenant_id });
    return this.save(hazmatCompliance);
  }

  async getHazmatCompliance(tenant_id: string, id: string): Promise<HazmatCompliance> {
    return this.findOne({ where: { id, tenant_id } });
  }

  async getHazmatCompliances(tenant_id: string): Promise<HazmatCompliance[]> {
    return this.find({ where: { tenant_id } });
  }

  async updateHazmatCompliance(tenant_id: string, id: string, hazmatComplianceData: any): Promise<HazmatCompliance> {
    await this.update({ id, tenant_id }, hazmatComplianceData);
    return this.getHazmatCompliance(tenant_id, id);
  }

  async deleteHazmatCompliance(tenant_id: string, id: string): Promise<void> {
    await this.delete({ id, tenant_id });
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
