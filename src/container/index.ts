import { createContainer, asClass, Lifetime } from 'awilix';

import { DriverRepository } from '../repositories/DriverRepository';
import { InspectionRepository } from '../repositories/InspectionRepository';
import { MaintenanceRepository } from '../repositories/MaintenanceRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { VendorRepository } from '../repositories/VendorRepository';
import { WorkOrderRepository } from '../repositories/WorkOrderRepository';
import { Logger } from '../services/Logger';

import { DIContainer } from './DIContainer';

export const configureContainer = (): DIContainer => {
  const container = createContainer<DIContainer>();

  container.register({
    vehicleRepository: asClass(VehicleRepository, { lifetime: Lifetime.SINGLETON }),
    driverRepository: asClass(DriverRepository, { lifetime: Lifetime.SINGLETON }),
    vendorRepository: asClass(VendorRepository, { lifetime: Lifetime.SINGLETON }),
    inspectionRepository: asClass(InspectionRepository, { lifetime: Lifetime.SINGLETON }),
    maintenanceRepository: asClass(MaintenanceRepository, { lifetime: Lifetime.SINGLETON }),
    workOrderRepository: asClass(WorkOrderRepository, { lifetime: Lifetime.SINGLETON }),
    logger: asClass(Logger, { lifetime: Lifetime.SINGLETON })
  });

  return container;
};