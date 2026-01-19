/**
 * Geotab Telematics Service
 * Stub implementation for TypeScript compilation
 */

export interface GeotabDevice {
  id: string;
  name: string;
  serialNumber: string;
}

export class GeotabService {
  static getInstance(): GeotabService {
    return new GeotabService();
  }

  async getDevices(): Promise<GeotabDevice[]> {
    return [];
  }

  async getDeviceData(deviceId: string): Promise<any> {
    return null;
  }
}

export default GeotabService;
