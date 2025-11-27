import { AzureFunction, Context } from '@azure/functions';
import axios from 'axios';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Azure Function: Traffic Camera Sync
 * Syncs all 411 Florida DOT traffic cameras every 5 minutes
 * Triggered by: Timer (0 */5 * * * *)
 */
const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const startTime = Date.now();
  context.log('Traffic Camera Sync started:', new Date().toISOString());

  try {
    // Fetch cameras from Florida 511 API
    const FL511_API_BASE = process.env.FL511_API_BASE || 'https://fl511.com/api';
    const FL511_API_KEY = process.env.FL511_API_KEY || '';

    const response = await axios.get(`${FL511_API_BASE}/cameras`, {
      params: {
        key: FL511_API_KEY,
        format: 'json',
      },
      timeout: 30000,
    });

    const cameras = response.data.cameras || [];
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    context.log(`Fetched ${cameras.length} cameras from Florida 511 API`);

    // Process cameras in batches
    const batchSize = 50;
    for (let i = 0; i < cameras.length; i += batchSize) {
      const batch = cameras.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (camera: any) => {
          try {
            const { id, name, description, location, feeds, roadway, direction, county } = camera;

            if (!location?.latitude || !location?.longitude) {
              context.log.warn(`Skipping camera ${id}: missing location`);
              return;
            }

            const feedUrl = feeds?.[0]?.url || null;
            const thumbnailUrl = feeds?.[0]?.thumbnail || null;

            const upsertQuery = `
              INSERT INTO traffic_cameras (
                fdot_id, name, description, latitude, longitude,
                road, direction, county, feed_url, thumbnail_url,
                status, metadata, last_updated
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
              ON CONFLICT (fdot_id)
              DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                road = EXCLUDED.road,
                direction = EXCLUDED.direction,
                county = EXCLUDED.county,
                feed_url = EXCLUDED.feed_url,
                thumbnail_url = EXCLUDED.thumbnail_url,
                metadata = EXCLUDED.metadata,
                last_updated = NOW()
              RETURNING (xmax = 0) AS inserted
            `;

            const result = await pool.query(upsertQuery, [
              id || `camera_${i}`,
              name || 'Unknown Camera',
              description || '',
              location.latitude,
              location.longitude,
              roadway || '',
              direction || '',
              county || '',
              feedUrl,
              thumbnailUrl,
              'active',
              JSON.stringify({
                mileMarker: camera.mileMarker,
                roadwayId: camera.roadwayId,
                region: camera.region,
                district: camera.district,
                rawData: camera,
              }),
            ]);

            if (result.rows[0]?.inserted) {
              inserted++;
            } else {
              updated++;
            }
          } catch (err) {
            errors++;
            context.log.error(`Error processing camera ${camera.id}:`, err);
          }
        })
      );
    }

    const duration = Date.now() - startTime;

    const summary = {
      timestamp: new Date().toISOString(),
      totalCameras: cameras.length,
      inserted,
      updated,
      errors,
      durationMs: duration,
    };

    context.log('Traffic Camera Sync completed:', summary);
    context.bindings.syncLog = summary;

    // Update Application Insights
    context.log.metric('CamerasSynced', cameras.length);
    context.log.metric('CamerasInserted', inserted);
    context.log.metric('CamerasUpdated', updated);
    context.log.metric('SyncDuration', duration);

  } catch (error) {
    context.log.error('Traffic Camera Sync failed:', error);
    throw error;
  }
};

export default timerTrigger;
