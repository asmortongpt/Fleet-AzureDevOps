import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


export class CommunicationsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createCommunication(
    tenant_id: string,
    type: string,
    content: string,
    sender_id: string,
    recipient_id: string
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO communications (tenant_id, type, content, sender_id, recipient_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `;
    const values = [tenant_id, type, content, sender_id, recipient_id];
    return this.pool.query(query, values);
  }

  async getCommunicationById(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM communications
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];
    return this.pool.query(query, values);
  }

  async getAllCommunications(tenant_id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM communications
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
      UPDATE communications
      SET type = $1, content = $2
      WHERE id = $3 AND tenant_id = $4
      RETURNING id, updated_at
    `;
    const values = [type, content, id, tenant_id];
    return this.pool.query(query, values);
  }

  async deleteCommunication(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM communications
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];
    return this.pool.query(query, values);
  }
}