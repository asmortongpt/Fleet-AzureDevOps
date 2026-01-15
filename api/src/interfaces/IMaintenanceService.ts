import { MaintenanceRecord } from '../types/maintenance';

export interface IMaintenanceService {
  getMaintenanceRecords(vehicleId: number): Promise<MaintenanceRecord[]>;
}