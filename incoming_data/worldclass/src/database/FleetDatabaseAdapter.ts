import { VehicleRepository } from '../repositories/VehicleRepository';

export interface FleetDatabase {
  vehicleDao: () => VehicleRepository;
}

/**
 * Adapter to wrap RoomDatabase DAOs for DI consistency.
 */
export class FleetDatabaseAdapter {
  private fleetDatabase: FleetDatabase;

  constructor(fleetDatabase: FleetDatabase) {
    this.fleetDatabase = fleetDatabase;
  }

  /**
   * Provides a vehicle repository interface for mobile platform.
   * @returns {VehicleRepository} The vehicle repository.
   */
  getVehicleRepository(): VehicleRepository {
    return this.fleetDatabase?.vehicleDao();
  }

  // Additional methods for other DAOs...
}