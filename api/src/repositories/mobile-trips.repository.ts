import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, PoolClient } from 'pg';

export interface StartTripData {
  tenantId: number;
  vehicleId?: number | null;
  driverId: number;
  startTime: string;
  startLocation: any;
  startOdometerMiles?: number | null;
}

export interface EndTripData {
  status: string;
  endTime: string;
  endLocation: any;
  endOdometerMiles?: number | null;
  durationSeconds?: number | null;
  distanceMiles?: number | null;
  avgSpeedMph?: number | null;
  maxSpeedMph?: number | null;
  idleTimeSeconds?: number;
  fuelConsumedGallons?: number | null;
  fuelEfficiencyMpg?: number | null;
  driverScore?: number | null;
  harshAccelerationCount?: number;
  harshBrakingCount?: number;
  harshCorneringCount?: number;
  speedingCount?: number;
}

export interface OBD2Metric {
  timestamp: string;
  engine_rpm?: number;
  engine_load_percent?: number;
  engine_coolant_temp_f?: number;
  fuel_level_percent?: number;
  fuel_flow_rate_gph?: number;
  speed_mph?: number;
  throttle_position_percent?: number;
  battery_voltage?: number;
  odometer_miles?: number;
  dtc_count?: number;
  mil_status?: boolean;
}

export interface GPSBreadcrumb {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_mph?: number;
  heading_degrees?: number;
  accuracy_meters?: number;
  altitude_meters?: number;
  engine_rpm?: number;
  fuel_level_percent?: number;
  coolant_temp_f?: number;
  throttle_position_percent?: number;
}

export interface TripEvent {
  type: string;
  severity: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  speed_mph?: number;
  g_force?: number;
  speed_limit_mph?: number;
  description: string;
  metadata?: any;
}

export interface ClassifyTripData {
  usageType: string;
  businessPurpose?: string | null;
}

export interface TripUsageClassificationData {
  tenantId: number;
  tripId: string;
  vehicleId: number;
  driverId: number;
  usageType: string;
  businessPurpose?: string | null;
  businessPercentage: number;
  milesTotal: number;
  milesBusiness: number;
  milesPersonal: number;
  tripDate: string;
  startLocation: any;
  endLocation: any;
  approvalStatus: string;
  createdByUserId: number;
}

/**
 * Repository for mobile trip operations
 * Handles all database interactions for trip tracking, OBD2 metrics, GPS breadcrumbs, and events
 */
