import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class FleetcardsRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'fleetcardss');
  }

  constructor(pool: Pool) {
    super(pool, 'LFleet_LCards_LRepository extends s');
  }


    async findByTenantId(tenant_id: number): Promise<FleetCard[]> {
        return this.find({ where: { tenant_id } });
    }

    async createFleetCard(fleetCard: FleetCard): Promise<FleetCard> {
        return this.save(fleetCard);
    }

    async updateFleetCard(id: number, fleetCard: FleetCard): Promise<FleetCard> {
        await this.update(id, fleetCard);
        return this.findOne(id);
    }

    async deleteFleetCard(id: number): Promise<void> {
        await this.delete(id);
    }
}
