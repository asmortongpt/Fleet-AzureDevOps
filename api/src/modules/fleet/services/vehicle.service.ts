import { injectable, inject } from "inversify";
import { BaseService } from "../../../services/base.service";
import { TYPES } from "../../../types";
import { VehicleRepository } from "../repositories/vehicle.repository";

@injectable()
export class VehicleService extends BaseService {
  constructor(@inject(TYPES.VehicleRepository) private vehicleRepository: VehicleRepository) {
    super();
  }

  async validate(data: any): Promise<void> {
    if (!data.vin) {
      throw new Error("Vehicle VIN is required");
    }
    if (!data.make) {
      throw new Error("Vehicle make is required");
    }
    if (!data.model) {
      throw new Error("Vehicle model is required");
    }
    if (!data.year) {
      throw new Error("Vehicle year is required");
    }
  }

  async getAllVehicles(tenantId: string): Promise<any[]> {
    return this.executeInTransaction(async () => {
      return await this.vehicleRepository.findByTenant(tenantId);
    });
  }

  async getVehicleById(id: number, tenantId: string): Promise<any | null> {
    return this.executeInTransaction(async () => {
      return await this.vehicleRepository.findById(id, tenantId);
    });
  }

  async createVehicle(data: any, tenantId: string): Promise<any> {
    await this.validate(data);
    return this.executeInTransaction(async () => {
      return await this.vehicleRepository.create(data, tenantId);
    });
  }

  async updateVehicle(id: number, data: any, tenantId: string): Promise<any | null> {
    return this.executeInTransaction(async () => {
      return await this.vehicleRepository.update(id, data, tenantId);
    });
  }

  async deleteVehicle(id: number, tenantId: string): Promise<boolean> {
    return this.executeInTransaction(async () => {
      return await this.vehicleRepository.delete(id, tenantId);
    });
  }
}
