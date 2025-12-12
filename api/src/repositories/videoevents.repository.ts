import { BaseRepository } from '../repositories/BaseRepository';

Here's a TypeScript repository class `VideoEventsRepository` that implements CRUD methods with parameterized queries and tenant_id filtering to eliminate the need for multiple queries in `api/src/routes/video-events.routes.ts`:


import { Pool, QueryResult } from 'pg';

interface VideoEvent {
  id: number;
  video_id: number;
  event_type: string;
  event_data: string;
  created_at: Date;
  updated_at: Date;
  tenant_id: string;
}

export class VideoEventsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new video event
  async create(videoEvent: Omit<VideoEvent, 'id' | 'created_at' | 'updated_at'>): Promise<VideoEvent> {
    const query = `
      INSERT INTO video_events (video_id, event_type, event_data, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, video_id, event_type, event_data, created_at, updated_at, tenant_id
    `;
    const values = [videoEvent.video_id, videoEvent.event_type, videoEvent.event_data, videoEvent.tenant_id];
    const result: QueryResult<VideoEvent> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a video event by id
  async read(id: number, tenantId: string): Promise<VideoEvent | null> {
    const query = `
      SELECT id, video_id, event_type, event_data, created_at, updated_at, tenant_id
      FROM video_events
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];
    const result: QueryResult<VideoEvent> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update a video event
  async update(id: number, videoEvent: Partial<Omit<VideoEvent, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>>, tenantId: string): Promise<VideoEvent | null> {
    const setClause = Object.keys(videoEvent)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const query = `
      UPDATE video_events
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(videoEvent).length + 2}
      RETURNING id, video_id, event_type, event_data, created_at, updated_at, tenant_id
    `;
    const values = [id, ...Object.values(videoEvent), tenantId];
    const result: QueryResult<VideoEvent> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a video event
  async delete(id: number, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM video_events
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenantId];
    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  // List video events for a tenant
  async list(tenantId: string): Promise<VideoEvent[]> {
    const query = `
      SELECT id, video_id, event_type, event_data, created_at, updated_at, tenant_id
      FROM video_events
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const values = [tenantId];
    const result: QueryResult<VideoEvent> = await this.pool.query(query, values);
    return result.rows;
  }
}


This `VideoEventsRepository` class provides the following methods:

1. `create`: Creates a new video event with the provided data.
2. `read`: Retrieves a video event by its ID and tenant ID.
3. `update`: Updates a video event with the provided data, filtering by ID and tenant ID.
4. `delete`: Deletes a video event by its ID and tenant ID.
5. `list`: Retrieves all video events for a given tenant ID.

All methods use parameterized queries ($1, $2, $3, etc.) to prevent SQL injection and improve performance. The `tenant_id` is included in all queries to ensure proper multi-tenant isolation.

To use this repository in your `api/src/routes/video-events.routes.ts` file, you would typically instantiate it with a database connection pool and call its methods instead of writing individual queries. This approach should eliminate the need for the 5 separate queries you mentioned, consolidating them into these 5 repository methods.