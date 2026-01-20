import { Logger } from 'winston';

import { AssetLocation } from '../../../domain/telematics/entities/AssetLocation';
import { ITelematicsProviderAdapter } from '../../../domain/telematics/interfaces/ITelematicsProviderAdapter';
import { TelematicsRepository } from '../../../repositories/TelematicsRepository';


export interface ITelematicsIngestionService {
  ingestLatestPositions(): Promise<void>;
  ingestDeviceHistory(deviceId: string, startDate: Date, endDate: Date): Promise<void>;
}

export class TelematicsIngestionService implements ITelematicsIngestionService {
  private readonly adapters: Map<string, ITelematicsProviderAdapter> = new Map();
  private tenantId: number = 1; // TODO: Get from context or provider

  constructor(
    private readonly repository: TelematicsRepository,
    private readonly logger: Logger,
    adapters: ITelematicsProviderAdapter[]
  ) {
    adapters.forEach(adapter => {
      this.adapters.set(adapter.providerName, adapter);
    });
  }

  async ingestLatestPositions(): Promise<void> {
    try {
      const providers = await this.repository.getActiveProviders();

      for (const provider of providers) {
        const adapter = this.adapters.get(provider.providerType);
        if (!adapter) {
          this.logger.warn(`No adapter found for provider type: ${provider.providerType}`);
          continue;
        }

        const devices = await this.repository.getDevicesByProvider(provider.id, this.tenantId);
        if (devices.length === 0) {
          continue;
        }

        this.logger.info(`Ingesting positions for ${devices.length} devices from ${provider.name}`);

        try {
          const positions = await adapter.getLatestPositions(devices as any);

          await this.repository.insertPositionEvents(positions as any, this.tenantId);

          const locationUpdates = positions.map(pos => 
            AssetLocation.fromPositionData(
              pos.assetId,
              {
                latitude: Number(pos.latitude),
                longitude: Number(pos.longitude),
                speed: pos.speed ? Number(pos.speed) : undefined,
                heading: pos.heading ? Number(pos.heading) : undefined,
                altitude: pos.altitude ? Number(pos.altitude) : undefined,
                accuracy: pos.accuracy ? Number(pos.accuracy) : undefined
              },
              provider.providerType,
              pos.timestamp
            )
          );

          await this.repository.upsertAssetLocations(devices.map((d: any) => d.vehicle_id), this.tenantId);
          await this.repository.updateDevicesSyncTime(devices.map((d: any) => d.id), this.tenantId);

          this.logger.info(`Successfully ingested ${positions.length} positions from ${provider.name}`);
        } catch (error) {
          this.logger.error(`Error ingesting from ${provider.name}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in telematics ingestion:', error);
      throw error;
    }
  }

  async ingestDeviceHistory(deviceId: string, startDate: Date, endDate: Date): Promise<void> {
    const device = await this.repository.getDeviceById(Number(deviceId), this.tenantId);
    if (!device) throw new Error(`Device not found: ${deviceId}`);

    const provider = await this.repository.getProviderById(device.provider_id);
    if (!provider) throw new Error(`Provider not found for device: ${deviceId}`);

    const adapter = this.adapters.get(provider.providerType);
    if (!adapter) throw new Error(`No adapter for provider type: ${provider.providerType}`);

    this.logger.info(`Fetching history for device ${deviceId} from ${startDate} to ${endDate}`);
    const positions = await adapter.getPositionHistory((device as any).externalDeviceId, startDate, endDate);
    await this.repository.insertPositionEvents(positions as any, this.tenantId);
    this.logger.info(`Ingested ${positions.length} historical positions for device ${deviceId}`);
  }
}
