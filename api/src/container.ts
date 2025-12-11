import { Container } from 'inversify';
import { Pool } from 'pg';
import 'reflect-metadata';

// Service identifiers
export const TYPES = {
  Pool: Symbol.for('Pool'),
  VehiclesRepository: Symbol.for('VehiclesRepository'),
  VehiclesService: Symbol.for('VehiclesService'),
  DriversRepository: Symbol.for('DriversRepository'),
  DriversService: Symbol.for('DriversService'),
  MaintenanceRepository: Symbol.for('MaintenanceRepository'),
  MaintenanceService: Symbol.for('MaintenanceService'),
};

// Create and configure container
const container = new Container();

// Bind database connection
container.bind<Pool>(TYPES.Pool).toConstantValue(
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })
);

export { container };
