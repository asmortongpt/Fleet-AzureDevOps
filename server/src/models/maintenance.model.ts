export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  cost: number;
  date: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MaintenanceRepository {
  async findByVehicleAndDate(vehicleId: string, startDate: Date, endDate: Date): Promise<MaintenanceRecord[]> {
    return [];
  }
}
