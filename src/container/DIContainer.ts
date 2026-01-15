import { AwilixContainer } from 'awilix';

interface DriverRepository {
  // Define methods and properties as needed
}

interface InspectionRepository {
  // Define methods and properties as needed
}

interface MaintenanceRepository {
  // Define methods and properties as needed
}

interface VehicleRepository {
  // Define methods and properties as needed
}

interface VendorRepository {
  // Define methods and properties as needed
}

interface WorkOrderRepository {
  // Define methods and properties as needed
}

interface Logger {
  // Define methods and properties as needed
}

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