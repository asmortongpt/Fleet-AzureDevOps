import * as turf from '@turf/turf';
import { Pool } from 'pg';

import { AuditLogger } from '../utils/auditLogger';
import { Logger } from '../utils/logger';
import { validateGeofenceInput, validateRuleInput, validateLocationInput } from '../utils/validators';

const pool = new Pool(); // Assume pool is configured elsewhere
const logger = new Logger();
const auditLogger = new AuditLogger();

export class GeofenceService {
  async createFence(tenantId: string, { name, type, centerLat, centerLng, radiusM, polygonGeojson }: { name: string, type: 'CIRCLE' | 'POLYGON', centerLat?: number, centerLng?: number, radiusM?: number, polygonGeojson?: any }) {
    try {
      validateGeofenceInput({ name, type, centerLat, centerLng, radiusM, polygonGeojson });

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const queryText = `
          INSERT INTO geofences (tenant_id, name, type, center_lat, center_lng, radius_m, polygon_geojson)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;
        const res = await client.query(queryText, [tenantId, name, type, centerLat, centerLng, radiusM, polygonGeojson]);
        await client.query('COMMIT');
        auditLogger.log('Geofence created', { tenantId, geofenceId: res.rows[0].id });
        return res.rows[0].id;
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error('Error creating geofence', err);
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('Validation or connection error', err);
      throw err;
    }
  }

  async createRule(tenantId: string, { geofenceId, trigger, assetCategoryId, notifyRoles, notifyUsers }: { geofenceId: string, trigger: 'EXIT' | 'ENTER' | 'DWELL', assetCategoryId: string, notifyRoles: string[], notifyUsers: string[] }) {
    try {
      validateRuleInput({ geofenceId, trigger, assetCategoryId, notifyRoles, notifyUsers });

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const queryText = `
          INSERT INTO geofence_rules (tenant_id, geofence_id, trigger, asset_category_id, notify_roles, notify_users)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        const res = await client.query(queryText, [tenantId, geofenceId, trigger, assetCategoryId, notifyRoles, notifyUsers]);
        await client.query('COMMIT');
        auditLogger.log('Geofence rule created', { tenantId, ruleId: res.rows[0].id });
        return res.rows[0].id;
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error('Error creating geofence rule', err);
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('Validation or connection error', err);
      throw err;
    }
  }

  async evaluateLocationEvent(tenantId: string, assetId: string, lat: number, lng: number) {
    try {
      validateLocationInput({ assetId, lat, lng });

      const client = await pool.connect();
      try {
        const queryText = `
          SELECT id, type, center_lat, center_lng, radius_m, polygon_geojson
          FROM geofences
          WHERE tenant_id = $1
        `;
        const res = await client.query(queryText, [tenantId]);
        for (const geofence of res.rows) {
          let isInside = false;
          if (geofence.type === 'CIRCLE') {
            const center = turf.point([geofence.center_lng, geofence.center_lat]);
            const point = turf.point([lng, lat]);
            const distance = turf.distance(center, point, { units: 'meters' });
            isInside = distance <= geofence.radius_m;
          } else if (geofence.type === 'POLYGON') {
            const point = turf.point([lng, lat]);
            const polygon = turf.polygon(geofence.polygon_geojson.coordinates);
            isInside = turf.booleanPointInPolygon(point, polygon);
          }
          if (isInside) {
            auditLogger.log('Location event evaluated', { tenantId, assetId, geofenceId: geofence.id });
            // Trigger alerts or notifications as needed
          }
        }
      } catch (err) {
        logger.error('Error evaluating location event', err);
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('Validation or connection error', err);
      throw err;
    }
  }
}