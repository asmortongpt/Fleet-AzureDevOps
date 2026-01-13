import { PositionData } from '../types/telematics.types';

export class AssetLocation {
  constructor(
    public readonly id: string,
    public assetId: string,
    public latitude: number,
    public longitude: number,
    public speed: number | null,
    public heading: number | null,
    public altitude: number | null,
    public accuracy: number | null,
    public source: string,
    public timestamp: Date,
    public updatedAt: Date = new Date()
  ) {}

  static fromPositionData(
    assetId: string,
    data: PositionData,
    source: string,
    timestamp: Date
  ): AssetLocation {
    return new AssetLocation(
      crypto.randomUUID(),
      assetId,
      data.latitude,
      data.longitude,
      data.speed ?? null,
      data.heading ?? null,
      data.altitude ?? null,
      data.accuracy ?? null,
      source,
      timestamp
    );
  }

  toGeoJSON(): any {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [this.longitude, this.latitude]
      },
      properties: {
        assetId: this.assetId,
        speed: this.speed,
        heading: this.heading,
        timestamp: this.timestamp.toISOString()
      }
    };
  }

  distanceTo(other: AssetLocation): number {
    const R = 3959; // Earth radius in miles
    const lat1 = this.latitude * Math.PI / 180;
    const lat2 = other.latitude * Math.PI / 180;
    const dLat = (other.latitude - this.latitude) * Math.PI / 180;
    const dLon = (other.longitude - this.longitude) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
