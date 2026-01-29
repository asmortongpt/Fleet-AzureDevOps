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
 * Registration options for DI container services.
 */
export interface RegistrationOptions {
  lifetime?: 'singleton' | 'transient' | 'scoped';
}

/**
 * Service resolver that can be registered in the container.
 */
export interface Resolver<T> {
  resolve(): T;
}

/**
 * Type-safe DI container interface.
 */
export interface DIContainer {
  vehicleRepository: VehicleRepository;
  driverRepository: DriverRepository;
  vendorRepository: VendorRepository;
  inspectionRepository: InspectionRepository;
  maintenanceRepository: MaintenanceRepository;
  workOrderRepository: WorkOrderRepository;
  logger: Logger;
  register(registrations: Record<string, Resolver<unknown>>): void;
  resolve<T>(name: string): T;
}