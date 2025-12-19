```typescript
// ctaFleetAgent060.test.ts
import { CTAFleetAgent060 } from './ctaFleetAgent060';
import { mock } from 'jest-mock-extended';
import { ILogger } from './interfaces/ILogger';
import { IVehicleDataProvider } from './interfaces/IVehicleDataProvider';
import { VehicleData } from './types/VehicleData';

// Mock dependencies
const mockLogger = mock<ILogger>();
const mockDataProvider = mock<IVehicleDataProvider>();

describe('CTAFleetAgent060 - Unit Tests', () => {
  let fleetAgent: CTAFleetAgent060;

  beforeEach(() => {
    jest.clearAllMocks();
    fleetAgent = new CTAFleetAgent060(mockLogger, mockDataProvider);
  });

  describe('initialize', () => {
    test('should initialize successfully with valid configuration', async () => {
      const config = { apiKey: 'test-api-key', endpoint: 'test-endpoint' };
      await expect(fleetAgent.initialize(config)).resolves.toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith('CTAFleetAgent060 initialized successfully');
    });

    test('should throw error for invalid configuration', async () => {
      const invalidConfig = { apiKey: '', endpoint: '' };
      await expect(fleetAgent.initialize(invalidConfig)).rejects.toThrow('Invalid configuration: API key and endpoint are required');
      expect(mockLogger.error).toHaveBeenCalledWith('Initialization failed: Invalid configuration');
    });
  });

  describe('getVehicleData', () => {
    test('should return vehicle data successfully', async () => {
      const mockData: VehicleData = {
        id: 'veh001',
        status: 'active',
        location: { lat: 41.8781, lng: -87.6298 },
        lastUpdated: new Date().toISOString()
      };
      mockDataProvider.fetchVehicleData.mockResolvedValue(mockData);

      const result = await fleetAgent.getVehicleData('veh001');
      expect(result).toEqual(mockData);
      expect(mockLogger.info).toHaveBeenCalledWith('Vehicle data retrieved for ID: veh001');
    });

    test('should handle data provider errors', async () => {
      const error = new Error('Data provider failed');
      mockDataProvider.fetchVehicleData.mockRejectedValue(error);

      await expect(fleetAgent.getVehicleData('veh001')).rejects.toThrow('Failed to retrieve vehicle data: Data provider failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error retrieving vehicle data for ID: veh001', error);
    });

    test('should handle invalid vehicle ID', async () => {
      await expect(fleetAgent.getVehicleData('')).rejects.toThrow('Invalid vehicle ID');
      expect(mockLogger.error).toHaveBeenCalledWith('Invalid vehicle ID provided');
    });
  });

  describe('updateVehicleStatus', () => {
    test('should update vehicle status successfully', async () => {
      mockDataProvider.updateVehicleStatus.mockResolvedValue(true);

      await expect(fleetAgent.updateVehicleStatus('veh001', 'active')).resolves.toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Vehicle status updated for ID: veh001 to active');
    });

    test('should handle update failures', async () => {
      const error = new Error('Update failed');
      mockDataProvider.updateVehicleStatus.mockRejectedValue(error);

      await expect(fleetAgent.updateVehicleStatus('veh001', 'active')).rejects.toThrow('Failed to update vehicle status: Update failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating vehicle status for ID: veh001', error);
    });
  });
});

// ctaFleetAgent060.ts
import { ILogger } from './interfaces/ILogger';
import { IVehicleDataProvider } from './interfaces/IVehicleDataProvider';
import { VehicleData } from './types/VehicleData';

export class CTAFleetAgent060 {
  private isInitialized: boolean = false;
  private config: { apiKey: string; endpoint: string } | null = null;

  constructor(
    private readonly logger: ILogger,
    private readonly dataProvider: IVehicleDataProvider
  ) {
    this.logger = logger;
    this.dataProvider = dataProvider;
  }

  /**
   * Initializes the fleet agent with provided configuration
   * @param config Configuration object containing API key and endpoint
   * @throws Error if configuration is invalid
   */
  async initialize(config: { apiKey: string; endpoint: string }): Promise<void> {
    try {
      if (!config.apiKey || !config.endpoint) {
        this.logger.error('Initialization failed: Invalid configuration');
        throw new Error('Invalid configuration: API key and endpoint are required');
      }

      this.config = config;
      this.isInitialized = true;
      this.logger.info('CTAFleetAgent060 initialized successfully');
    } catch (error) {
      this.logger.error('Initialization error', error);
      throw error;
    }
  }

  /**
   * Retrieves vehicle data for a specific vehicle ID
   * @param vehicleId Unique identifier for the vehicle
   * @returns VehicleData object containing vehicle information
   * @throws Error if vehicle ID is invalid or data retrieval fails
   */
  async getVehicleData(vehicleId: string): Promise<VehicleData> {
    try {
      if (!this.isInitialized) {
        throw new Error('Fleet agent not initialized');
      }

      if (!vehicleId) {
        this.logger.error('Invalid vehicle ID provided');
        throw new Error('Invalid vehicle ID');
      }

      const data = await this.dataProvider.fetchVehicleData(vehicleId);
      this.logger.info(`Vehicle data retrieved for ID: ${vehicleId}`);
      return data;
    } catch (error) {
      this.logger.error(`Error retrieving vehicle data for ID: ${vehicleId}`, error);
      throw new Error(`Failed to retrieve vehicle data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates the status of a specific vehicle
   * @param vehicleId Unique identifier for the vehicle
   * @param status New status to set for the vehicle
   * @throws Error if update fails or vehicle ID is invalid
   */
  async updateVehicleStatus(vehicleId: string, status: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('Fleet agent not initialized');
      }

      if (!vehicleId || !status) {
        this.logger.error('Invalid input for vehicle status update');
        throw new Error('Invalid vehicle ID or status');
      }

      await this.dataProvider.updateVehicleStatus(vehicleId, status);
      this.logger.info(`Vehicle status updated for ID: ${vehicleId} to ${status}`);
    } catch (error) {
      this.logger.error(`Error updating vehicle status for ID: ${vehicleId}`, error);
      throw new Error(`Failed to update vehicle status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// interfaces/ILogger.ts
export interface ILogger {
  info(message: string): void;
  error(message: string, error?: unknown): void;
  warn(message: string): void;
}

// interfaces/IVehicleDataProvider.ts
import { VehicleData } from '../types/VehicleData';

export interface IVehicleDataProvider {
  fetchVehicleData(vehicleId: string): Promise<VehicleData>;
  updateVehicleStatus(vehicleId: string, status: string): Promise<boolean>;
}

// types/VehicleData.ts
export interface VehicleData {
  id: string;
  status: string;
  location: {
    lat: number;
    lng: number;
  };
  lastUpdated: string;
}
```
