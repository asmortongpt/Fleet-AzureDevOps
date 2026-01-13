import { AssetPositionEvent } from '../entities/AssetPositionEvent';
import { TelematicsDevice } from '../entities/TelematicsDevice';

export interface ITelematicsProviderAdapter {
  readonly providerName: string;

  getLatestPositions(
    devices: TelematicsDevice[],
    ct?: AbortSignal
  ): Promise<AssetPositionEvent[]>;

  getPositionHistory(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    ct?: AbortSignal
  ): Promise<AssetPositionEvent[]>;

  testConnection(): Promise<boolean>;

  getDeviceInfo(externalDeviceId: string): Promise<any>;
}
