import { Pool, QueryResult } from 'pg';

import { BaseRepository } from './base/BaseRepository';

export interface MobileAppSync {
  id: number;
  tenant_id: number;
  user_id: number;
  last_sync: Date;
  sync_status: string;
  created_at: Date;
  updated_at: Date;
}

export class MobileAppSyncRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('mobile_app_sync', pool);
    this.pool = pool;
  }

  async findByTenantId(tenant_id: number): Promise<MobileAppSync[]> {
    const query = `SELECT id, tenant_id, user_id, last_sync, sync_status, created_at, updated_at FROM mobile_app_sync WHERE tenant_id = $1`;
    const result: QueryResult<MobileAppSync> = await this.pool.query(query, [tenant_id]);
    return result.rows;
  }

  async createMobileAppSync(mobileAppSync: Omit<MobileAppSync, 'id' | 'created_at' | 'updated_at'>): Promise<MobileAppSync> {
    const query = `
      INSERT INTO mobile_app_sync (tenant_id, user_id, last_sync, sync_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [mobileAppSync.tenant_id, mobileAppSync.user_id, mobileAppSync.last_sync, mobileAppSync.sync_status];
    const result: QueryResult<MobileAppSync> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateMobileAppSync(id: number, mobileAppSync: Partial<MobileAppSync>, tenantId: number): Promise<MobileAppSync | null> {
    const setClause = Object.keys(mobileAppSync)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return null;
    }

    const query = `
      UPDATE mobile_app_sync
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...Object.values(mobileAppSync)];
    const result: QueryResult<MobileAppSync> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteMobileAppSync(id: number, tenantId: number): Promise<boolean> {
    const query = `DELETE FROM mobile_app_sync WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
