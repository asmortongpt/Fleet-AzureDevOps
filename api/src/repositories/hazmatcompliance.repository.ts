import { BaseRepository } from '../repositories/BaseRepository';

Here is a simple example of a TypeScript repository for `HazmatComplianceRepository`:


import { EntityRepository, Repository } from 'typeorm';
import { HazmatCompliance } from '../entities/hazmat-compliance.entity';

@EntityRepository(HazmatCompliance)
export class HazmatComplianceRepository extends Repository<HazmatCompliance> {
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


This repository has the basic CRUD operations for `HazmatCompliance` entity. Each operation is parameterized with `tenant_id` to ensure data isolation between different tenants.

Please replace `any` with the actual type of `hazmatComplianceData` for better type safety. Also, you may need to adjust the code according to your actual database schema and business requirements.