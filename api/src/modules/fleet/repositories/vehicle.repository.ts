import { injectable } from 'inversify';
import { VehiclesRepository } from '../../../repositories/vehicles.repository';
import { pool } from '../../../config/database';

/**
 * VehicleRepository - Wrapper for VehiclesRepository in fleet module
 * Follows the module pattern used by other modules (drivers, maintenance, etc.)
 */
@injectable()
export class VehicleRepository extends VehiclesRepository {
  constructor() {
    super(pool);
  }
}
