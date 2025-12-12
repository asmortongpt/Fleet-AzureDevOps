import { Pool, QueryResult } from 'pg';

class VideoTelematicsEventsRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createVideoTelematicsEvent(
    tenant_id: string,
    event_type: string,
    event_data: string,
    timestamp: Date
  ): Promise<number> {
    const query = `
      INSERT INTO video_telematics_events (tenant_id, event_type, event_data, timestamp)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const values = [tenant_id, event_type, event_data, timestamp];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows[0].id;
  }

  async getVideoTelematicsEventById(
    tenant_id: string,
    id: number
  ): Promise<any> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM video_telematics_events
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getVideoTelematicsEventsByTenantId(
    tenant_id: string
  ): Promise<any[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM video_telematics_events
      WHERE tenant_id = $1;
    `;
    const values = [tenant_id];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows;
  }

  async updateVideoTelematicsEvent(
    tenant_id: string,
    id: number,
    event_type: string,
    event_data: string,
    timestamp: Date
  ): Promise<boolean> {
    const query = `
      UPDATE video_telematics_events
      SET event_type = $1, event_data = $2, timestamp = $3
      WHERE id = $4 AND tenant_id = $5;
    `;
    const values = [event_type, event_data, timestamp, id, tenant_id];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  async deleteVideoTelematicsEvent(
    tenant_id: string,
    id: number
  ): Promise<boolean> {
    const query = `
      DELETE FROM video_telematics_events
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }
}

export default VideoTelematicsEventsRepository;
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM videotelematicsevents t
    WHERE t.id = \api/src/repositories/videotelematicsevents.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM videotelematicsevents t
    WHERE t.tenant_id = \api/src/repositories/videotelematicsevents.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
