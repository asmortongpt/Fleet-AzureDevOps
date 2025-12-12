import { BaseRepository } from '../repositories/BaseRepository';

import { Repository } from '../lib/repository';
import { prisma } from '../lib/prisma';

export class InspectionRepository extends Repository<any> {
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

export const inspectionRepository = new InspectionRepository();
