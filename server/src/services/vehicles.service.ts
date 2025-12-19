import { VehiclesRepository, Vehicle, VehicleWithRelations } from '../repositories/vehicles.repository';

import { BaseService, NotFoundError } from './base.service';

export class VehiclesService extends BaseService {
  constructor(
    private vehiclesRepository: VehiclesRepository
  ) {
    super();
  }

  async getVehicles(): Promise<{ data: VehicleWithRelations[]; count: number }> {
    try {
      const vehicles = await this.vehiclesRepository.findAll();
      const count = await this.vehiclesRepository.count();

      return {
        data: vehicles,
        count
      };
    } catch (error) {
      return this.handleError('getVehicles', error);
    }
  }

  async getVehicleById(id: string): Promise<VehicleWithRelations> {
    try {
      const vehicle = await this.vehiclesRepository.findById(id);

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      return vehicle;
    } catch (error) {
      return this.handleError('getVehicleById', error, { vehicleId: id });
    }
  }

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    try {
      // Business logic: Validate VIN uniqueness
      if (data.vin) {
        const existingVehicle = await this.vehiclesRepository.findByVin(data.vin);
        if (existingVehicle) {
          throw new Error('Vehicle with this VIN already exists');
        }
      }

      const vehicle = await this.vehiclesRepository.create(data);

      this.logger.info('Vehicle created', {
        vehicleId: vehicle.id,
        vin: vehicle.vin
      });

      return vehicle;
    } catch (error) {
      return this.handleError('createVehicle', error, { data });
    }
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    try {
      // Verify vehicle exists
      const existingVehicle = await this.vehiclesRepository.findById(id);
      if (!existingVehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Business logic: If updating VIN, check uniqueness
      if (updates.vin && updates.vin !== existingVehicle.vin) {
        const vinExists = await this.vehiclesRepository.findByVin(updates.vin);
        if (vinExists) {
          throw new Error('Vehicle with this VIN already exists');
        }
      }

      const vehicle = await this.vehiclesRepository.update(id, updates);

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found after update');
      }

      this.logger.info('Vehicle updated', {
        vehicleId: id,
        updates: Object.keys(updates)
      });

      return vehicle;
    } catch (error) {
      return this.handleError('updateVehicle', error, { vehicleId: id, updates });
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    try {
      // Verify vehicle exists
      const existingVehicle = await this.vehiclesRepository.findById(id);
      if (!existingVehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      await this.vehiclesRepository.delete(id);

      this.logger.info('Vehicle deleted', { vehicleId: id });
    } catch (error) {
      return this.handleError('deleteVehicle', error, { vehicleId: id });
    }
  }
}
