import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class InspectionRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'inspections');
  }

  constructor(pool: Pool) {
    super(pool, 'LInspection_LRepository extends s');
  }

  constructor() {
    super(prisma.inspection);
  }
  
  async findByVehicle(vehicleId: string) {
    return await prisma.inspection.findMany({
      where: { vehicleId },
      orderBy: { inspectionDate: 'desc' }
    });
  }
  
  async findFailedInspections() {
    return await prisma.inspection.findMany({
      where: { passedInspection: false },
      orderBy: { inspectionDate: 'desc' }
    });
  }
}
