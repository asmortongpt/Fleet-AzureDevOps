import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class HazmatcomplianceRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'hazmatcompliances');
  }

  constructor(pool: Pool) {
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
