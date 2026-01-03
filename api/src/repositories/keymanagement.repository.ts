import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface KeyManagement {
    id: number;
    tenant_id: number;
    key_name: string;
    key_value: string;
    created_at: Date;
    updated_at: Date;
}

export class KeyManagementRepository extends BaseRepository<any> {

    private pool: Pool;

    constructor(pool: Pool) {
        super('key_management', pool);
        this.pool = pool;
    }

    async createKeyManagement(tenant_id: number, keyName: string, keyValue: string): Promise<KeyManagement> {
        const query = 'INSERT INTO key_management (tenant_id, key_name, key_value, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *';
        const values = [tenant_id, keyName, keyValue];
        const result: QueryResult<KeyManagement> = await this.pool.query(query, values);
        return result.rows[0];
    }

    async getKeyManagement(tenant_id: number): Promise<KeyManagement[]> {
        const query = 'SELECT id, tenant_id, key_name, key_value, created_at, updated_at FROM key_management WHERE tenant_id = $1';
        const values = [tenant_id];
        const result: QueryResult<KeyManagement> = await this.pool.query(query, values);
        return result.rows;
    }

    async getKeyManagementById(id: number, tenant_id: number): Promise<KeyManagement | null> {
        const query = 'SELECT id, tenant_id, key_name, key_value, created_at, updated_at FROM key_management WHERE id = $1 AND tenant_id = $2';
        const values = [id, tenant_id];
        const result: QueryResult<KeyManagement> = await this.pool.query(query, values);
        return result.rows[0] || null;
    }

    async updateKeyManagement(id: number, tenant_id: number, keyName: string, keyValue: string): Promise<KeyManagement | null> {
        const query = 'UPDATE key_management SET key_name = $3, key_value = $4, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *';
        const values = [id, tenant_id, keyName, keyValue];
        const result: QueryResult<KeyManagement> = await this.pool.query(query, values);
        return result.rows[0] || null;
    }

    async deleteKeyManagement(id: number, tenant_id: number): Promise<boolean> {
        const query = 'DELETE FROM key_management WHERE id = $1 AND tenant_id = $2 RETURNING id';
        const values = [id, tenant_id];
        const result: QueryResult = await this.pool.query(query, values);
        return result.rowCount ? result.rowCount > 0 : false;
    }
}