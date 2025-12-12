import { BaseRepository } from '../repositories/BaseRepository';

Here is a basic example of a TypeScript repository for mileage tracking. This example includes parameterized queries, tenant_id, and CRUD operations.


import { EntityRepository, Repository } from 'typeorm';
import { MileageTracking } from '../entities/mileage-tracking.entity';

@EntityRepository(MileageTracking)
export class MileageTrackingRepository extends Repository<MileageTracking> {
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


This repository is using TypeORM, a popular ORM that can run in NodeJS and others. It provides a repository design pattern which works with the concept of Entities. The `MileageTracking` is an Entity that maps to a database table.

The `createMileageTracking` method creates a new mileage tracking record for a specific tenant. The `getMileageTrackings` method retrieves all mileage tracking records for a specific tenant. The `getMileageTrackingById` method retrieves a specific mileage tracking record by its id for a specific tenant. The `updateMileageTracking` method updates a specific mileage tracking record by its id for a specific tenant. The `deleteMileageTracking` method deletes a specific mileage tracking record by its id for a specific tenant.

Each method uses the tenant_id to ensure data isolation between different tenants.