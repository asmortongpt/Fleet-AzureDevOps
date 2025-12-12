import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class MileagetrackingRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'mileagetrackings');
  }

  constructor(pool: Pool) {
    super(pool, 'LMileage_LTracking_LRepository extends s');
  }


  async createMileageTracking(tenant_id: string, mileageTrackingData: MileageTracking): Promise<MileageTracking> {
    const mileageTracking = this.create({ ...mileageTrackingData, tenant_id });
    await this.save(mileageTracking);
    return mileageTracking;
  }

  async getMileageTrackings(tenant_id: string): Promise<MileageTracking[]> {
    return this.find({ where: { tenant_id } });
  }

  async getMileageTrackingById(tenant_id: string, id: string): Promise<MileageTracking> {
    return this.findOne({ where: { id, tenant_id } });
  }

  async updateMileageTracking(tenant_id: string, id: string, mileageTrackingData: Partial<MileageTracking>): Promise<MileageTracking> {
    await this.update({ id, tenant_id }, mileageTrackingData);
    return this.getMileageTrackingById(tenant_id, id);
  }

  async deleteMileageTracking(tenant_id: string, id: string): Promise<void> {
    await this.delete({ id, tenant_id });
  }
}
