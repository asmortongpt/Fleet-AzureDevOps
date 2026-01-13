export enum TelematicsProviderType {
  SAMSARA = 'samsara',
  GEOTAB = 'geotab',
  VERIZON = 'verizon',
  CUSTOM = 'custom'
}

export interface TelematicsConfig {
  apiKey: string;
  baseUrl: string;
  refreshInterval: number;
  enabled: boolean;
}

export interface PositionData {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
}
