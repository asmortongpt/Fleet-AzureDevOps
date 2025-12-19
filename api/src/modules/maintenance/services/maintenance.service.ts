import { injectable, inject } from "inversify";

import { BaseService } from "../../../services/base.service";
import { TYPES } from "../../../types";
import type { MaintenanceRecord } from "../../../types/maintenance";
import { MaintenanceRepository } from "../repositories/maintenance.repository";

@injectable()
export class MaintenanceService extends BaseService {
  constructor(@inject(TYPES.MaintenanceRepository) private maintenanceRepository: MaintenanceRepository) {
    super();
  }

  async validate(data: any): Promise<void> {
    if (!data.vehicle_id) throw new Error("Vehicle ID is required");
    if (!data.service_type) throw new Error("Service type is required");
  }

  async getAllMaintenance(tenantId: number): Promise<MaintenanceRecord[]> {
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.findAll(tenantId);
    });
  }

  async getMaintenanceById(id: number, tenantId: number): Promise<MaintenanceRecord | null> {
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.findById(id, tenantId);
    });
  }

  async getMaintenanceByVehicleId(vehicleId: number, tenantId: number): Promise<MaintenanceRecord[]> {
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.findByVehicleId(vehicleId, tenantId);
    });
  }

  async createMaintenance(data: Partial<MaintenanceRecord>, tenantId: number): Promise<MaintenanceRecord> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.create(data, tenantId);
    });
  }

  async updateMaintenance(id: number, data: Partial<MaintenanceRecord>, tenantId: number): Promise<MaintenanceRecord | null> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.update(id, data, tenantId);
    });
  }

  async deleteMaintenance(id: number, tenantId: number): Promise<boolean> {
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.delete(id, tenantId);
    });
  }
}
