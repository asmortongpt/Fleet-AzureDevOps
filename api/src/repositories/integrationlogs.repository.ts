import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class IntegrationlogsRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'integrationlogss');
  }

  constructor(pool: Pool) {
    super(pool, 'LIntegration_LLogs_LRepository extends s');
  }


  async createLog(tenant_id: string, log: Partial<IntegrationLog>): Promise<IntegrationLog> {
    const newLog = this.create({ ...log, tenant_id });
    await this.save(newLog);
    return newLog;
  }

  async getLogs(tenant_id: string): Promise<IntegrationLog[]> {
    return this.find({ where: { tenant_id } });
  }

  async getLog(tenant_id: string, id: string): Promise<IntegrationLog> {
    return this.findOne({ where: { tenant_id, id } });
  }

  async updateLog(tenant_id: string, id: string, log: Partial<IntegrationLog>): Promise<IntegrationLog> {
    await this.update({ tenant_id, id }, log);
    return this.getLog(tenant_id, id);
  }

  async deleteLog(tenant_id: string, id: string): Promise<void> {
    await this.delete({ tenant_id, id });
  }
}
