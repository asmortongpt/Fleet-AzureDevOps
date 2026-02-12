/**
 * Samsara Telematics Service
 * Stub implementation for TypeScript compilation
 */

export interface SamsaraVehicle {
  id: string;
  name: string;
  vin: string;
}

export interface VehicleLocation {
  id: string;
  name?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  timestamp?: string;
}

export class SamsaraService {
  private static instance: SamsaraService;

  static getInstance(): SamsaraService {
    if (!SamsaraService.instance) {
      SamsaraService.instance = new SamsaraService();
    }
    return SamsaraService.instance;
  }

  async getVehicles(): Promise<SamsaraVehicle[]> {
    return [];
  }

  async getVehicleLocations(): Promise<VehicleLocation[]> {
    return [];
  }

  async getVehicleData(vehicleId: string): Promise<any> {
    return null;
  }
}

// Export singleton instance
export const samsaraService = SamsaraService.getInstance();

export default SamsaraService;
