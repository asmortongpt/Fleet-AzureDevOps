/**
 * Samsara Telematics Service
 * Real-time fleet tracking, driver safety, and compliance
 */

import axios, { AxiosInstance } from 'axios';
import { Pool } from 'pg';

const SAMSARA_API_TOKEN = process.env.SAMSARA_API_TOKEN;
const SAMSARA_BASE_URL = 'https://api.samsara.com';

interface SamsaraVehicle {
  id: string;
  name: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  externalIds?: Record<string, string>;
}

interface SamsaraLocation {
  id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  time: string;
  reverseGeo?: {
    formattedLocation?: string;
  };
}

interface SamsaraVehicleStats {
  engineStates?: Array<{ value: string; time: string }>;
  obdOdometerMeters?: Array<{ value: number; time: string }>;
  fuelPercents?: Array<{ value: number; time: string }>;
  batteryMillivolts?: Array<{ value: number; time: string }>;
}

interface SamsaraSafetyEvent {
  id: string;
  vehicleId: string;
  driverId?: string;
  type: string;
  severity?: string;
  location: {
    latitude: number;
    longitude: number;
    reverseGeo?: {
      formattedLocation?: string;
    };
  };
  speed?: number;
  time: string;
  accelerationMetersPerSecondSquared?: number;
}

class SamsaraService {
  private api: AxiosInstance;
  private db: Pool;

