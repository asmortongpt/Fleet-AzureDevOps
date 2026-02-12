import { injectable, inject } from "inversify";

import { BaseService } from "../../../services/base.service";
import { TYPES } from "../../../types";
import type { MaintenanceRecord } from "../../../types/maintenance";
import { MaintenanceRepository } from "../repositories/maintenance.repository";
import { MaintenanceScheduleRepository } from "../repositories/maintenance-schedule.repository";

@injectable()
export class MaintenanceService extends BaseService {
  constructor(
    @inject(TYPES.MaintenanceRepository) private maintenanceRepository: MaintenanceRepository,
    @inject(TYPES.MaintenanceScheduleRepository) private scheduleRepository: MaintenanceScheduleRepository
  ) {
    super();
  }

  async validate(data: any): Promise<void> {
    if (!data.vehicle_id) {
      throw new Error("Vehicle ID is required");
    }
    if (!data.service_type) {
      throw new Error("Service type is required");
    }
  }

  async getAllMaintenance(tenantId: string | number): Promise<MaintenanceRecord[]> {
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.findAll(tenantId);
    });
  }

  async getMaintenanceById(id: string | number, tenantId: string | number): Promise<MaintenanceRecord | null> {
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.findById(id, tenantId);
    });
  }

  async getMaintenanceByVehicleId(vehicleId: string | number, tenantId: string | number): Promise<MaintenanceRecord[]> {
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.findByVehicleId(vehicleId, tenantId);
    });
  }

  async getUpcomingMaintenance(tenantId: string | number, vehicleId?: string): Promise<any[]> {
    return this.executeInTransaction(async () => {
      return await this.scheduleRepository.findUpcoming(tenantId, vehicleId);
    });
  }

  async getOverdueMaintenance(tenantId: string | number): Promise<any[]> {
    return this.executeInTransaction(async () => {
      return await this.scheduleRepository.findOverdue(tenantId);
    });
  }

  async getMaintenanceStatistics(tenantId: string | number): Promise<any> {
    return this.executeInTransaction(async () => {
      const scheduleStats = await this.scheduleRepository.getStatistics(tenantId);
      return {
        ...scheduleStats,
        last_updated: new Date()
      };
    });
  }

  async createMaintenance(data: Partial<MaintenanceRecord>, tenantId: string | number): Promise<MaintenanceRecord> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.create(data, tenantId);
    });
  }

  async updateMaintenance(id: string | number, data: Partial<MaintenanceRecord>, tenantId: string | number): Promise<MaintenanceRecord | null> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.update(id, data, tenantId);
    });
  }

  async deleteMaintenance(id: string | number, tenantId: string | number): Promise<boolean> {
    return this.executeInTransaction(async () => {
      return await this.maintenanceRepository.delete(id, tenantId);
    });
  }
}
