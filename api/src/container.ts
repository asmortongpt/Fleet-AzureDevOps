import { Container } from 'inversify';
import { Pool } from 'pg';
import 'reflect-metadata';

// Import repositories
import { VehiclesRepository } from './modules/fleet/vehicles/vehicles.repository';
import { BaseRepository } from './repositories/BaseRepository';

// Import services
import { VehiclesService } from './modules/fleet/vehicles/vehicles.service';

// Service identifiers
export const TYPES = {
  Pool: Symbol.for('Pool'),

  // Repositories
  VehiclesRepository: Symbol.for('VehiclesRepository'),
  DriversRepository: Symbol.for('DriversRepository'),
  MaintenanceRepository: Symbol.for('MaintenanceRepository'),
  WorkOrdersRepository: Symbol.for('WorkOrdersRepository'),

  // Services
  VehiclesService: Symbol.for('VehiclesService'),
  DriversService: Symbol.for('DriversService'),
  MaintenanceService: Symbol.for('MaintenanceService'),
  WorkOrdersService: Symbol.for('WorkOrdersService'),
};

// Create and configure container
const container = new Container();

// Bind database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

container.bind<Pool>(TYPES.Pool).toConstantValue(pool);

// Bind repositories
container.bind<VehiclesRepository>(TYPES.VehiclesRepository)
  .toDynamicValue(() => new VehiclesRepository(pool))
  .inSingletonScope();

// Bind services
container.bind<VehiclesService>(TYPES.VehiclesService)
  .toDynamicValue(() => {
    const repo = container.get<VehiclesRepository>(TYPES.VehiclesRepository);
    return new VehiclesService(repo);
  })
  .inSingletonScope();

// TODO: Register additional repositories and services here
// Follow the same pattern as above

console.log('✅ DI Container configured with repositories and services');

export { container };
