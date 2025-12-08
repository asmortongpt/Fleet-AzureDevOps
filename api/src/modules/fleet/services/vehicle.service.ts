import { injectable, inject } from "inversify";

import { BaseService } from "../../../services/base.service";
import { TYPES } from "../../../types";
import type { Vehicle } from "../../../types/vehicle";
import { VehicleRepository } from "../repositories/vehicle.repository";

@injectable()
export class VehicleService extends BaseService {
  constructor(
    @inject(TYPES.VehicleRepository)
    private vehicleRepository: VehicleRepository
  ) {
    super();
  }

  async validate(data: any): Promise<void> {
    if (!data.number) throw new Error("Vehicle number is required");
    if (!data.make) throw new Error("Make is required");
    if (!data.model) throw new Error("Model is required");
  }

  async getAllVehicles(tenantId: number): Promise<Vehicle[]> {
    return this.executeInTransaction(async () => {
      return await this.vehicleRepository.findAll(tenantId);
    });
  }

  async getVehicleById(id: number, tenantId: number): Promise<Vehicle | null> {
    return this.executeInTransaction(async () => {
      return await this.vehicleRepository.findById(id, tenantId);
    });
  }

  async createVehicle(data: Partial<Vehicle>, tenantId: number): Promise<Vehicle> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.vehicleRepository.create(data, tenantId);
    });
  }

  async updateVehicle(id: number, data: Partial<Vehicle>, tenantId: number): Promise<Vehicle | null> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.vehicleRepository.update(id, data, tenantId);
    });
  }

  async deleteVehicle(id: number, tenantId: number): Promise<boolean> {
    return this.executeInTransaction(async () => {
      return await this.vehicleRepository.delete(id, tenantId);
    });
  }
}
