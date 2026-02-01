// Geotab Telematics Integration
// Real-time GPS tracking, diagnostics, and fleet data

interface GeotabConfig {
  server: string;
  database: string;
  username: string;
  password: string;
  sessionId?: string;
}

interface GeotabDevice {
  id: string;
  name: string;
  serialNumber: string;
  deviceType: string;
  vehicleIdentificationNumber: string;
}

interface GeotabLocation {
  latitude: number;
  longitude: number;
  speed: number;
  bearing: number;
  dateTime: string;
}

export class GeotabService {
  private config: GeotabConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      server: process.env.GEOTAB_SERVER || 'my.geotab.com',
      database: process.env.GEOTAB_DATABASE || '',
      username: process.env.GEOTAB_USERNAME || '',
      password: process.env.GEOTAB_PASSWORD || '',
    };
    this.baseUrl = `https://${this.config.server}/apiv1`;
  }

  async authenticate(): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Authenticate',
        params: {
          database: this.config.database,
          userName: this.config.username,
          password: this.config.password,
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Geotab auth failed: ${data.error.message}`);
    }

    this.config.sessionId = data.result.credentials.sessionId;
    return data.result.credentials.sessionId;
  }

  async getDevices(): Promise<GeotabDevice[]> {
    if (!this.config.sessionId) {
      await this.authenticate();
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Get',
        params: {
          typeName: 'Device',
          credentials: {
            database: this.config.database,
            sessionId: this.config.sessionId,
          },
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      // Session might have expired, re-authenticate
      if (data.error.code === 'InvalidSessionException') {
        await this.authenticate();
        return this.getDevices();
      }
      throw new Error(`Geotab getDevices failed: ${data.error.message}`);
    }

    return data.result;
  }

  async getDeviceLocation(deviceId: string): Promise<GeotabLocation | null> {
    if (!this.config.sessionId) {
      await this.authenticate();
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Get',
        params: {
          typeName: 'LogRecord',
          search: {
            deviceSearch: { id: deviceId },
          },
          resultsLimit: 1,
          credentials: {
            database: this.config.database,
            sessionId: this.config.sessionId,
          },
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      if (data.error.code === 'InvalidSessionException') {
        await this.authenticate();
        return this.getDeviceLocation(deviceId);
      }
      throw new Error(`Geotab getLocation failed: ${data.error.message}`);
    }

    const logRecord = data.result[0];
    if (!logRecord) return null;

    return {
      latitude: logRecord.latitude,
      longitude: logRecord.longitude,
      speed: logRecord.speed,
      bearing: logRecord.bearing,
      dateTime: logRecord.dateTime,
    };
  }

  async getDiagnostics(deviceId: string, diagnosticType: string): Promise<any[]> {
    if (!this.config.sessionId) {
      await this.authenticate();
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Get',
        params: {
          typeName: 'StatusData',
          search: {
            deviceSearch: { id: deviceId },
            diagnosticSearch: { diagnosticType },
          },
          resultsLimit: 100,
          credentials: {
            database: this.config.database,
            sessionId: this.config.sessionId,
          },
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      if (data.error.code === 'InvalidSessionException') {
        await this.authenticate();
        return this.getDiagnostics(deviceId, diagnosticType);
      }
      throw new Error(`Geotab getDiagnostics failed: ${data.error.message}`);
    }

    return data.result;
  }

  async syncVehicleLocations(): Promise<void> {
    const devices = await this.getDevices();

    for (const device of devices) {
      const location = await this.getDeviceLocation(device.id);

      if (location) {
        // Update database with latest location
        await fetch('/api/v1/vehicles/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vin: device.vehicleIdentificationNumber,
            latitude: location.latitude,
            longitude: location.longitude,
            speed: location.speed,
            bearing: location.bearing,
            timestamp: location.dateTime,
            source: 'geotab',
          }),
        });
      }
    }
  }
}

export const geotabService = new GeotabService();
