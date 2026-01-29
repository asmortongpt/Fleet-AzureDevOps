import { DriverRepository } from '../repositories/DriverRepository';
import { InspectionRepository } from '../repositories/InspectionRepository';
import { MaintenanceRepository } from '../repositories/MaintenanceRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { VendorRepository } from '../repositories/VendorRepository';
import { WorkOrderRepository } from '../repositories/WorkOrderRepository';
import { Logger } from '../services/Logger';

import { DIContainer, Resolver, RegistrationOptions } from './DIContainer';

/**
 * Creates a resolver for a class with singleton or transient lifetime.
 */
function asClass<T>(
  ClassType: new () => T,
  options?: RegistrationOptions
): Resolver<T> {
  let instance: T | null = null;
  return {
    resolve(): T {
      if (options?.lifetime === 'singleton') {
        if (!instance) {
          instance = new ClassType();
        }
        return instance;
      }
      return new ClassType();
    }
  };
}

/**
 * Creates a simple DI container.
 */
function createContainer(): DIContainer {
  const registrations: Record<string, Resolver<unknown>> = {};
  const resolved: Record<string, unknown> = {};

  return {
    vehicleRepository: null as unknown as DIContainer['vehicleRepository'],
    driverRepository: null as unknown as DIContainer['driverRepository'],
    vendorRepository: null as unknown as DIContainer['vendorRepository'],
    inspectionRepository: null as unknown as DIContainer['inspectionRepository'],
    maintenanceRepository: null as unknown as DIContainer['maintenanceRepository'],
    workOrderRepository: null as unknown as DIContainer['workOrderRepository'],
    logger: null as unknown as DIContainer['logger'],
    register(newRegistrations: Record<string, Resolver<unknown>>): void {
      Object.assign(registrations, newRegistrations);
      // Resolve and assign each registration to the container
      for (const [name, resolver] of Object.entries(newRegistrations)) {
        resolved[name] = resolver.resolve();
        (this as unknown as Record<string, unknown>)[name] = resolved[name];
      }
    },
    resolve<T>(name: string): T {
      if (resolved[name]) {
        return resolved[name] as T;
      }
      const resolver = registrations[name];
      if (!resolver) {
        throw new Error(`No registration found for: ${name}`);
      }
      resolved[name] = resolver.resolve();
      return resolved[name] as T;
    }
  };
}

export const configureContainer = (): DIContainer => {
  const container = createContainer();

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