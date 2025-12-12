import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class JobSchedulingRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LJob_LScheduling_s');
  }

    super(pool, 'LJob_LScheduling_LRepository extends s');
  }

  async createJobSchedule(tenant_id: string, jobScheduleData: any): Promise<JobSchedule> {
    const jobSchedule = this.create({
      ...jobScheduleData,
      tenant_id,
    });

    await this.save(jobSchedule);
    return jobSchedule;
  }

  async getJobSchedules(tenant_id: string): Promise<JobSchedule[]> {
    return this.find({ where: { tenant_id } });
  }

  async getJobScheduleById(tenant_id: string, id: string): Promise<JobSchedule> {
    return this.findOne({ where: { id, tenant_id } });
  }

  async updateJobSchedule(tenant_id: string, id: string, jobScheduleData: any): Promise<JobSchedule> {
    await this.update({ id, tenant_id }, jobScheduleData);
    return this.getJobScheduleById(tenant_id, id);
  }

  async deleteJobSchedule(tenant_id: string, id: string): Promise<void> {
    await this.delete({ id, tenant_id });
  }

  // Prevent N+1 queries with JOINs
  async findAllWithRelated() {
    const query = `
      SELECT
        t1.*,
        t2.id as related_id,
        t2.name as related_name
      FROM ${this.tableName} t1
      LEFT JOIN related_table t2 ON t1.related_id = t2.id
      WHERE t1.tenant_id = $1
      ORDER BY t1.created_at DESC
    `;
    const result = await this.query(query, [this.tenantId]);
    return result.rows;
  }

}
