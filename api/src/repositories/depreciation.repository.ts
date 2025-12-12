import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class DepreciationRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LDepreciation_s');
  }

  private client: PoolClient;

    this.client = client;
  }

  // Create a new depreciation record
  async create(depreciation: Omit<Depreciation, 'id'>): Promise<Depreciation> {
    const query = `
      INSERT INTO depreciations (asset_id, depreciation_date, depreciation_amount, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, asset_id, depreciation_date, depreciation_amount, tenant_id
    `;
    const values = [
      depreciation.asset_id,
      depreciation.depreciation_date,
      depreciation.depreciation_amount,
      depreciation.tenant_id
    ];

    const result = await this.client.query<Depreciation>(query, values);
    return result.rows[0];
  }

  // Read a depreciation record by id
  async read(id: number, tenant_id: number): Promise<Depreciation | null> {
    const query = `
      SELECT id, asset_id, depreciation_date, depreciation_amount, tenant_id
      FROM depreciations
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result = await this.client.query<Depreciation>(query, values);
    return result.rows[0] || null;
  }

  // Update a depreciation record
  async update(id: number, depreciation: Partial<Depreciation>, tenant_id: number): Promise<Depreciation | null> {
    const setColumns: string[] = [];
    const values: any[] = [id, tenant_id];

    if (depreciation.asset_id !== undefined) {
      setColumns.push(`asset_id = $${setColumns.length + 3}`);
      values.push(depreciation.asset_id);
    }
    if (depreciation.depreciation_date !== undefined) {
      setColumns.push(`depreciation_date = $${setColumns.length + 3}`);
      values.push(depreciation.depreciation_date);
    }
    if (depreciation.depreciation_amount !== undefined) {
      setColumns.push(`depreciation_amount = $${setColumns.length + 3}`);
      values.push(depreciation.depreciation_amount);
    }

    if (setColumns.length === 0) {
      return null; // Nothing to update
    }

    const query = `
      UPDATE depreciations
      SET ${setColumns.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, asset_id, depreciation_date, depreciation_amount, tenant_id
    `;

    const result = await this.client.query<Depreciation>(query, values);
    return result.rows[0] || null;
  }

  // Delete a depreciation record
  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM depreciations
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];

    const result = await this.client.query<{ id: number }>(query, values);
    return result.rowCount > 0;
  }

  // List depreciation records for a tenant
  async list(tenant_id: number, limit: number = 10, offset: number = 0): Promise<Depreciation[]> {
    const query = `
      SELECT id, asset_id, depreciation_date, depreciation_amount, tenant_id
      FROM depreciations
      WHERE tenant_id = $1
      ORDER BY depreciation_date DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [tenant_id, limit, offset];

    const result = await this.client.query<Depreciation>(query, values);
    return result.rows;
  }
}

  /**
   * N+1 PREVENTION: Find with related data
   * Override this method in subclasses for specific relationships
   */
  async findWithRelatedData(id: string, tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.id = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL
    `;
    const result = await this.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * N+1 PREVENTION: Find all with related data
   * Override this method in subclasses for specific relationships
   */
  async findAllWithRelatedData(tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `;
    const result = await this.query(query, [tenantId]);
    return result.rows;
  }
