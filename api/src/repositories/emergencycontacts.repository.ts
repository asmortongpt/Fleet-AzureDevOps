import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface EmergencyContact {
  id: number;
  tenant_id: number;
  name: string;
  phone: string;
  relationship: string;
  created_at: Date;
  updated_at: Date;
}

export class EmergencyContactsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('emergency_contacts', pool);
    this.pool = pool;
  }

  async create(tenantId: number, contact: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>): Promise<EmergencyContact> {
    const query = `
      INSERT INTO emergency_contacts (tenant_id, name, phone, relationship, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      contact.name,
      contact.phone,
      contact.relationship
    ];
    const result: QueryResult<EmergencyContact> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getAll(tenantId: number): Promise<EmergencyContact[]> {
    const query = `SELECT id, tenant_id, name, phone, relationship, created_at, updated_at FROM emergency_contacts WHERE tenant_id = $1 ORDER BY name ASC`;
    const result: QueryResult<EmergencyContact> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getById(tenantId: number, id: number): Promise<EmergencyContact | null> {
    const query = `SELECT id, tenant_id, name, phone, relationship, created_at, updated_at FROM emergency_contacts WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<EmergencyContact> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async update(tenantId: number, id: number, contact: Partial<EmergencyContact>): Promise<EmergencyContact | null> {
    const setClause = Object.keys(contact)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getById(tenantId, id);
    }

    const query = `UPDATE emergency_contacts SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(contact)];
    const result: QueryResult<EmergencyContact> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM emergency_contacts WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}