
import { prisma } from '../lib/prisma';
import { Repository } from '../lib/repository';

export class InspectionRepository extends Repository<any> {
  constructor() {
    super(prisma.inspection);
  }

  async findByVehicle(vehicleId: string) {
    return await this.model.findMany({
      where: { vehicleId },
      orderBy: { inspectionDate: 'desc' }
    });
  }

  async findFailedInspections() {
    return await this.model.findMany({
      where: { passedInspection: false },
      orderBy: { inspectionDate: 'desc' }
    });
  }
}

export const inspectionRepository = new InspectionRepository();
