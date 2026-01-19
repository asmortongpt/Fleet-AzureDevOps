/**
 * Samsara Telematics Service
 * Stub implementation for TypeScript compilation
 */

export interface SamsaraVehicle {
  id: string;
  name: string;
  vin: string;
}

export class SamsaraService {
  static getInstance(): SamsaraService {
    return new SamsaraService();
  }

  async getVehicles(): Promise<SamsaraVehicle[]> {
    return [];
  }

  async getVehicleData(vehicleId: string): Promise<any> {
    return null;
  }
}

export default SamsaraService;
