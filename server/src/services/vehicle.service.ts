// server/src/services/vehicle.service.ts
import { CreateVehicleDto, Vehicle } from '../models/vehicle.model';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { Logger } from '../utils/logger';
import { UnitOfWork } from '../utils/unitOfWork';

export interface IVehicleService {
  createVehicle(data: CreateVehicleDto, tenantId: number): Promise<Vehicle>;
  // Other service methods
}

export class VehicleService implements IVehicleService {
  constructor(
    private vehicleRepo: VehicleRepository,
    private logger: Logger,
    private uow: UnitOfWork
  ) {}

  async createVehicle(data: CreateVehicleDto, tenantId: number): Promise<Vehicle> {
    await this.uow.begin();
    try {
      await this.validateVin(data.vin, tenantId);

      const vehicle = await this.vehicleRepo.create({
        ...data,
        tenantId,
        status: 'active'
      });

      await this.uow.commit();
      this.logger.info('Vehicle created', { vehicleId: vehicle.id, tenantId });
      return vehicle;
    } catch (error) {
      await this.uow.rollback();
      this.logger.error('Error creating vehicle', { error, tenantId });
      throw error;
    }
  }

  private async validateVin(vin: string, tenantId: number): Promise<void> {
    const existingVehicle = await this.vehicleRepo.findByVin(vin, tenantId);
    if (existingVehicle) {
      throw new Error('VIN already exists for this tenant');
    }
  }
}

// server/src/services/driver.service.ts
import { DriverRepository } from '../repositories/driver.repository';
import { CreateDriverDto, Driver } from '../models/driver.model';

export interface IDriverService {
  createDriver(data: CreateDriverDto, tenantId: number): Promise<Driver>;
  // Other service methods
}

export class DriverService implements IDriverService {
  constructor(
    private driverRepo: DriverRepository,
    private logger: Logger,
    private uow: UnitOfWork
  ) {}

  async createDriver(data: CreateDriverDto, tenantId: number): Promise<Driver> {
    await this.uow.begin();
    try {
      await this.validateLicense(data.licenseNumber, tenantId);

      const driver = await this.driverRepo.create({
        ...data,
        tenantId,
        status: 'active'
      });

      await this.uow.commit();
      this.logger.info('Driver created', { driverId: driver.id, tenantId });
      return driver;
    } catch (error) {
      await this.uow.rollback();
      this.logger.error('Error creating driver', { error, tenantId });
      throw error;
    }
  }

  private async validateLicense(licenseNumber: string, tenantId: number): Promise<void> {
    const existingDriver = await this.driverRepo.findByLicense(licenseNumber, tenantId);
    if (existingDriver) {
      throw new Error('License number already exists for this tenant');
    }
  }
}

// server/src/services/maintenance.service.ts
import { MaintenanceRepository } from '../repositories/maintenance.repository';
import { CreateMaintenanceDto, Maintenance } from '../models/maintenance.model';

export interface IMaintenanceService {
  scheduleMaintenance(data: CreateMaintenanceDto, tenantId: number): Promise<Maintenance>;
  // Other service methods
}

export class MaintenanceService implements IMaintenanceService {
  constructor(
    private maintenanceRepo: MaintenanceRepository,
    private logger: Logger,
    private uow: UnitOfWork
  ) {}

  async scheduleMaintenance(data: CreateMaintenanceDto, tenantId: number): Promise<Maintenance> {
    await this.uow.begin();
    try {
      await this.validateSchedule(data.vehicleId, data.date, tenantId);

      const maintenance = await this.maintenanceRepo.create({
        ...data,
        tenantId,
        status: 'scheduled'
      });

      await this.uow.commit();
      this.logger.info('Maintenance scheduled', { maintenanceId: maintenance.id, tenantId });
      return maintenance;
    } catch (error) {
      await this.uow.rollback();
      this.logger.error('Error scheduling maintenance', { error, tenantId });
      throw error;
    }
  }

  private async validateSchedule(vehicleId: number, date: Date, tenantId: number): Promise<void> {
    const existingMaintenance = await this.maintenanceRepo.findByVehicleAndDate(vehicleId, date, tenantId);
    if (existingMaintenance) {
      throw new Error('Maintenance already scheduled for this vehicle on the given date');
    }
  }
}