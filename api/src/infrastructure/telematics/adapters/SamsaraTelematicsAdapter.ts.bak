import axios, { AxiosInstance } from 'axios';
import { ITelematicsProviderAdapter } from '../../../domain/telematics/interfaces/ITelematicsProviderAdapter';
import { TelematicsDevice } from '../../../domain/telematics/entities/TelematicsDevice';
import { AssetPositionEvent } from '../../../domain/telematics/entities/AssetPositionEvent';
import { Logger } from 'winston';

export interface SamsaraConfig {
  apiKey: string;
  baseUrl?: string;
}

interface SamsaraVehicleLocation {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  };
  odometerMeters?: number;
  engineStates?: Array<{ value: string; timeMs: number }>;
  time: string;
}

export class SamsaraTelematicsAdapter implements ITelematicsProviderAdapter {
  readonly providerName = 'samsara';
  private readonly client: AxiosInstance;

  constructor(private readonly config: SamsaraConfig, private readonly logger: Logger) {
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.samsara.com',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async getLatestPositions(devices: TelematicsDevice[], ct?: AbortSignal): Promise<AssetPositionEvent[]> {
    try {
      const vehicleIds = devices.map(d => d.externalDeviceId);
      const response = await this.client.get<{ data: SamsaraVehicleLocation[] }>(
        '/fleet/vehicles/locations',
        { params: { vehicleIds: vehicleIds.join(',') }, signal: ct }
      );

      const deviceMap = new Map(devices.map(d => [d.externalDeviceId, d]));
      const events: AssetPositionEvent[] = [];

      for (const location of response.data.data) {
        const device = deviceMap.get(location.id);
        if (!device) continue;

        const event = AssetPositionEvent.create(
          device.assetId,
          device.id,
          {
            latitude: location.location.latitude,
            longitude: location.location.longitude,
            speed: location.location.speed ? location.location.speed * 2.23694 : undefined,
            heading: location.location.heading,
            accuracy: 10
          },
          new Date(location.time),
          {
            odometer: location.odometerMeters ? location.odometerMeters / 1609.34 : undefined,
            metadata: {
              vehicleId: location.id,
              vehicleName: location.name,
              engineStates: location.engineStates
            }
          }
        );

        events.push(event);
      }

      return events;
    } catch (error: any) {
      this.logger.error('Samsara API error:', error);
      throw new Error(`Failed to fetch positions from Samsara: ${error.message}`);
    }
  }

  async getPositionHistory(deviceId: string, startTime: Date, endTime: Date, ct?: AbortSignal): Promise<AssetPositionEvent[]> {
    try {
      const response = await this.client.get(`/fleet/vehicles/${deviceId}/locations`, {
        params: { startTime: startTime.toISOString(), endTime: endTime.toISOString() },
        signal: ct
      });
      return [];
    } catch (error: any) {
      this.logger.error('Samsara history API error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/fleet/vehicles', { params: { limit: 1 } });
      return true;
    } catch (error) {
      this.logger.error('Samsara connection test failed:', error);
      return false;
    }
  }

  async getDeviceInfo(externalDeviceId: string): Promise<any> {
    const response = await this.client.get(`/fleet/vehicles/${externalDeviceId}`);
    return response.data;
  }
}
