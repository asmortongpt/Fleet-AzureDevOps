import { Pool, QueryResult } from 'pg';

import { BaseRepository } from './base/BaseRepository';


export class CommunicationsRepository extends BaseRepository<any> {

  constructor(pool: Pool) {
    super(pool, 'communication_logs');
  }

  async createCommunication(
    tenant_id: string,
    type: string,
    content: string,
    sender_id: string,
    recipient_id: string
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO communication_logs (tenant_id, communication_type, body, user_id, to_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `;
    const values = [tenant_id, type, content, sender_id, recipient_id];
    return this.pool.query(query, values);
  }

  async getCommunicationById(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM communication_logs
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];
    return this.pool.query(query, values);
  }

  async getAllCommunications(tenant_id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM communication_logs
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];
    return this.pool.query(query, values);
  }

  async updateCommunication(
    tenant_id: string,
    id: string,
    type: string,
    content: string
  ): Promise<QueryResult> {
    const query = `
      UPDATE communication_logs
      SET communication_type = $1, body = $2, updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4
      RETURNING id, updated_at
    `;
    const values = [type, content, id, tenant_id];
    return this.pool.query(query, values);
  }

  async deleteCommunication(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM communication_logs
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];
    return this.pool.query(query, values);
  }
}