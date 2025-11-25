/**
 * Vehicle Location History API Routes
 *
 * Endpoints for tracking vehicle location history and trip breadcrumbs
 *
 * Security: JWT authentication required, RBAC permissions enforced, multi-tenant isolation
 */

import express, { Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission, rateLimit } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import pool from '../config/database';
import { z } from 'zod';

const router = express.Router();
router.use(authenticateJWT);

// =====================================================
// Validation Schemas
// =====================================================

const LocationHistoryQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(10000).default(1000),
  page: z.coerce.number().int().min(1).default(1)
});

// =====================================================
// GET /api/vehicles/:id/location-history
// Get vehicle location breadcrumb trail
// =====================================================

router.get(
  '/:id/location-history',
  requirePermission('vehicle:view:location_history'),
  rateLimit(30, 60000),
  auditLog({ action: 'READ', resourceType: 'vehicle_location_history' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = req.params.id;

      // Validate query parameters
      const queryValidation = LocationHistoryQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: queryValidation.error.errors
        });
      }

      const { startDate, endDate, limit, page } = queryValidation.data;
      const offset = (page - 1) * limit;

      // Verify vehicle belongs to tenant
      const vehicleCheck = await pool.query(
        'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
        [vehicleId, req.user!.tenant_id]
      );

      if (vehicleCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Build query with date filters
      let dateFilter = '';
      const params: any[] = [vehicleId, req.user!.tenant_id];
      let paramIndex = 3;

      if (startDate) {
        dateFilter += ` AND tgb.timestamp >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        dateFilter += ` AND tgb.timestamp <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      params.push(limit, offset);

      // Query breadcrumbs with trip context
      const result = await pool.query(
        `
        SELECT
          tgb.id,
          tgb.trip_id,
          tgb.timestamp,
          tgb.latitude,
          tgb.longitude,
          tgb.accuracy_meters,
          tgb.altitude_meters,
          tgb.speed_mph,
          tgb.heading_degrees,
          tgb.engine_rpm,
          tgb.fuel_level_percent,
          tgb.coolant_temp_f,
          tgb.throttle_position_percent,
          tgb.metadata,
          t.start_time,
          t.end_time,
          t.driver_id,
          t.usage_type,
          t.classification_status,
          d.first_name,
          d.last_name
        FROM trip_gps_breadcrumbs tgb
        INNER JOIN trips t ON tgb.trip_id = t.id
        LEFT JOIN drivers d ON t.driver_id = d.id
        WHERE t.vehicle_id = $1
          AND t.tenant_id = $2
          ${dateFilter}
        ORDER BY tgb.timestamp DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `,
        params
      );

      // Get total count for pagination
      const countParams = params.slice(0, paramIndex - 2);
      const countResult = await pool.query(
        `
        SELECT COUNT(*)
        FROM trip_gps_breadcrumbs tgb
        INNER JOIN trips t ON tgb.trip_id = t.id
        WHERE t.vehicle_id = $1
          AND t.tenant_id = $2
          ${dateFilter}
        `,
        countParams
      );

      const total = parseInt(countResult.rows[0].count);

      res.json({
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: offset + result.rows.length < total
        },
        metadata: {
          vehicleId,
          startDate: startDate || null,
          endDate: endDate || null,
          pointsReturned: result.rows.length
        }
      });
    } catch (error) {
      console.error('Get vehicle location history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// =====================================================
// GET /api/trips/:id/breadcrumbs
// Get all GPS breadcrumbs for a specific trip
// =====================================================

router.get(
  '/trips/:id/breadcrumbs',
  requirePermission('vehicle:view:location_history'),
  rateLimit(30, 60000),
  auditLog({ action: 'READ', resourceType: 'trip_breadcrumbs' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const tripId = req.params.id;

      // Get trip metadata and verify tenant ownership
      const tripResult = await pool.query(
        `
        SELECT
          t.id,
          t.vehicle_id,
          t.driver_id,
          t.start_time,
          t.end_time,
          t.distance_miles,
          t.duration_seconds,
          t.avg_speed_mph,
          t.max_speed_mph,
          t.usage_type,
          t.classification_status,
          v.unit_number,
          v.make,
          v.model,
          v.year,
          d.first_name,
          d.last_name,
          d.employee_id
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN drivers d ON t.driver_id = d.id
        WHERE t.id = $1 AND t.tenant_id = $2
        `,
        [tripId, req.user!.tenant_id]
      );

      if (tripResult.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      const trip = tripResult.rows[0];

      // Get breadcrumbs ordered chronologically
      const breadcrumbsResult = await pool.query(
        `
        SELECT
          id,
          timestamp,
          latitude,
          longitude,
          accuracy_meters,
          altitude_meters,
          speed_mph,
          heading_degrees,
          engine_rpm,
          fuel_level_percent,
          coolant_temp_f,
          throttle_position_percent,
          metadata
        FROM trip_gps_breadcrumbs
        WHERE trip_id = $1
        ORDER BY timestamp ASC
        `,
        [tripId]
      );

      res.json({
        trip: trip,
        breadcrumbs: breadcrumbsResult.rows,
        metadata: {
          totalPoints: breadcrumbsResult.rows.length,
          startTime: trip.start_time,
          endTime: trip.end_time,
          duration: trip.duration_seconds,
          distance: trip.distance_miles
        }
      });
    } catch (error) {
      console.error('Get trip breadcrumbs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// =====================================================
// GET /api/vehicles/:id/timeline
// Get timestamped location events for a vehicle
// =====================================================

router.get(
  '/:id/timeline',
  requirePermission('vehicle:view:location_history'),
  rateLimit(30, 60000),
  auditLog({ action: 'READ', resourceType: 'vehicle_timeline' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = req.params.id;

      // Validate query parameters
      const queryValidation = LocationHistoryQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: queryValidation.error.errors
        });
      }

      const { startDate, endDate, limit, page } = queryValidation.data;
      const offset = (page - 1) * limit;

      // Verify vehicle belongs to tenant
      const vehicleCheck = await pool.query(
        'SELECT id, unit_number FROM vehicles WHERE id = $1 AND tenant_id = $2',
        [vehicleId, req.user!.tenant_id]
      );

      if (vehicleCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Build date filter
      let dateFilter = '';
      const params: any[] = [vehicleId, req.user!.tenant_id];
      let paramIndex = 3;

      if (startDate) {
        dateFilter = ` AND timestamp >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        dateFilter += ` AND timestamp <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      // Combine events from multiple tables using UNION ALL
      const query = `
        SELECT * FROM (
          -- Trip start/end events
          (
            SELECT
              'trip_start' as event_type,
              start_time as timestamp,
              start_latitude as latitude,
              start_longitude as longitude,
              id as reference_id,
              jsonb_build_object(
                'driver_id', driver_id,
                'usage_type', usage_type,
                'start_odometer', start_odometer_miles
              ) as event_data
            FROM trips
            WHERE vehicle_id = $1 AND tenant_id = $2 ${dateFilter}
          )
          UNION ALL
          (
            SELECT
              'trip_end' as event_type,
              end_time as timestamp,
              end_latitude as latitude,
              end_longitude as longitude,
              id as reference_id,
              jsonb_build_object(
                'driver_id', driver_id,
                'usage_type', usage_type,
                'end_odometer', end_odometer_miles,
                'distance_miles', distance_miles,
                'duration_seconds', duration_seconds
              ) as event_data
            FROM trips
            WHERE vehicle_id = $1 AND tenant_id = $2 AND end_time IS NOT NULL ${dateFilter}
          )
          UNION ALL
          -- Geofence events
          (
            SELECT
              CASE WHEN event_type = 'entry' THEN 'geofence_entry' ELSE 'geofence_exit' END as event_type,
              timestamp,
              latitude,
              longitude,
              id as reference_id,
              jsonb_build_object(
                'geofence_id', geofence_id,
                'driver_id', driver_id,
                'speed_mph', speed_mph
              ) as event_data
            FROM geofence_events
            WHERE vehicle_id = $1 AND tenant_id = $2 ${dateFilter}
          )
          UNION ALL
          -- Fuel transactions
          (
            SELECT
              'fueling' as event_type,
              transaction_date as timestamp,
              NULL as latitude,
              NULL as longitude,
              id as reference_id,
              jsonb_build_object(
                'gallons', gallons,
                'cost', total_cost,
                'vendor', vendor_name,
                'odometer', odometer_reading
              ) as event_data
            FROM fuel_transactions
            WHERE vehicle_id = $1 AND tenant_id = $2 ${dateFilter}
          )
          UNION ALL
          -- Inspections
          (
            SELECT
              'inspection' as event_type,
              inspection_date as timestamp,
              NULL as latitude,
              NULL as longitude,
              id as reference_id,
              jsonb_build_object(
                'inspector_id', inspector_id,
                'status', status,
                'odometer', odometer_reading
              ) as event_data
            FROM inspections
            WHERE vehicle_id = $1 AND tenant_id = $2 ${dateFilter}
          )
        ) combined_events
        ORDER BY timestamp DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM (
          SELECT start_time as timestamp FROM trips WHERE vehicle_id = $1 AND tenant_id = $2 ${dateFilter}
          UNION ALL
          SELECT end_time as timestamp FROM trips WHERE vehicle_id = $1 AND tenant_id = $2 AND end_time IS NOT NULL ${dateFilter}
          UNION ALL
          SELECT timestamp FROM geofence_events WHERE vehicle_id = $1 AND tenant_id = $2 ${dateFilter}
          UNION ALL
          SELECT transaction_date as timestamp FROM fuel_transactions WHERE vehicle_id = $1 AND tenant_id = $2 ${dateFilter}
          UNION ALL
          SELECT inspection_date as timestamp FROM inspections WHERE vehicle_id = $1 AND tenant_id = $2 ${dateFilter}
        ) all_events
      `;

      const countResult = await pool.query(countQuery, params.slice(0, paramIndex - 2));
      const total = parseInt(countResult.rows[0].count);

      res.json({
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: offset + result.rows.length < total
        },
        metadata: {
          vehicleId,
          unitNumber: vehicleCheck.rows[0].unit_number,
          startDate: startDate || null,
          endDate: endDate || null,
          eventsReturned: result.rows.length
        }
      });
    } catch (error) {
      console.error('Get vehicle timeline error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
