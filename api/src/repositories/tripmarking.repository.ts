import { Pool, QueryResult } from 'pg';

class TripMarkingRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createTripMarking(
    tenantId: string,
    tripId: string,
    userId: string,
    markingType: string,
    markingValue: string
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO trip_markings (tenant_id, trip_id, user_id, marking_type, marking_value)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const values = [tenantId, tripId, userId, markingType, markingValue];
    return this.pool.query(query, values);
  }

  async getTripMarkingById(tenantId: string, id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM trip_markings
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];
    return this.pool.query(query, values);
  }

  async getTripMarkingsByTripId(tenantId: string, tripId: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM trip_markings
      WHERE trip_id = $1 AND tenant_id = $2
    `;
    const values = [tripId, tenantId];
    return this.pool.query(query, values);
  }

  async getTripMarkingsByUserId(tenantId: string, userId: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM trip_markings
      WHERE user_id = $1 AND tenant_id = $2
    `;
    const values = [userId, tenantId];
    return this.pool.query(query, values);
  }

  async updateTripMarking(
    tenantId: string,
    id: string,
    markingType: string,
    markingValue: string
  ): Promise<QueryResult> {
    const query = `
      UPDATE trip_markings
      SET marking_type = $1, marking_value = $2
      WHERE id = $3 AND tenant_id = $4
      RETURNING id
    `;
    const values = [markingType, markingValue, id, tenantId];
    return this.pool.query(query, values);
  }

  async deleteTripMarking(tenantId: string, id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM trip_markings
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenantId];
    return this.pool.query(query, values);
  }
}

export default TripMarkingRepository;