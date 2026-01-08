import { createContainer, asClass } from 'awilix';

import { DriverRepository } from '../repositories/DriverRepository';
import { InspectionRepository } from '../repositories/InspectionRepository';
import { MaintenanceRepository } from '../repositories/MaintenanceRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { VendorRepository } from '../repositories/VendorRepository';
import { WorkOrderRepository } from '../repositories/WorkOrderRepository';
import { Logger } from '../services/Logger';

import { DIContainer } from './DIContainer';

export const configureContainer = (): DIContainer => {
  const container = createContainer() as DIContainer;

  container.register({
    vehicleRepository: asClass(VehicleRepository, { lifetime: 'singleton' }),
    driverRepository: asClass(DriverRepository, { lifetime: 'singleton' }),
    vendorRepository: asClass(VendorRepository, { lifetime: 'singleton' }),
    inspectionRepository: asClass(InspectionRepository, { lifetime: 'singleton' }),
    maintenanceRepository: asClass(MaintenanceRepository, { lifetime: 'singleton' }),
    workOrderRepository: asClass(WorkOrderRepository, { lifetime: 'singleton' }),
    logger: asClass(Logger, { lifetime: 'singleton' })
  });

  return container;
};