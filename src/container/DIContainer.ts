import { AwilixContainer } from 'awilix';

import { DriverRepository } from '../repositories/DriverRepository';
import { InspectionRepository } from '../repositories/InspectionRepository';
import { MaintenanceRepository } from '../repositories/MaintenanceRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { VendorRepository } from '../repositories/VendorRepository';
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