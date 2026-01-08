import { PositionData } from '../types/telematics.types';

export class AssetPositionEvent {
  constructor(
    public readonly id: string,
    public assetId: string,
    public deviceId: string,
    public latitude: number,
    public longitude: number,
    public speed: number | null,
    public heading: number | null,
    public altitude: number | null,
    public accuracy: number | null,
    public odometer: number | null,
    public engineHours: number | null,
    public fuelLevel: number | null,
    public timestamp: Date,
    public metadata?: Record<string, any>,
    public createdAt: Date = new Date()
  ) {}

  static create(
    assetId: string,
    deviceId: string,
    data: PositionData,
    timestamp: Date,
    additionalData?: {
      odometer?: number;
      engineHours?: number;
      fuelLevel?: number;
      metadata?: Record<string, any>;
    }
  ): AssetPositionEvent {
    return new AssetPositionEvent(
      crypto.randomUUID(),
      assetId,
      deviceId,
      data.latitude,
      data.longitude,
      data.speed ?? null,
      data.heading ?? null,
      data.altitude ?? null,
      data.accuracy ?? null,
      additionalData?.odometer ?? null,
      additionalData?.engineHours ?? null,
      additionalData?.fuelLevel ?? null,
      timestamp,
      additionalData?.metadata
    );
  }
}
