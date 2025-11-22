/**
 * Dependency Injection Container
 *
 * This module provides a centralized DI container using Awilix for managing
 * service dependencies throughout the application.
 *
 * Benefits:
 * - Improved testability: Easy to inject mocks/stubs for testing
 * - Loose coupling: Services depend on interfaces, not concrete implementations
 * - Single Responsibility: Each service has clear dependencies
 * - Lifecycle management: Control singleton vs transient lifetimes
 *
 * Usage:
 * ```typescript
 * import { container } from './container'
 *
 * // In routes or other consumers
 * const dispatchService = container.resolve('dispatchService')
 * const samsaraService = container.resolve('samsaraService')
 * ```
 */

import { createContainer, asClass, asFunction, asValue, InjectionMode, Lifetime, AwilixContainer } from 'awilix'
import { Pool } from 'pg'
import { connectionManager } from './config/connection-manager'

// Import existing singleton service instances
// These services are currently exported as singleton instances
import dispatchServiceInstance from './services/dispatch.service'
import documentServiceInstance from './services/document.service'

// Import service classes for DI (exported as classes, not instances)
import ExampleDIService from './services/example-di.service'

// Import repository classes
import { VehicleRepository } from './repositories/VehicleRepository'
import { DriverRepository } from './repositories/DriverRepository'
import { VendorRepository } from './repositories/VendorRepository'
import { InspectionRepository } from './repositories/InspectionRepository'
import { MaintenanceRepository } from './repositories/MaintenanceRepository'
import { WorkOrderRepository } from './repositories/WorkOrderRepository'

// Logger import
import logger from './utils/logger'

/**
 * Container type definition for better TypeScript support
 *
 * This interface defines all services available through DI.
 * Services are loaded lazily to avoid circular dependencies.
 */
export interface DIContainer extends AwilixContainer {
  // Database
  db: Pool
  readPool: Pool
  writePool: Pool

  // Logger
  logger: typeof logger

  // Core Services (legacy singletons)
  dispatchService: any
  documentService: any

  // DI Services (proper constructor injection)
  exampleDIService: ExampleDIService

  // Repositories (data access layer)
  vehicleRepository: VehicleRepository
  driverRepository: DriverRepository
  vendorRepository: VendorRepository
  inspectionRepository: InspectionRepository
  maintenanceRepository: MaintenanceRepository
  workOrderRepository: WorkOrderRepository
}

/**
 * Create and configure the DI container
 */
export function createDIContainer() {
  const container = createContainer<DIContainer>({
    injectionMode: InjectionMode.PROXY
  })

  // Register database connections as functions (lazy singleton)
  // Using asFunction with SINGLETON ensures the connection is only retrieved
  // when first accessed, after connectionManager.initialize() has been called
  container.register({
    db: asFunction(() => connectionManager.getWritePool(), { lifetime: Lifetime.SINGLETON }),
    readPool: asFunction(() => connectionManager.getReadPool(), { lifetime: Lifetime.SINGLETON }),
    writePool: asFunction(() => connectionManager.getWritePool(), { lifetime: Lifetime.SINGLETON }),
    logger: asValue(logger)
  })

  // Register existing singleton service instances
  // These services are already instantiated and exported as singletons
  container.register({
    dispatchService: asValue(dispatchServiceInstance),
    documentService: asValue(documentServiceInstance)
  })

  // Register new DI-enabled services
  // These services use constructor injection and are instantiated by Awilix
  container.register({
    // SCOPED lifetime - new instance per request
    exampleDIService: asClass(ExampleDIService, {
      lifetime: Lifetime.SCOPED,
      // This tells Awilix to inject { db, logger } into the constructor
      injector: () => ({
        db: container.resolve('db'),
        logger: container.resolve('logger')
      })
    })
  })

  // Register repositories
  // Repositories are SINGLETON because they're stateless and thread-safe
  // They only provide data access methods and maintain no state
  container.register({
    vehicleRepository: asClass(VehicleRepository, {
      lifetime: Lifetime.SINGLETON
    }),
    driverRepository: asClass(DriverRepository, {
      lifetime: Lifetime.SINGLETON
    }),
    vendorRepository: asClass(VendorRepository, {
      lifetime: Lifetime.SINGLETON
    }),
    inspectionRepository: asClass(InspectionRepository, {
      lifetime: Lifetime.SINGLETON
    }),
    maintenanceRepository: asClass(MaintenanceRepository, {
      lifetime: Lifetime.SINGLETON
    }),
    workOrderRepository: asClass(WorkOrderRepository, {
      lifetime: Lifetime.SINGLETON
    })
  })

  return container
}

/**
 * Register a new service dynamically
 * Useful for registering services at runtime or in tests
 */
export function registerService<K extends keyof DIContainer>(
  serviceName: K,
  serviceInstance: DIContainer[K]
) {
  container.register({
    [serviceName]: asValue(serviceInstance)
  })
}

/**
 * Register a service class for instantiation
 * Useful for services that need constructor injection
 */
export function registerServiceClass<T>(
  serviceName: string,
  serviceClass: new (...args: any[]) => T,
  lifetime: typeof Lifetime.SCOPED | typeof Lifetime.SINGLETON | typeof Lifetime.TRANSIENT = Lifetime.SCOPED
) {
  container.register({
    [serviceName]: asClass(serviceClass, { lifetime })
  })
}

/**
 * Global container instance
 */
export const container = createDIContainer()

/**
 * Middleware to create a scoped container per request
 * This ensures each HTTP request gets fresh scoped dependencies
 */
export function containerMiddleware(req: any, res: any, next: any) {
  // Create a scoped container for this request
  req.container = container.createScope()

  // Clean up the scope after response
  res.on('finish', () => {
    if (req.container) {
      req.container.dispose()
    }
  })

  next()
}

/**
 * Utility function to resolve a service
 * Useful for non-Express contexts (jobs, scripts)
 */
export function resolve<T extends keyof DIContainer>(serviceName: T): DIContainer[T] {
  return container.resolve(serviceName)
}

/**
 * Create a test container with mock dependencies
 * Useful for unit testing
 */
export function createTestContainer(mocks?: Partial<DIContainer>) {
  const testContainer = createContainer<DIContainer>({
    injectionMode: InjectionMode.PROXY
  })

  // Register mocks or real implementations
  if (mocks) {
    Object.keys(mocks).forEach(key => {
      testContainer.register({
        [key]: asValue(mocks[key as keyof DIContainer])
      })
    })
  }

  return testContainer
}

export default container