  constructor(db: Pool) {
    if (!SAMSARA_API_TOKEN) {
      throw new Error('SAMSARA_API_TOKEN environment variable is required');
    }

    this.api = axios.create({
      baseURL: SAMSARA_BASE_URL,
      headers: {
        'Authorization': `Bearer ${SAMSARA_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.db = db;
  }

  /**
   * Test connection to Samsara API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/fleet/vehicles', {
        params: { limit: 1 }
      });
      console.log(`✅ Samsara connected: ${response.data.data?.length || 0} vehicles accessible`);
      return true;
    } catch (error: any) {
      console.error('❌ Samsara connection failed:', error.message);
      return false;
    }
  }

  /**
   * Get all vehicles from Samsara
   */
  async getVehicles(limit: number = 100): Promise<SamsaraVehicle[]> {
    const response = await this.api.get('/fleet/vehicles', {
      params: { limit: Math.min(limit, 512) } // Samsara max is 512
    });

    return response.data.data.map((v: any) => ({
      id: v.id,
      name: v.name,
      vin: v.vin,
      make: v.make,
      model: v.model,
      year: v.year,
      licensePlate: v.licensePlate,
      externalIds: v.externalIds
    }));
  }

  /**
   * Get real-time location for all vehicles
   */
  async getVehicleLocations(): Promise<SamsaraLocation[]> {
    const response = await this.api.get('/fleet/vehicles/locations', {
      params: { types: 'Vehicle' }
    });

    return response.data.data.map((loc: any) => ({
      id: loc.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      heading: loc.heading,
      speed: loc.speed,
      time: loc.time,
      reverseGeo: loc.reverseGeo
    }));
  }

  /**
   * Get vehicle stats (odometer, fuel, engine state, etc.)
   */
  async getVehicleStats(vehicleId: string): Promise<SamsaraVehicleStats> {
    const response = await this.api.get('/fleet/vehicles/stats', {
      params: {
        vehicleIds: vehicleId,
        types: 'engineStates,obdOdometerMeters,fuelPercents,batteryMillivolts'
      }
    });

    return response.data.data[0] || {};
  }

  /**
   * Get harsh driving events
   */
  async getSafetyEvents(startTime: string, endTime: string): Promise<SamsaraSafetyEvent[]> {
    const response = await this.api.get('/fleet/drivers/safety/events', {
      params: {
        startTime,
        endTime,
        types: 'harshAcceleration,harshBraking,harshTurning,speeding,distractedDriving'
      }
    });

    return response.data.data || [];
  }

  /**
   * Request dash cam video clip
   */
  async requestVideo(vehicleId: string, startTime: string, durationSeconds: number = 30) {
    const response = await this.api.post('/fleet/vehicles/camera/video/request', {
      vehicleId,
      startTime,
      durationSeconds: Math.min(durationSeconds, 60), // Max 60 seconds
      types: ['roadFacing', 'driverFacing']
    });

    return {
      requestId: response.data.data.id,
      status: 'pending',
      expiresAt: response.data.data.expiresAt
    };
  }

  /**
   * Check video request status and get download URL
   */
  async getVideoStatus(requestId: string) {
    const response = await this.api.get(`/fleet/vehicles/camera/video/${requestId}`);

    const data = response.data.data;
    return {
      status: data.state,
      downloadUrl: data.state === 'ready' ? data.downloadUrl : null,
      thumbnailUrl: data.state === 'ready' ? data.thumbnailUrl : null
    };
  }

  /**
   * Sync all vehicles from Samsara to database
   */
  async syncVehicles(): Promise<number> {
    console.log('🔄 Syncing vehicles from Samsara...');

    const samsaraVehicles = await this.getVehicles();
    let synced = 0;

    for (const vehicle of samsaraVehicles) {
      try {
        // Check if vehicle already exists in our database by VIN or external ID
        const existing = await this.db.query(
          'SELECT id FROM vehicles WHERE vin = $1 LIMIT 1',
          [vehicle.vin]
        );

        let vehicleId: number;

        if (existing.rows.length > 0) {
          vehicleId = existing.rows[0].id;
        } else {
          // Create new vehicle
          const result = await this.db.query(
            `INSERT INTO vehicles (name, vin, make, model, year, license_plate, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'active')
             RETURNING id`,
            [vehicle.name, vehicle.vin, vehicle.make, vehicle.model, vehicle.year, vehicle.licensePlate]
          );
          vehicleId = result.rows[0].id;
        }

        // Create or update telematics connection
        await this.db.query(
          `INSERT INTO vehicle_telematics_connections
           (vehicle_id, provider_id, external_vehicle_id, metadata, last_sync_at)
           VALUES ($1, (SELECT id FROM telematics_providers WHERE name = 'samsara'), $2, $3, NOW())
           ON CONFLICT (vehicle_id, provider_id)
           DO UPDATE SET
             external_vehicle_id = EXCLUDED.external_vehicle_id,
             metadata = EXCLUDED.metadata,
             last_sync_at = NOW(),
             sync_status = 'active'`,
          [vehicleId, vehicle.id, JSON.stringify(vehicle)]
        );

        synced++;
      } catch (error: any) {
        console.error(`Error syncing vehicle ${vehicle.name}:`, error.message);
      }
    }

    console.log(`✅ Synced ${synced} vehicles from Samsara`);
    return synced;
  }

  /**
   * Sync telemetry data for all connected vehicles
   */
  async syncTelemetry(): Promise<number> {
    console.log('🔄 Syncing telemetry from Samsara...');

    // Get all Samsara-connected vehicles
    const connections = await this.db.query(
      `SELECT vtc.vehicle_id, vtc.external_vehicle_id
       FROM vehicle_telematics_connections vtc
       JOIN telematics_providers tp ON vtc.provider_id = tp.id
       WHERE tp.name = 'samsara' AND vtc.sync_status = 'active'`
    );

    if (connections.rows.length === 0) {
      console.log('No Samsara vehicles to sync');
      return 0;
    }

    // Get all locations at once
    const locations = await this.getVehicleLocations();
    const locationMap = new Map(locations.map(loc => [loc.id, loc]));

    let synced = 0;

    for (const conn of connections.rows) {
      try {
        const location = locationMap.get(conn.external_vehicle_id);
        if (!location) continue;

        // Get vehicle stats
        const stats = await this.getVehicleStats(conn.external_vehicle_id);

        const odometer = stats.obdOdometerMeters?.[0]?.value
          ? stats.obdOdometerMeters[0].value / 1609.34 // Convert meters to miles
          : null;

        const fuel = stats.fuelPercents?.[0]?.value || null;
        const engineState = stats.engineStates?.[0]?.value || null;
        const battery12v = stats.batteryMillivolts?.[0]?.value
          ? stats.batteryMillivolts[0].value / 1000 // Convert mV to V
          : null;

        // Insert telemetry record
        await this.db.query(
          `INSERT INTO vehicle_telemetry
           (vehicle_id, provider_id, timestamp, latitude, longitude, heading, speed_mph, address,
            odometer_miles, fuel_percent, battery_voltage_12v, engine_state)
           VALUES ($1, (SELECT id FROM telematics_providers WHERE name = 'samsara'),
                   $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            conn.vehicle_id,
            location.time,
            location.latitude,
            location.longitude,
            location.heading,
            location.speed,
            location.reverseGeo?.formattedLocation,
            odometer,
            fuel,
            battery12v,
            engineState
          ]
        );

        // Update last sync time
        await this.db.query(
          'UPDATE vehicle_telematics_connections SET last_sync_at = NOW() WHERE vehicle_id = $1',
          [conn.vehicle_id]
        );

        synced++;
      } catch (error: any) {
        console.error(`Error syncing telemetry for vehicle ${conn.vehicle_id}:`, error.message);

        // Mark connection as error
        await this.db.query(
          'UPDATE vehicle_telematics_connections SET sync_status = $1, sync_error = $2 WHERE vehicle_id = $3',
          ['error', error.message, conn.vehicle_id]
        );
      }
    }

    console.log(`✅ Synced telemetry for ${synced} vehicles`);
    return synced;
  }

