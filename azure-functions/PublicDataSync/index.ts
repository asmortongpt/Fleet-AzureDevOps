import { AzureFunction, Context } from '@azure/functions';
import axios from 'axios';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Azure Function: Public Data Sync
 * Syncs traffic incidents, weather, tolls, charging stations hourly
 * Triggered by: Timer (0 0 * * * *)
 */
const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  context.log('Public Data Sync started:', new Date().toISOString());

  const results = {
    incidents: 0,
    weather: 0,
    tolls: 0,
    chargingStations: 0,
    restAreas: 0,
    weighStations: 0,
  };

  try {
    // Sync Traffic Incidents
    await syncTrafficIncidents(context, results);

    // Sync Weather Stations
    await syncWeatherStations(context, results);

    // Sync EV Charging Stations
    await syncChargingStations(context, results);

    // Sync Rest Areas (static data, update quarterly)
    await syncRestAreas(context, results);

    // Sync Weigh Stations (static data, update monthly)
    await syncWeighStations(context, results);

    context.log('Public Data Sync completed:', results);
    context.bindings.syncLog = {
      timestamp: new Date().toISOString(),
      results,
    };

  } catch (error) {
    context.log.error('Public Data Sync failed:', error);
    throw error;
  }
};

/**
 * Sync traffic incidents from Florida 511
 */
async function syncTrafficIncidents(context: Context, results: any): Promise<void> {
  try {
    const FL511_API_BASE = process.env.FL511_API_BASE || 'https://fl511.com/api';
    const FL511_API_KEY = process.env.FL511_API_KEY || '';

    const response = await axios.get(`${FL511_API_BASE}/incidents`, {
      params: {
        key: FL511_API_KEY,
        format: 'json',
      },
      timeout: 30000,
    });

    const incidents = response.data.incidents || [];

    for (const incident of incidents) {
      const { id, type, description, location, startTime, endTime, severity } = incident;

      if (!location?.latitude || !location?.longitude) continue;

      await pool.query(
        `INSERT INTO traffic_incidents (
          incident_id, type, description, latitude, longitude,
          road, county, start_time, end_time, severity,
          impact, lanes_affected, delay_minutes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (incident_id)
        DO UPDATE SET
          description = EXCLUDED.description,
          end_time = EXCLUDED.end_time,
          severity = EXCLUDED.severity,
          updated_at = NOW()`,
        [
          id,
          type || 'other',
          description || 'Unknown incident',
          location.latitude,
          location.longitude,
          incident.roadway || '',
          incident.county || '',
          startTime ? new Date(startTime) : new Date(),
          endTime ? new Date(endTime) : null,
          severity || 'minor',
          incident.impact || '',
          incident.lanesAffected || 0,
          incident.delayMinutes || 0,
          JSON.stringify(incident),
        ]
      );
      results.incidents++;
    }

    context.log(`Synced ${results.incidents} traffic incidents`);
  } catch (err) {
    context.log.error('Error syncing traffic incidents:', err);
  }
}

/**
 * Sync weather stations
 */
async function syncWeatherStations(context: Context, results: any): Promise<void> {
  try {
    // Note: Use appropriate weather API (NOAA, WeatherUnderground, etc.)
    const WEATHER_API_URL = process.env.WEATHER_API_URL || '';
    const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';

    if (!WEATHER_API_URL) {
      context.log.warn('Weather API not configured, skipping');
      return;
    }

    const response = await axios.get(WEATHER_API_URL, {
      params: { key: WEATHER_API_KEY },
      timeout: 30000,
    });

    const stations = response.data.stations || [];

    for (const station of stations) {
      await pool.query(
        `INSERT INTO weather_stations (
          station_id, name, latitude, longitude,
          temperature, conditions, wind_speed, visibility,
          road_conditions, metadata, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (station_id)
        DO UPDATE SET
          temperature = EXCLUDED.temperature,
          conditions = EXCLUDED.conditions,
          wind_speed = EXCLUDED.wind_speed,
          visibility = EXCLUDED.visibility,
          road_conditions = EXCLUDED.road_conditions,
          last_updated = NOW()`,
        [
          station.id,
          station.name,
          station.latitude,
          station.longitude,
          station.temperature,
          station.conditions,
          station.windSpeed,
          station.visibility,
          station.roadConditions || 'unknown',
          JSON.stringify(station),
        ]
      );
      results.weather++;
    }

    context.log(`Synced ${results.weather} weather stations`);
  } catch (err) {
    context.log.error('Error syncing weather stations:', err);
  }
}

/**
 * Sync EV charging stations from Department of Energy API
 */
async function syncChargingStations(context: Context, results: any): Promise<void> {
  try {
    const DOE_API_URL = 'https://developer.nrel.gov/api/alt-fuel-stations/v1.json';
    const DOE_API_KEY = process.env.DOE_API_KEY || '';

    const response = await axios.get(DOE_API_URL, {
      params: {
        api_key: DOE_API_KEY,
        state: 'FL',
        fuel_type: 'ELEC',
        status: 'E',
        limit: 'all',
      },
      timeout: 30000,
    });

    const stations = response.data.fuel_stations || [];

    for (const station of stations) {
      await pool.query(
        `INSERT INTO ev_charging_stations (
          station_id, name, address, latitude, longitude,
          operator, ports, levels, max_power, pricing,
          access, available_24x7, metadata, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT (station_id)
        DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          ports = EXCLUDED.ports,
          levels = EXCLUDED.levels,
          max_power = EXCLUDED.max_power,
          pricing = EXCLUDED.pricing,
          access = EXCLUDED.access,
          available_24x7 = EXCLUDED.available_24x7,
          last_updated = NOW()`,
        [
          station.id.toString(),
          station.station_name,
          station.street_address,
          station.latitude,
          station.longitude,
          station.ev_network || 'Unknown',
          station.ev_connector_types?.length || 1,
          station.ev_level1_evse_num > 0
            ? ['level1']
            : station.ev_dc_fast_num > 0
            ? ['dcfast']
            : ['level2'],
          station.ev_dc_fast_num > 0 ? 50 : 7.2,
          station.ev_pricing || 'Unknown',
          station.access_code === 'public' ? 'public' : 'restricted',
          station.access_days_time?.includes('24 hours') || false,
          JSON.stringify(station),
        ]
      );
      results.chargingStations++;
    }

    context.log(`Synced ${results.chargingStations} EV charging stations`);
  } catch (err) {
    context.log.error('Error syncing charging stations:', err);
  }
}

/**
 * Sync rest areas (static data)
 */
async function syncRestAreas(context: Context, results: any): Promise<void> {
  // Static data - would be loaded from a curated dataset
  context.log('Rest areas sync skipped (static data)');
}

/**
 * Sync weigh stations (static data)
 */
async function syncWeighStations(context: Context, results: any): Promise<void> {
  // Static data - would be loaded from FDOT dataset
  context.log('Weigh stations sync skipped (static data)');
}

export default timerTrigger;
