/**
 * Mobile Trip Logging API Routes
 *
 * Endpoints for automated trip tracking with OBD2 integration
 */

import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import pool from '../config/database';
import { z } from 'zod';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// =====================================================
// Validation Schemas
// =====================================================

const StartTripSchema = z.object({
  vehicle_id: z.number().int().positive().optional(),
  driver_id: z.number().int().positive().optional(),
  start_time: z.string().datetime(),
  start_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional()
  }),
  start_odometer_miles: z.number().optional()
});

const EndTripSchema = z.object({
  end_time: z.string().datetime(),
  end_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional()
  }),
  end_odometer_miles: z.number().optional(),
  duration_seconds: z.number().int().optional(),
  distance_miles: z.number().optional(),
  avg_speed_mph: z.number().optional(),
  max_speed_mph: z.number().optional(),
  idle_time_seconds: z.number().int().optional(),
  fuel_consumed_gallons: z.number().optional(),
  fuel_efficiency_mpg: z.number().optional(),
  driver_score: z.number().int().min(0).max(100).optional(),
  harsh_acceleration_count: z.number().int().optional(),
  harsh_braking_count: z.number().int().optional(),
  harsh_cornering_count: z.number().int().optional(),
  speeding_count: z.number().int().optional(),
  status: z.enum(['completed', 'cancelled']).optional()
});

const TripMetricsSchema = z.object({
  metrics: z.array(z.object({
    timestamp: z.string().datetime(),
    engine_rpm: z.number().optional(),
    engine_load_percent: z.number().optional(),
    engine_coolant_temp_f: z.number().optional(),
    fuel_level_percent: z.number().optional(),
    fuel_flow_rate_gph: z.number().optional(),
    speed_mph: z.number().optional(),
    throttle_position_percent: z.number().optional(),
    battery_voltage: z.number().optional(),
    odometer_miles: z.number().optional(),
    mil_status: z.boolean().optional(),
    dtc_count: z.number().int().optional()
  })).optional(),
  breadcrumbs: z.array(z.object({
    timestamp: z.string().datetime(),
    latitude: z.number(),
    longitude: z.number(),
    speed_mph: z.number().optional(),
    heading_degrees: z.number().optional(),
    accuracy_meters: z.number().optional(),
    altitude_meters: z.number().optional(),
    engine_rpm: z.number().optional(),
    fuel_level_percent: z.number().optional(),
    coolant_temp_f: z.number().optional(),
    throttle_position_percent: z.number().optional()
  })).optional(),
  events: z.array(z.object({
    type: z.enum([
      'harsh_acceleration',
      'harsh_braking',
      'harsh_cornering',
      'speeding',
      'rapid_lane_change',
      'tailgating',
      'idling_excessive',
      'engine_warning',
      'low_fuel',
      'geofence_entry',
      'geofence_exit'
    ]),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    timestamp: z.string().datetime(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().optional(),
    speed_mph: z.number().optional(),
    g_force: z.number().optional(),
    speed_limit_mph: z.number().int().optional(),
    description: z.string(),
    metadata: z.any().optional()
  })).optional()
});

const ClassifyTripSchema = z.object({
  usage_type: z.enum(['business', 'personal', 'mixed']),
  business_purpose: z.string().optional(),
  business_percentage: z.number().min(0).max(100).optional()
});

// =====================================================
// Trip Endpoints
// =====================================================

/**
 * @swagger
 * /api/mobile/trips/start:
 *   post:
 *     summary: Start a new trip
 *     tags: [Mobile Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle_id:
 *                 type: integer
 *               driver_id:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               start_location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *               start_odometer_miles:
 *                 type: number
 *     responses:
 *       201:
 *         description: Trip started successfully
 *       400:
 *         description: Invalid request data
 */
router.post('/start', requirePermission('route:create:own'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = StartTripSchema.parse(req.body);
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenant_id;

    // Use authenticated user as driver if not specified
    const driverId = validated.driver_id || userId;

    // Insert trip
    const result = await pool.query(
      `INSERT INTO trips (
        tenant_id, vehicle_id, driver_id, status,
        start_time, start_location, start_odometer_miles,
        harsh_acceleration_count, harsh_braking_count,
        harsh_cornering_count, speeding_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, status, start_time, start_location, start_odometer_miles`,
      [
        tenantId,
        validated.vehicle_id || null,
        driverId,
        'in_progress',
        validated.start_time,
        JSON.stringify(validated.start_location),
        validated.start_odometer_miles || null,
        0, 0, 0, 0
      ]
    );

    const trip = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Trip started',
      trip_id: trip.id,
      trip
    });
  } catch (error: any) {
    console.error('Error starting trip:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to start trip' });
  }
});

