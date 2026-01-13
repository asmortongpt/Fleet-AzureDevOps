import { injectable, inject } from 'inversify';

import { TYPES } from '../../../container';
import { PaginationParams } from '../../../repositories/base/BaseRepository';

import { VehiclesRepository, Vehicle } from '../../../repositories/vehicles.repository';

@injectable()
export class VehiclesService {
  constructor(
    @inject(TYPES.VehiclesRepository) private vehiclesRepository: VehiclesRepository
  ) {}

  async getVehicles(tenantId: string, pagination?: PaginationParams) {
    return await this.vehiclesRepository.findByTenant(tenantId, pagination);
  }

  async getVehicleById(id: string, tenantId: string) {
    const vehicle = await this.vehiclesRepository.findById(Number(id), tenantId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    return vehicle;
  }

  async createVehicle(data: Partial<Vehicle>, tenantId: string) {
    // Business logic validation
    if (data.vin) {
      const existing = await this.vehiclesRepository.findByVin(data.vin, tenantId);
      if (existing) {
        throw new Error('Vehicle with this VIN already exists');
      }
    }
    return await this.vehiclesRepository.create(data, tenantId);
  }

  async updateVehicle(id: string, data: Partial<Vehicle>, tenantId: string) {
    return await this.vehiclesRepository.update(Number(id), data, tenantId);
  }

  async deleteVehicle(id: string, tenantId: string) {
    return await this.vehiclesRepository.delete(Number(id), tenantId);
  }

  async getStatus(vehicleId: string, tenantId: string) {
    const vehicle = await this.vehiclesRepository.findById(Number(vehicleId), tenantId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    return {
      vehicleId: vehicle.id,
      status: vehicle.status,
      mileage: vehicle.mileage,
      lastUpdated: vehicle.updatedAt
    };
  }
}
