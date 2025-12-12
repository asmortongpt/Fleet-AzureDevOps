import { Pool, QueryResult } from 'pg';

class AnalyticsServiceRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createAnalyticsService(tenantId: string, name: string, description: string): Promise<QueryResult> {
    const query = `
      INSERT INTO analytics_services (tenant_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING id, tenant_id, name, description, created_at, updated_at;
    `;
    const values = [tenantId, name, description];
    return await this.pool.query(query, values);
  }

  async getAnalyticsServiceById(tenantId: string, id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, name, description, created_at, updated_at
      FROM analytics_services
      WHERE tenant_id = $1 AND id = $2;
    `;
    const values = [tenantId, id];
    return await this.pool.query(query, values);
  }

  async getAllAnalyticsServices(tenantId: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, name, description, created_at, updated_at
      FROM analytics_services
      WHERE tenant_id = $1;
    `;
    const values = [tenantId];
    return await this.pool.query(query, values);
  }

  async updateAnalyticsService(tenantId: string, id: string, name: string, description: string): Promise<QueryResult> {
    const query = `
      UPDATE analytics_services
      SET name = $3, description = $4, updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2
      RETURNING id, tenant_id, name, description, created_at, updated_at;
    `;
    const values = [tenantId, id, name, description];
    return await this.pool.query(query, values);
  }

  async deleteAnalyticsService(tenantId: string, id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM analytics_services
      WHERE tenant_id = $1 AND id = $2
      RETURNING id, tenant_id, name, description, created_at, updated_at;
    `;
    const values = [tenantId, id];
    return await this.pool.query(query, values);
  }
}

export default AnalyticsServiceRepository;