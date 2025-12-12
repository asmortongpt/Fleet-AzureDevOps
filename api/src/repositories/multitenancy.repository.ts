import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class MultitenancyRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'multitenancys');
  }

  constructor(pool: Pool) {
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
