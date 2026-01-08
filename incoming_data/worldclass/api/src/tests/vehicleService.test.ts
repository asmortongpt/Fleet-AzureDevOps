import { IMaintenanceService } from '../interfaces/IMaintenanceService';
import { Vehicle } from '../models/Vehicle';
import { VehicleService } from '../services/vehicleService';

jest.mock('../services/maintenanceService');

const mockMaintenanceService: IMaintenanceService = {
  getMaintenanceRecords: jest.fn(),
};

const vehicleService = new VehicleService(mockMaintenanceService);

describe('VehicleService', () => {
  describe('getVehicle', () => {
    it('should return a vehicle', async () => {
      const mockVehicle: Vehicle = { id: 1 };
      jest.spyOn(vehicleService, 'fetchVehicleFromDatabase').mockResolvedValue(mockVehicle);

      const result = await vehicleService.getVehicle(1);

      expect(result).toEqual(mockVehicle);
      expect(vehicleService.fetchVehicleFromDatabase).toHaveBeenCalledWith(1);
    });

    it('should throw an error if fetching fails', async () => {
      jest.spyOn(vehicleService, 'fetchVehicleFromDatabase').mockRejectedValue(new Error('Database error'));

      await expect(vehicleService.getVehicle(1)).rejects.toThrow('Failed to fetch vehicle');
    });
  });
});