/**
 * @swagger
 * /api/mobile/trips/{id}/end:
 *   post:
 *     summary: End a trip
 *     tags: [Mobile Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               end_location:
 *                 type: object
 *               end_odometer_miles:
 *                 type: number
 *               distance_miles:
 *                 type: number
 *               driver_score:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Trip ended successfully
 */
router.post('/:id/end', requirePermission('route:update:own'), auditLog, async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const validated = EndTripSchema.parse(req.body);
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenant_id;

    // Verify trip exists and user has access
    const tripCheck = await pool.query(
      'SELECT id, driver_id FROM trips WHERE id = $1 AND tenant_id = $2',
      [tripId, tenantId]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripCheck.rows[0];

    // Verify user is the driver or has admin access
    if (trip.driver_id !== userId && !['admin', 'fleet_manager'].includes((req as any).user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate distance if not provided
    let distanceMiles = validated.distance_miles;
    if (!distanceMiles && validated.end_odometer_miles) {
      const startOdometer = await pool.query(
        'SELECT start_odometer_miles FROM trips WHERE id = $1',
        [tripId]
      );
      if (startOdometer.rows[0]?.start_odometer_miles) {
        distanceMiles = validated.end_odometer_miles - startOdometer.rows[0].start_odometer_miles;
      }
    }

    // Update trip
    const status = validated.status || 'completed';
    const result = await pool.query(
      `UPDATE trips SET
        status = $1,
        end_time = $2,
        end_location = $3,
        end_odometer_miles = $4,
        duration_seconds = $5,
        distance_miles = $6,
        avg_speed_mph = $7,
        max_speed_mph = $8,
        idle_time_seconds = $9,
        fuel_consumed_gallons = $10,
        fuel_efficiency_mpg = $11,
        driver_score = $12,
        harsh_acceleration_count = $13,
        harsh_braking_count = $14,
        harsh_cornering_count = $15,
        speeding_count = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17 AND tenant_id = $18
      RETURNING *`,
      [
        status,
        validated.end_time,
        JSON.stringify(validated.end_location),
        validated.end_odometer_miles || null,
        validated.duration_seconds || null,
        distanceMiles || null,
        validated.avg_speed_mph || null,
        validated.max_speed_mph || null,
        validated.idle_time_seconds || 0,
        validated.fuel_consumed_gallons || null,
        validated.fuel_efficiency_mpg || null,
        validated.driver_score || null,
        validated.harsh_acceleration_count || 0,
        validated.harsh_braking_count || 0,
        validated.harsh_cornering_count || 0,
        validated.speeding_count || 0,
        tripId,
        tenantId
      ]
    );

    res.json({
      success: true,
      message: 'Trip ended',
      trip: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error ending trip:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to end trip' });
  }
});

/**
 * @swagger
 * /api/mobile/trips/{id}/metrics:
 *   post:
 *     summary: Save trip metrics (OBD2, GPS, events)
 *     tags: [Mobile Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: object
 *               breadcrumbs:
 *                 type: array
 *                 items:
 *                   type: object
 *               events:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Metrics saved successfully
 */
router.post('/:id/metrics', requirePermission('route:update:own'), async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const validated = TripMetricsSchema.parse(req.body);
    const tenantId = (req as any).user.tenant_id;

    // Verify trip exists
    const tripCheck = await pool.query(
      'SELECT id FROM trips WHERE id = $1 AND tenant_id = $2',
      [tripId, tenantId]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert OBD2 metrics
      if (validated.metrics && validated.metrics.length > 0) {
        const metricsValues = validated.metrics.map((m, idx) => {
          const params = [
            tripId,
            m.timestamp,
            m.engine_rpm,
            m.engine_load_percent,
            m.engine_coolant_temp_f,
            m.fuel_level_percent,
            m.fuel_flow_rate_gph,
            m.speed_mph,
            m.throttle_position_percent,
            m.battery_voltage,
            m.odometer_miles,
            m.dtc_count,
            m.mil_status
          ];
          const placeholders = params.map((_, i) => '$${i + 1}`).join(', ');
          return { query: `(${placeholders})`, params };
        });

        for (const mv of metricsValues) {
          await client.query(
            `INSERT INTO trip_obd2_metrics (
              trip_id, timestamp, engine_rpm, engine_load_percent,
              engine_coolant_temp_f, fuel_level_percent, fuel_flow_rate_gph,
              speed_mph, throttle_position_percent, battery_voltage,
              odometer_miles, dtc_count, mil_status
            ) VALUES ${mv.query}`,
            mv.params
          );
        }
      }

      // Insert GPS breadcrumbs
      if (validated.breadcrumbs && validated.breadcrumbs.length > 0) {
        for (const breadcrumb of validated.breadcrumbs) {
          await client.query(
            `INSERT INTO trip_gps_breadcrumbs (
              trip_id, timestamp, latitude, longitude,
              speed_mph, heading_degrees, accuracy_meters, altitude_meters,
              engine_rpm, fuel_level_percent, coolant_temp_f, throttle_position_percent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              tripId,
              breadcrumb.timestamp,
              breadcrumb.latitude,
              breadcrumb.longitude,
              breadcrumb.speed_mph || null,
              breadcrumb.heading_degrees || null,
              breadcrumb.accuracy_meters || null,
              breadcrumb.altitude_meters || null,
              breadcrumb.engine_rpm || null,
              breadcrumb.fuel_level_percent || null,
              breadcrumb.coolant_temp_f || null,
              breadcrumb.throttle_position_percent || null
            ]
          );
        }
      }

      // Insert trip events
      if (validated.events && validated.events.length > 0) {
        for (const event of validated.events) {
          await client.query(
            `INSERT INTO trip_events (
              trip_id, event_type, severity, timestamp,
              latitude, longitude, address, speed_mph,
              g_force, speed_limit_mph, description, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              tripId,
              event.type,
              event.severity,
              event.timestamp,
              event.latitude || null,
              event.longitude || null,
              event.address || null,
              event.speed_mph || null,
              event.g_force || null,
              event.speed_limit_mph || null,
              event.description,
              JSON.stringify(event.metadata || {})
            ]
          );
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Metrics saved',
        counts: {
          metrics: validated.metrics?.length || 0,
          breadcrumbs: validated.breadcrumbs?.length || 0,
          events: validated.events?.length || 0
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error saving metrics:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to save metrics' });
  }
});

/**
 * @swagger
 * /api/mobile/trips/{id}:
 *   get:
 *     summary: Get trip details with full data
 *     tags: [Mobile Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: include_breadcrumbs
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: include_metrics
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: include_events
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Trip details
 */
router.get('/:id', requirePermission('route:view:own'), async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const tenantId = (req as any).user.tenant_id;

    const includeBreadcrumbs = req.query.include_breadcrumbs === 'true';
    const includeMetrics = req.query.include_metrics === 'true';
    const includeEvents = req.query.include_events === 'true';

    // Get trip
    const tripResult = await pool.query(
      `SELECT
        t.*,
        v.name as vehicle_name,
        v.make, v.model, v.year, v.license_plate,
        u.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN users u ON t.driver_id = u.id
      WHERE t.id = $1 AND t.tenant_id = $2',
      [tripId, tenantId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];

    // Get breadcrumbs
    if (includeBreadcrumbs) {
      const breadcrumbsResult = await pool.query(
        `SELECT id, tenant_id, trip_id, latitude, longitude, accuracy, recorded_at FROM trip_gps_breadcrumbs
         WHERE trip_id = $1
         ORDER BY timestamp ASC`,
        [tripId]
      );
      trip.breadcrumbs = breadcrumbsResult.rows;
    }

    // Get metrics
    if (includeMetrics) {
      const metricsResult = await pool.query(
        `SELECT id, tenant_id, trip_id, metric_name, metric_value, recorded_at FROM trip_obd2_metrics
         WHERE trip_id = $1
         ORDER BY timestamp ASC`,
        [tripId]
      );
      trip.metrics = metricsResult.rows;
    }

    // Get events
    if (includeEvents) {
      const eventsResult = await pool.query(
        `SELECT id, tenant_id, trip_id, event_type, event_data, recorded_at FROM trip_events
         WHERE trip_id = $1
         ORDER BY timestamp ASC`,
        [tripId]
      );
      trip.events = eventsResult.rows;
    }

    res.json({
      success: true,
      trip
    });
  } catch (error: any) {
    console.error('Error getting trip:', error);
    res.status(500).json({ error: 'Failed to get trip' });
  }
});

/**
 * @swagger
 * /api/mobile/trips/{id}/classify:
 *   patch:
 *     summary: Classify trip as business/personal
 *     tags: [Mobile Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usage_type:
 *                 type: string
 *                 enum: [business, personal, mixed]
 *               business_purpose:
 *                 type: string
 *               business_percentage:
 *                 type: number
 *     responses:
 *       200:
 *         description: Trip classified
 */
router.patch('/:id/classify', requirePermission('route:update:own'), auditLog, async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id;
    const validated = ClassifyTripSchema.parse(req.body);
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenant_id;

    // Verify trip exists and user has access
    const tripCheck = await pool.query(
      'SELECT id, driver_id FROM trips WHERE id = $1 AND tenant_id = $2',
      [tripId, tenantId]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripCheck.rows[0];

    // Verify user is the driver or has admin access
    if (trip.driver_id !== userId && !['admin', 'fleet_manager'].includes((req as any).user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update trip classification
    const result = await pool.query(
      `UPDATE trips SET
        usage_type = $1,
        business_purpose = $2,
        classification_status = 'classified',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND tenant_id = $4
      RETURNING *`,
      [
        validated.usage_type,
        validated.business_purpose || null,
        tripId,
        tenantId
      ]
    );

    // Create trip usage classification entry for reporting
    if (validated.usage_type === 'personal' || validated.usage_type === 'mixed') {
      const tripData = result.rows[0];

      await pool.query(
        `INSERT INTO trip_usage_classification (
          tenant_id, trip_id, vehicle_id, driver_id,
          usage_type, business_purpose, business_percentage,
          miles_total, miles_business, miles_personal,
          trip_date, start_location, end_location,
          approval_status, created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (trip_id) DO UPDATE SET
          usage_type = EXCLUDED.usage_type,
          business_purpose = EXCLUDED.business_purpose,
          business_percentage = EXCLUDED.business_percentage,
          updated_at = CURRENT_TIMESTAMP`,
        [
          tenantId,
          tripId,
          tripData.vehicle_id,
          tripData.driver_id,
          validated.usage_type,
          validated.business_purpose || null,
          validated.business_percentage || (validated.usage_type === 'personal' ? 0 : 100),
          tripData.distance_miles || 0,
          validated.usage_type === 'business' ? tripData.distance_miles :
            (validated.business_percentage ? tripData.distance_miles * validated.business_percentage / 100 : 0),
          validated.usage_type === 'personal' ? tripData.distance_miles :
            (validated.business_percentage ? tripData.distance_miles * (100 - validated.business_percentage) / 100 : 0),
          tripData.start_time,
          tripData.start_location,
          tripData.end_location,
          'pending',
          userId
        ]
      );
    }

    res.json({
      success: true,
      message: 'Trip classified',
      trip: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error classifying trip:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to classify trip' });
  }
});

/**
 * @swagger
 * /api/mobile/trips:
 *   get:
 *     summary: Get list of trips
 *     tags: [Mobile Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: vehicle_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of trips
 */
router.get('/', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id;
    const {
      driver_id,
      vehicle_id,
      status,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT
        t.*,
        v.name as vehicle_name,
        v.license_plate,
        u.name as driver_name,
        (SELECT COUNT(*) FROM trip_events te WHERE te.trip_id = t.id AND te.severity IN ('high', 'critical')) as critical_events
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN users u ON t.driver_id = u.id
      WHERE t.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramCount = 1;

    if (driver_id) {
      paramCount++;
      query += ` AND t.driver_id = $${paramCount}`;
      params.push(driver_id);
    }

    if (vehicle_id) {
      paramCount++;
      query += ` AND t.vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
    }

    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (start_date) {
      paramCount++;
      query += ` AND t.start_time >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND t.start_time <= $${paramCount}`;
      params.push(end_date);
    }

    query += ` ORDER BY t.start_time DESC`;

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      trips: result.rows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(offset as string) + result.rows.length < total
      }
    });
  } catch (error: any) {
    console.error('Error getting trips:', error);
    res.status(500).json({ error: 'Failed to get trips' });
  }
});

export default router;
