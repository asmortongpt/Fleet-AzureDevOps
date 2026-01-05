// Samsara Telematics Integration
// Fleet tracking, ELD compliance, driver safety

interface SamsaraConfig {
  apiToken: string;
  baseUrl: string;
}

interface SamsaraVehicle {
  id: string;
  name: string;
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
}

interface SamsaraVehicleLocation {
  id: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  time: string;
  reverseGeo?: {
    formattedLocation: string;
  };
}

export class SamsaraService {
  private config: SamsaraConfig;

  constructor() {
    this.config = {
      apiToken: process.env.SAMSARA_API_TOKEN || '',
      baseUrl: 'https://api.samsara.com',
    };
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Samsara API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getVehicles(): Promise<SamsaraVehicle[]> {
    const data = await this.request('/fleet/vehicles');
    return data.data || [];
  }

  async getVehicleLocations(): Promise<SamsaraVehicleLocation[]> {
    const data = await this.request('/fleet/vehicles/locations');
    return data.data || [];
  }

  async getVehicleStats(vehicleId: string, startMs: number, endMs: number): Promise<any> {
    const data = await this.request(
      `/fleet/vehicles/${vehicleId}/stats?startMs=${startMs}&endMs=${endMs}&types=engineStates,fuelPercents,obdOdometerMeters`
    );
    return data.data;
  }

  async getDriverSafetyScores(): Promise<any[]> {
    const data = await this.request('/fleet/drivers/safety-scores');
    return data.data || [];
  }

  async syncVehicleData(): Promise<void> {
    const locations = await this.getVehicleLocations();

    for (const location of locations) {
      await fetch('/api/v1/vehicles/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: location.id,
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          heading: location.heading,
          timestamp: location.time,
          address: location.reverseGeo?.formattedLocation,
          source: 'samsara',
        }),
      });
    }
  }
}

export const samsaraService = new SamsaraService();
