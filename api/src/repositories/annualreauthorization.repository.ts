import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


export class AnnualReauthorizationRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createAnnualReauthorization(
    tenantId: string,
    userId: string,
    reauthorizationDate: Date
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO annual_reauthorizations (tenant_id, user_id, reauthorization_date)
      VALUES ($1, $2, $3)
      RETURNING id, tenant_id, user_id, reauthorization_date
    `;
    const values = [tenantId, userId, reauthorizationDate];
    return await this.pool.query(query, values);
  }

  async getAnnualReauthorizationById(
    tenantId: string,
    id: string
  ): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, user_id, reauthorization_date
      FROM annual_reauthorizations
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];
    return await this.pool.query(query, values);
  }

  async getAllAnnualReauthorizations(
    tenantId: string
  ): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, user_id, reauthorization_date
      FROM annual_reauthorizations
      WHERE tenant_id = $1
    `;
    const values = [tenantId];
    return await this.pool.query(query, values);
  }

  async updateAnnualReauthorization(
    tenantId: string,
    id: string,
    userId: string,
    reauthorizationDate: Date
  ): Promise<QueryResult> {
    const query = `
      UPDATE annual_reauthorizations
      SET user_id = $3, reauthorization_date = $4
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, tenant_id, user_id, reauthorization_date
    `;
    const values = [id, tenantId, userId, reauthorizationDate];
    return await this.pool.query(query, values);
  }

  async deleteAnnualReauthorization(
    tenantId: string,
    id: string
  ): Promise<QueryResult> {
    const query = `
      DELETE FROM annual_reauthorizations
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, tenant_id, user_id, reauthorization_date
    `;
    const values = [id, tenantId];
    return await this.pool.query(query, values);
  }
}