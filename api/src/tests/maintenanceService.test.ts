import { MaintenanceService } from '../services/maintenanceService';
import { IVehicleService } from '../interfaces/IVehicleService';
import { MaintenanceRecord } from '../models/MaintenanceRecord';

jest.mock('../services/vehicleService');

const mockVehicleService: IVehicleService = {
  getVehicle: jest.fn(),
};

const maintenanceService = new MaintenanceService(mockVehicleService);

describe('MaintenanceService', () => {
  describe('getMaintenanceRecords', () => {
    it('should return maintenance records', async () => {
      const mockRecords: MaintenanceRecord[] = [{ id: 1, vehicleId: 1 }];
      jest.spyOn(maintenanceService, 'fetchMaintenanceRecordsFromDatabase').mockResolvedValue(mockRecords);
      jest.spyOn(mockVehicleService, 'getVehicle').mockResolvedValue({ id: 1 });

      const result = await maintenanceService.getMaintenanceRecords(1);

      expect(result).toEqual(mockRecords);
      expect(maintenanceService.fetchMaintenanceRecordsFromDatabase).toHaveBeenCalledWith(1);
      expect(mockVehicleService.getVehicle).toHaveBeenCalledWith(1);
    });

    it('should throw an error for invalid vehicleId', async () => {
      await expect(maintenanceService.getMaintenanceRecords(0)).rejects.toThrow('Invalid vehicleId');
    });

    it('should throw an error if fetching fails', async () => {
      jest.spyOn(maintenanceService, 'fetchMaintenanceRecordsFromDatabase').mockRejectedValue(new Error('Database error'));
      jest.spyOn(mockVehicleService, 'getVehicle').mockResolvedValue({ id: 1 });

      await expect(maintenanceService.getMaintenanceRecords(1)).rejects.toThrow('Failed to fetch maintenance records');
    });
  });
});