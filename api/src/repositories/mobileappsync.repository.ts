import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class MobileAppSyncRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LMobile_LApp_LSync_s');
  }

  MobileAppSync,
  typeof MobileAppSync.prototype.id
> {
  constructor(
    @inject('datasources.db') dataSource: juggler.DataSource,
  ) {
    super(MobileAppSync, dataSource);
  }

  async findByTenantId(tenant_id: string) {
    return await this.find({where: {tenant_id}});
  }

  async createMobileAppSync(mobileAppSync: MobileAppSync) {
    return await this.create(mobileAppSync);
  }

  async updateMobileAppSync(id: string, mobileAppSync: MobileAppSync) {
    return await this.updateById(id, mobileAppSync);
  }

  async deleteMobileAppSync(id: string) {
    return await this.deleteById(id);
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
