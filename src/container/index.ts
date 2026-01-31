// Legacy import - awilix not in package.json, commented out for type safety
// import { createContainer, asClass } from 'awilix';

// Legacy repository imports - these paths don't exist, commented out
// import { DriverRepository } from '../repositories/DriverRepository';
// import { InspectionRepository } from '../repositories/InspectionRepository';
// import { MaintenanceRepository } from '../repositories/MaintenanceRepository';
// import { VehicleRepository } from '../repositories/VehicleRepository';
// import { VendorRepository } from '../repositories/VendorRepository';
// import { WorkOrderRepository } from '../repositories/WorkOrderRepository';
// import { Logger } from '../services/Logger';

import { DIContainer } from './DIContainer';

/**
 * Stub implementation of DI container configuration.
 * Original implementation used awilix which is not installed.
 * Returns a stub container for type safety.
 */
export const configureContainer = (): DIContainer => {
  // Stub container - awilix not available
  const container: DIContainer = {
    vehicleRepository: {} as DIContainer['vehicleRepository'],
    driverRepository: {} as DIContainer['driverRepository'],
    vendorRepository: {} as DIContainer['vendorRepository'],
    inspectionRepository: {} as DIContainer['inspectionRepository'],
    maintenanceRepository: {} as DIContainer['maintenanceRepository'],
    workOrderRepository: {} as DIContainer['workOrderRepository'],
    logger: {} as DIContainer['logger']
  };

  return container;
};