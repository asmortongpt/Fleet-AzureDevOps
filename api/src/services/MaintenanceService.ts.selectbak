import { IVehicleService } from '../interfaces/IVehicleService';
import { MaintenanceRecord } from '../models/MaintenanceRecord';
import { logger } from '../utils/logger';

export class MaintenanceService implements IMaintenanceService {
  constructor(private vehicleService: IVehicleService) {}

  async getMaintenanceRecords(vehicleId: number): Promise<MaintenanceRecord[]> {
    try {
      // Validate input
      if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
        throw new Error('Invalid vehicleId');
      }

      // Fetch vehicle to ensure it exists
      await this.vehicleService.getVehicle(vehicleId);

      // Assume a database query to fetch maintenance records
      const records = await this.fetchMaintenanceRecordsFromDatabase(vehicleId);
      return records;
    } catch (error) {
      logger.error(`Error fetching maintenance records for vehicle ${vehicleId}: ${error.message}`);
      throw new Error('Failed to fetch maintenance records');
    }
  }

  private async fetchMaintenanceRecordsFromDatabase(vehicleId: number): Promise<MaintenanceRecord[]> {
    // Implement actual database query here
    // Example: return await db.query('SELECT * FROM maintenance_records WHERE vehicle_id = $1', [vehicleId]);
    throw new Error('Not implemented');
  }
}