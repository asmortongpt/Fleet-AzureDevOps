/**
 * Geotab Telematics Service
 * Stub implementation for TypeScript compilation
 */

export interface GeotabDevice {
  id: string;
  name: string;
  serialNumber: string;
  vehicleIdentificationNumber?: string;
}

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  timestamp?: string;
}

export class GeotabService {
  private static instance: GeotabService;

  static getInstance(): GeotabService {
    if (!GeotabService.instance) {
      GeotabService.instance = new GeotabService();
    }
    return GeotabService.instance;
  }

  async getDevices(): Promise<GeotabDevice[]> {
    return [];
  }

  async getDeviceLocation(deviceId: string): Promise<DeviceLocation | null> {
    return null;
  }

  async getDeviceData(deviceId: string): Promise<any> {
    return null;
  }
}

// Export singleton instance
export const geotabService = GeotabService.getInstance();

export default GeotabService;
