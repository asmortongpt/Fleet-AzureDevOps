import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class MileageTrackingRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LMileage_LTracking_s');
  }

    super(pool, 'LMileage_LTracking_LRepository extends s');
  }


  async createMileageTracking(tenant_id: string, mileageTrackingData: MileageTracking): Promise<MileageTracking> {
    const mileageTracking = this.create({ ...mileageTrackingData, tenant_id });
    await this.save(mileageTracking);
    return mileageTracking;
  }

  async getMileageTrackings(tenant_id: string): Promise<MileageTracking[]> {
    return this.find({ where: { tenant_id } });
  }

  async getMileageTrackingById(tenant_id: string, id: string): Promise<MileageTracking> {
    return this.findOne({ where: { id, tenant_id } });
  }

  async updateMileageTracking(tenant_id: string, id: string, mileageTrackingData: Partial<MileageTracking>): Promise<MileageTracking> {
    await this.update({ id, tenant_id }, mileageTrackingData);
    return this.getMileageTrackingById(tenant_id, id);
  }

  async deleteMileageTracking(tenant_id: string, id: string): Promise<void> {
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
