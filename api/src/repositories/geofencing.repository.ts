import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class GeofencingRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'geofencings');
  }

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