export class MobileTripsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Start a new trip
   */
  async startTrip(data: StartTripData) {
    const result = await this.pool.query(
      `INSERT INTO trips (
        tenant_id, vehicle_id, driver_id, status,
        start_time, start_location, start_odometer_miles,
        harsh_acceleration_count, harsh_braking_count,
        harsh_cornering_count, speeding_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, status, start_time, start_location, start_odometer_miles`,
      [
        data.tenantId,
        data.vehicleId || null,
        data.driverId,
        'in_progress',
        data.startTime,
        JSON.stringify(data.startLocation),
        data.startOdometerMiles || null,
        0, 0, 0, 0
      ]
    );
    return result.rows[0];
  }

  /**
   * Find trip by ID and tenant
   */
  async findByIdAndTenant(tripId: string, tenantId: number) {
    const result = await this.pool.query(
      `SELECT id, driver_id FROM trips WHERE id = $1 AND tenant_id = $2`,
      [tripId, tenantId]
    );
    return result.rows[0];
  }

  /**
   * Get start odometer reading for a trip
   */
  async getStartOdometer(tripId: string) {
    const result = await this.pool.query(
      `SELECT start_odometer_miles FROM trips WHERE id = $1`,
      [tripId]
    );
    return result.rows[0];
  }

  /**
   * End a trip with final metrics
   */
  async endTrip(tripId: string, tenantId: number, data: EndTripData) {
    const result = await this.pool.query(
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
        data.status,
        data.endTime,
        JSON.stringify(data.endLocation),
        data.endOdometerMiles || null,
        data.durationSeconds || null,
        data.distanceMiles || null,
        data.avgSpeedMph || null,
        data.maxSpeedMph || null,
        data.idleTimeSeconds || 0,
        data.fuelConsumedGallons || null,
        data.fuelEfficiencyMpg || null,
        data.driverScore || null,
        data.harshAccelerationCount || 0,
        data.harshBrakingCount || 0,
        data.harshCorneringCount || 0,
        data.speedingCount || 0,
        tripId,
        tenantId
      ]
    );
    return result.rows[0];
  }

  /**
   * Insert OBD2 metric for a trip
   */
  async insertOBD2Metric(client: PoolClient, tripId: string, metric: OBD2Metric) {
    await client.query(
      `INSERT INTO trip_obd2_metrics (
        trip_id, timestamp, engine_rpm, engine_load_percent,
        engine_coolant_temp_f, fuel_level_percent, fuel_flow_rate_gph,
        speed_mph, throttle_position_percent, battery_voltage,
        odometer_miles, dtc_count, mil_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        tripId,
        metric.timestamp,
        metric.engine_rpm,
        metric.engine_load_percent,
        metric.engine_coolant_temp_f,
        metric.fuel_level_percent,
        metric.fuel_flow_rate_gph,
        metric.speed_mph,
        metric.throttle_position_percent,
        metric.battery_voltage,
        metric.odometer_miles,
        metric.dtc_count,
        metric.mil_status
      ]
    );
  }

  /**
   * Insert GPS breadcrumb for a trip
   */
  async insertGPSBreadcrumb(client: PoolClient, tripId: string, breadcrumb: GPSBreadcrumb) {
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

  /**
   * Insert trip event
   */
  async insertTripEvent(client: PoolClient, tripId: string, event: TripEvent) {
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

  /**
   * Get trip details with vehicle and driver info
   */
  async getTripDetails(tripId: string, tenantId: number) {
    const result = await this.pool.query(
      `SELECT
        t.*,
        v.name as vehicle_name,
        v.make, v.model, v.year, v.license_plate,
        u.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN users u ON t.driver_id = u.id
      WHERE t.id = $1 AND t.tenant_id = $2`,
      [tripId, tenantId]
    );
    return result.rows[0];
  }

  /**
   * Get GPS breadcrumbs for a trip
   */
  async getTripBreadcrumbs(tripId: string) {
    const result = await this.pool.query(
      `SELECT id, tenant_id, trip_id, latitude, longitude, accuracy, recorded_at
       FROM trip_gps_breadcrumbs
       WHERE trip_id = $1
       ORDER BY timestamp ASC`,
      [tripId]
    );
    return result.rows;
  }

  /**
   * Get OBD2 metrics for a trip
   */
  async getTripMetrics(tripId: string) {
    const result = await this.pool.query(
      `SELECT id, tenant_id, trip_id, metric_name, metric_value, recorded_at
       FROM trip_obd2_metrics
       WHERE trip_id = $1
       ORDER BY timestamp ASC`,
      [tripId]
    );
    return result.rows;
  }

  /**
   * Get events for a trip
   */
  async getTripEvents(tripId: string) {
    const result = await this.pool.query(
      `SELECT id, tenant_id, trip_id, event_type, event_data, recorded_at
       FROM trip_events
       WHERE trip_id = $1
       ORDER BY timestamp ASC`,
      [tripId]
    );
    return result.rows;
  }

  /**
   * Classify a trip as business/personal/mixed
   */
  async classifyTrip(tripId: string, tenantId: number, data: ClassifyTripData) {
    const result = await this.pool.query(
      `UPDATE trips SET
        usage_type = $1,
        business_purpose = $2,
        classification_status = 'classified',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND tenant_id = $4
      RETURNING *`,
      [
        data.usageType,
        data.businessPurpose || null,
        tripId,
        tenantId
      ]
    );
    return result.rows[0];
  }

  /**
   * Create or update trip usage classification
   */
  async upsertTripUsageClassification(data: TripUsageClassificationData) {
    await this.pool.query(
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
        data.tenantId,
        data.tripId,
        data.vehicleId,
        data.driverId,
        data.usageType,
        data.businessPurpose || null,
        data.businessPercentage,
        data.milesTotal,
        data.milesBusiness,
        data.milesPersonal,
        data.tripDate,
        data.startLocation,
        data.endLocation,
        data.approvalStatus,
        data.createdByUserId
      ]
    );
  }

  /**
   * Get filtered list of trips with pagination
   */
  async findTrips(
    tenantId: number,
    filters: {
      driverId?: number;
      vehicleId?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
    pagination: {
      limit: number;
      offset: number;
    }
  ) {
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

    if (filters.driverId) {
      paramCount++;
      query += ` AND t.driver_id = $${paramCount}`;
      params.push(filters.driverId);
    }

    if (filters.vehicleId) {
      paramCount++;
      query += ` AND t.vehicle_id = $${paramCount}`;
      params.push(filters.vehicleId);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.startDate) {
      paramCount++;
      query += ` AND t.start_time >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND t.start_time <= $${paramCount}`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY t.start_time DESC`;

    // Add pagination
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(pagination.limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(pagination.offset);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get total count of trips matching filters
   */
  async countTrips(
    tenantId: number,
    filters: {
      driverId?: number;
      vehicleId?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    let query = `
      SELECT COUNT(*)
      FROM trips t
      WHERE t.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramCount = 1;

    if (filters.driverId) {
      paramCount++;
      query += ` AND t.driver_id = $${paramCount}`;
      params.push(filters.driverId);
    }

    if (filters.vehicleId) {
      paramCount++;
      query += ` AND t.vehicle_id = $${paramCount}`;
      params.push(filters.vehicleId);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.startDate) {
      paramCount++;
      query += ` AND t.start_time >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND t.start_time <= $${paramCount}`;
      params.push(filters.endDate);
    }

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get a connection from the pool for transaction support
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }
}
