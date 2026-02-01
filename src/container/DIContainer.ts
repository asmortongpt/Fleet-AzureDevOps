// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DriverRepository {
  // Define methods and properties as needed
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface InspectionRepository {
  // Define methods and properties as needed
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MaintenanceRepository {
  // Define methods and properties as needed
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface VehicleRepository {
  // Define methods and properties as needed
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface VendorRepository {
  // Define methods and properties as needed
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface WorkOrderRepository {
  // Define methods and properties as needed
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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