import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface FleetCard {
    id: number;
    tenant_id: number;
    card_number: string;
    driver_id: number;
    vehicle_id: number;
    provider: string;
    status: string;
    limit_amount: number;
    created_at: Date;
    updated_at: Date;
}

export class FleetCardsRepository extends BaseRepository<any> {

    private pool: Pool;

    constructor(pool: Pool) {
        super('fleet_cards', pool);
        this.pool = pool;
    }

    async findByTenantId(tenantId: number): Promise<FleetCard[]> {
        const query = `SELECT id, tenant_id, card_number, driver_id, vehicle_id, provider, status, limit_amount, created_at, updated_at FROM fleet_cards WHERE tenant_id = $1 ORDER BY created_at DESC`;
        const result: QueryResult<FleetCard> = await this.pool.query(query, [tenantId]);
        return result.rows;
    }

    async createFleetCard(tenantId: number, fleetCard: Omit<FleetCard, 'id' | 'created_at' | 'updated_at'>): Promise<FleetCard> {
        const query = `
      INSERT INTO fleet_cards (tenant_id, card_number, driver_id, vehicle_id, provider, status, limit_amount, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
        const values = [
            tenantId,
            fleetCard.card_number,
            fleetCard.driver_id,
            fleetCard.vehicle_id,
            fleetCard.provider,
            fleetCard.status,
            fleetCard.limit_amount
        ];
        const result: QueryResult<FleetCard> = await this.pool.query(query, values);
        return result.rows[0];
    }

    async updateFleetCard(tenantId: number, id: number, fleetCard: Partial<FleetCard>): Promise<FleetCard | null> {
        const setClause = Object.keys(fleetCard)
            .map((key, index) => `${key} = $${index + 3}`)
            .join(', ');

        if (!setClause) {
            return null;
        }

        const query = `UPDATE fleet_cards SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
        const values = [id, tenantId, ...Object.values(fleetCard)];
        const result: QueryResult<FleetCard> = await this.pool.query(query, values);
        return result.rows[0] || null;
    }

    async deleteFleetCard(tenantId: number, id: number): Promise<boolean> {
        const query = `DELETE FROM fleet_cards WHERE id = $1 AND tenant_id = $2 RETURNING id`;
        const result: QueryResult = await this.pool.query(query, [id, tenantId]);
        return result.rowCount ? result.rowCount > 0 : false;
    }
}