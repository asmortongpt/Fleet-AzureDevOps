import { BaseRepository } from '../repositories/BaseRepository';

Here is a basic implementation of a TypeScript repository for Geofencing:


import { EntityRepository, Repository } from 'typeorm';
import { Geofencing } from '../entities/geofencing.entity';

@EntityRepository(Geofencing)
export class GeofencingRepository extends Repository<Geofencing> {
  constructor(pool: Pool) {
    super(pool, 'LGeofencing_LRepository extends s');
  }

  async createGeofencing(tenant_id: string, geofencingData: any): Promise<Geofencing> {
    const geofencing = this.create({ ...geofencingData, tenant_id });
    return this.save(geofencing);
  }

  async getGeofencings(tenant_id: string): Promise<Geofencing[]> {
    return this.find({ where: { tenant_id } });
  }

  async getGeofencing(tenant_id: string, id: string): Promise<Geofencing> {
    return this.findOne({ where: { tenant_id, id } });
  }

  async updateGeofencing(tenant_id: string, id: string, geofencingData: any): Promise<Geofencing> {
    await this.update({ tenant_id, id }, geofencingData);
    return this.getGeofencing(tenant_id, id);
  }

  async deleteGeofencing(tenant_id: string, id: string): Promise<void> {
    await this.delete({ tenant_id, id });
  }
}


This repository provides CRUD operations for a Geofencing entity. Each operation is scoped to a specific tenant_id, ensuring that data is isolated for each tenant.

Please note that this is a basic implementation and might need to be adjusted based on your actual needs and the structure of your Geofencing entity and your database. Also, error handling is not included in this example and should be added.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM geofencing t
    WHERE t.id = \api/src/repositories/geofencing.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM geofencing t
    WHERE t.tenant_id = \api/src/repositories/geofencing.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
