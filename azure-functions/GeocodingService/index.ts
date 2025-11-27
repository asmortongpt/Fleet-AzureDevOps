import { AzureFunction, Context } from '@azure/functions';
import axios from 'axios';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Azure Function: Geocoding Service
 * Reverse geocodes camera/incident locations to add address data
 * Triggered by: Timer (0 0 2 * * *) - daily at 2 AM
 */
const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  context.log('Geocoding Service started:', new Date().toISOString());

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
  const BATCH_SIZE = 50;
  let geocoded = 0;
  let errors = 0;

  try {
    // Geocode traffic cameras without address data
    const camerasQuery = `
      SELECT id, latitude, longitude, name
      FROM traffic_cameras
      WHERE metadata->>'address' IS NULL
      AND status = 'active'
      LIMIT 100
    `;

    const camerasResult = await pool.query(camerasQuery);
    const cameras = camerasResult.rows;

    context.log(`Found ${cameras.length} cameras to geocode`);

    for (let i = 0; i < cameras.length; i += BATCH_SIZE) {
      const batch = cameras.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (camera: any) => {
          try {
            const address = await reverseGeocode(
              camera.latitude,
              camera.longitude,
              GOOGLE_MAPS_API_KEY
            );

            if (address) {
              await pool.query(
                `UPDATE traffic_cameras
                 SET metadata = metadata || $1::jsonb
                 WHERE id = $2`,
                [JSON.stringify({ address, geocoded: true }), camera.id]
              );
              geocoded++;
            }

            // Rate limiting: 50 requests per second max
            await new Promise((resolve) => setTimeout(resolve, 20));
          } catch (err) {
            errors++;
            context.log.error(`Error geocoding camera ${camera.id}:`, err);
          }
        })
      );
    }

    // Geocode traffic incidents without address data
    const incidentsQuery = `
      SELECT id, latitude, longitude, description
      FROM traffic_incidents
      WHERE metadata->>'address' IS NULL
      AND (end_time IS NULL OR end_time > NOW())
      LIMIT 100
    `;

    const incidentsResult = await pool.query(incidentsQuery);
    const incidents = incidentsResult.rows;

    context.log(`Found ${incidents.length} incidents to geocode`);

    for (let i = 0; i < incidents.length; i += BATCH_SIZE) {
      const batch = incidents.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (incident: any) => {
          try {
            const address = await reverseGeocode(
              incident.latitude,
              incident.longitude,
              GOOGLE_MAPS_API_KEY
            );

            if (address) {
              await pool.query(
                `UPDATE traffic_incidents
                 SET metadata = metadata || $1::jsonb
                 WHERE id = $2`,
                [JSON.stringify({ address, geocoded: true }), incident.id]
              );
              geocoded++;
            }

            await new Promise((resolve) => setTimeout(resolve, 20));
          } catch (err) {
            errors++;
            context.log.error(`Error geocoding incident ${incident.id}:`, err);
          }
        })
      );
    }

    const summary = {
      timestamp: new Date().toISOString(),
      geocoded,
      errors,
    };

    context.log('Geocoding Service completed:', summary);
    context.bindings.geocodeLog = summary;

    context.log.metric('LocationsGeocoded', geocoded);

  } catch (error) {
    context.log.error('Geocoding Service failed:', error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to address
 */
async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${lat},${lng}`,
          key: apiKey,
        },
        timeout: 5000,
      }
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }

    return null;
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    return null;
  }
}

export default timerTrigger;
