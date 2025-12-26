import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

interface Claim {
  id: number;
  claim_number: string;
  description: string;
  status: string;
  amount: number;
  created_at: Date;
  updated_at: Date;
  tenant_id: number;
}

export class ClaimsManagementRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    super('claims', pool);
    this.pool = pool;
  }

  // Create a new claim
  async createClaim(claim: Omit<Claim, 'id' | 'created_at' | 'updated_at'>): Promise<Claim> {
    const query = `
      INSERT INTO claims (claim_number, description, status, amount, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, claim_number, description, status, amount, created_at, updated_at, tenant_id
    `;
    const values = [
      claim.claim_number,
      claim.description,
      claim.status,
      claim.amount,
      claim.tenant_id
    ];

    const result: QueryResult<Claim> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a claim by ID
  async getClaimById(id: number, tenant_id: number): Promise<Claim | null> {
    const query = `
      SELECT id, claim_number, description, status, amount, created_at, updated_at, tenant_id
      FROM claims
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result: QueryResult<Claim> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update a claim
  async updateClaim(id: number, claim: Partial<Claim>, tenant_id: number): Promise<Claim | null> {
    const setClause = Object.keys(claim)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'tenant_id')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE claims
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(claim).length + 2}
      RETURNING id, claim_number, description, status, amount, created_at, updated_at, tenant_id
    `;
    const values = [id, ...Object.values(claim), tenant_id];

    const result: QueryResult<Claim> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a claim
  async deleteClaim(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM claims
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // List all claims for a tenant
  async listClaims(tenant_id: number): Promise<Claim[]> {
    const query = `
      SELECT id, claim_number, description, status, amount, created_at, updated_at, tenant_id
      FROM claims
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const values = [tenant_id];

    const result: QueryResult<Claim> = await this.pool.query(query, values);
    return result.rows;
  }
}