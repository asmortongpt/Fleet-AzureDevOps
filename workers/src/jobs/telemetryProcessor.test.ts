import { processTelemetry } from './telemetryProcessor';
import { telemetrySchema } from '../schemas/telemetry.schema';
import { pool } from '../db';
import { logger } from '../logger';

jest.mock('../db', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('processTelemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process valid telemetry data', async () => {
    const job = {
      data: telemetrySchema.parse({
        vehicleId: 1,
        timestamp: '2023-10-01T12:00:00Z',
        latitude: 40.7128,
        longitude: -74.0060,
        speed: 60,
        fuelLevel: 75,
        tenantId: 100
      })
    };

    await processTelemetry(job);

    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO vehicle_telemetry (vehicle_id, tenant_id, latitude, longitude, speed, fuel_level) VALUES ($1, $2, $3, $4, $5, $6)',
      [1, 100, 40.7128, -74.0060, 60, 75]
    );
    expect(logger.info).toHaveBeenCalledWith('Telemetry processed', { vehicleId: 1 });
  });

  it('should throw an error for invalid telemetry data', async () => {
    const job = {
      data: {
        vehicleId: -1,
        timestamp: 'invalid',
        latitude: 100,
        longitude: 200,
        speed: -10,
        fuelLevel: 150,
        tenantId: -100
      }
    };

    await expect(processTelemetry(job)).rejects.toThrow('Invalid telemetry data');
    expect(logger.error).toHaveBeenCalled();
  });
});