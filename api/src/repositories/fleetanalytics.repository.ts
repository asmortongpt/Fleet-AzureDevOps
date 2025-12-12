import { Pool, QueryResult } from 'pg';

class FleetAnalyticsRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getFleetAnalytics(tenantId: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM fleet_analytics
      WHERE tenant_id = $1
    `;
    return this.pool.query(query, [tenantId]);
  }

  async getFleetAnalyticsById(tenantId: string, id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM fleet_analytics
      WHERE tenant_id = $1 AND id = $2
    `;
    return this.pool.query(query, [tenantId, id]);
  }

  async createFleetAnalytics(tenantId: string, data: any): Promise<QueryResult> {
    const query = `
      INSERT INTO fleet_analytics (tenant_id, data)
      VALUES ($1, $2)
      RETURNING *
    `;
    return this.pool.query(query, [tenantId, JSON.stringify(data)]);
  }

  async updateFleetAnalytics(tenantId: string, id: string, data: any): Promise<QueryResult> {
    const query = `
      UPDATE fleet_analytics
      SET data = $1
      WHERE tenant_id = $2 AND id = $3
      RETURNING *
    `;
    return this.pool.query(query, [JSON.stringify(data), tenantId, id]);
  }

  async deleteFleetAnalytics(tenantId: string, id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM fleet_analytics
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;
    return this.pool.query(query, [tenantId, id]);
  }
}

export default FleetAnalyticsRepository;