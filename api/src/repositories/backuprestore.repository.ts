import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface Backup {
  id: number;
  tenant_id: string;
  name: string;
  description: string;
  data: string;
  created_at: Date;
  updated_at: Date;
}

export class BackupRestoreRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('backups', pool);
    this.pool = pool;
  }

  async createBackup(tenantId: string, backup: Omit<Backup, 'id' | 'created_at' | 'updated_at'>): Promise<Backup> {
    const query = `
      INSERT INTO backups (name, description, data, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      backup.name,
      backup.description,
      backup.data,
      tenantId
    ];
    const result: QueryResult<Backup> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getBackupById(tenantId: string, id: number): Promise<Backup | null> {
    const query = `
      SELECT id, name, description, data, tenant_id, created_at, updated_at
      FROM backups
      WHERE id = $1 AND tenant_id = $2
    `;
    const result: QueryResult<Backup> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async listBackups(tenantId: string): Promise<Backup[]> {
    const query = `
      SELECT id, name, description, data, tenant_id, created_at, updated_at
      FROM backups
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const result: QueryResult<Backup> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async updateBackup(tenantId: string, id: number, backup: Partial<Backup>): Promise<Backup | null> {
    const setClause = Object.keys(backup)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getBackupById(tenantId, id);
    }

    const query = `UPDATE backups SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(backup)];
    const result: QueryResult<Backup> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteBackup(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM backups
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}