  /**
   * Sync safety events from the last hour
   */
  async syncSafetyEvents(): Promise<number> {
    console.log('🔄 Syncing safety events from Samsara...');

    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const now = new Date().toISOString();

    const events = await this.getSafetyEvents(oneHourAgo, now);
    let synced = 0;

    for (const event of events) {
      try {
        // Get our vehicle_id from Samsara's vehicle ID
        const vehicleResult = await this.db.query(
          `SELECT vehicle_id FROM vehicle_telematics_connections
           WHERE external_vehicle_id = $1
           AND provider_id = (SELECT id FROM telematics_providers WHERE name = 'samsara')`,
          [event.vehicleId]
        );

        if (vehicleResult.rows.length === 0) continue;

        const vehicleId = vehicleResult.rows[0].vehicle_id;

        // Calculate G-force
        const gForce = event.accelerationMetersPerSecondSquared
          ? event.accelerationMetersPerSecondSquared / 9.81
          : null;

        // Insert safety event
        await this.db.query(
          `INSERT INTO driver_safety_events
           (external_event_id, vehicle_id, provider_id, event_type, severity,
            latitude, longitude, address, speed_mph, g_force, timestamp)
           VALUES ($1, $2, (SELECT id FROM telematics_providers WHERE name = 'samsara'),
                   $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (external_event_id) DO NOTHING`,
          [
            event.id,
            vehicleId,
            event.type,
            event.severity,
            event.location.latitude,
            event.location.longitude,
            event.location.reverseGeo?.formattedLocation,
            event.speed,
            gForce,
            event.time
          ]
        );

        synced++;
      } catch (error: any) {
        console.error(`Error syncing safety event ${event.id}:`, error.message);
      }
    }

    console.log(`✅ Synced ${synced} safety events`);
    return synced;
  }

  /**
   * Full sync: vehicles, telemetry, and safety events
   */
  async fullSync(): Promise<{ vehicles: number; telemetry: number; events: number }> {
    console.log('🔄 Starting full Samsara sync...');

    const vehicles = await this.syncVehicles();
    const telemetry = await this.syncTelemetry();
    const events = await this.syncSafetyEvents();

    console.log(`✅ Full sync complete: ${vehicles} vehicles, ${telemetry} telemetry records, ${events} events`);

    return { vehicles, telemetry, events };
  }
}

export default SamsaraService;
