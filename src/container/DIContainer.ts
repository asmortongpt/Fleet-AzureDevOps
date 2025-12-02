import { AwilixContainer } from 'awilix';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { DriverRepository } from '../repositories/DriverRepository';
import { VendorRepository } from '../repositories/VendorRepository';
import { InspectionRepository } from '../repositories/InspectionRepository';
import { MaintenanceRepository } from '../repositories/MaintenanceRepository';
import { WorkOrderRepository } from '../repositories/WorkOrderRepository';
import { Logger } from '../services/Logger';

/**
 * Type-safe DI container interface extending AwilixContainer.
 */
export interface DIContainer extends AwilixContainer {
  vehicleRepository: VehicleRepository;
  driverRepository: DriverRepository;
  vendorRepository: VendorRepository;
  inspectionRepository: InspectionRepository;
  maintenanceRepository: MaintenanceRepository;
  workOrderRepository: WorkOrderRepository;
  logger: Logger;
}