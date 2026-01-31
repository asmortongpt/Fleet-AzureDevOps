import { Pool } from 'pg';

import { connectionManager } from '../config/database';
import {
  NearestVehicle,
  NearestFacility,
  NearestChargingStation,
  VehicleInGeofence,
  VehicleWithLocation,
} from '../types/geospatial';

export class GeospatialRepository {
  private pool: Pool;

  constructor() {
    this.pool = connectionManager.getPool();
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  async calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): Promise<number> {
    const query = `
      SELECT calculate_distance_haversine($1, $2, $3, $4) AS distance_meters
    `;

    const result = await this.pool.query(query, [lat1, lng1, lat2, lng2]);
    return result.rows[0].distance_meters;
  }

  /**
   * Find nearest vehicles to a point
   */
  async findNearestVehicles(
    tenantId: string,
    targetLat: number,
    targetLng: number,
    maxDistanceMeters: number = 10000,
    maxResults: number = 10
  ): Promise<NearestVehicle[]> {
    const query = `
      SELECT *
      FROM find_nearest_vehicles($1, $2, $3, $4, $5)
    `;

    const result = await this.pool.query(query, [
      targetLat,
      targetLng,
      maxDistanceMeters,
      maxResults,
      tenantId,
    ]);

    return result.rows;
  }

  /**
   * Find nearest facility to a point
   */
  async findNearestFacility(
    tenantId: string,
    targetLat: number,
    targetLng: number
  ): Promise<NearestFacility | null> {
    const query = `
      SELECT *
      FROM find_nearest_facility($1, $2, $3)
    `;

    const result = await this.pool.query(query, [
      targetLat,
      targetLng,
      tenantId,
    ]);

    return result.rows[0] || null;
  }

  /**
   * Check if a point is inside a circular geofence
   */
  async pointInCircularGeofence(
    checkLat: number,
    checkLng: number,
    geofenceId: string
  ): Promise<boolean> {
    const query = `
      SELECT point_in_circular_geofence($1, $2, $3) AS is_inside
    `;

    const result = await this.pool.query(query, [
      checkLat,
      checkLng,
      geofenceId,
    ]);

    return result.rows[0].is_inside;
  }

  /**
   * Find nearest charging stations
   */
  async findNearestChargingStation(
    tenantId: string,
    targetLat: number,
    targetLng: number,
    stationType?: string,
    maxResults: number = 5
  ): Promise<NearestChargingStation[]> {
    const query = `
      SELECT *
      FROM find_nearest_charging_station($1, $2, $3, $4, $5)
    `;

    const result = await this.pool.query(query, [
      targetLat,
      targetLng,
      stationType || null,
      maxResults,
      tenantId,
    ]);

    return result.rows;
  }

  /**
   * Find all vehicles inside a circular geofence
   */
  async findVehiclesInCircularGeofence(
    geofenceId: string
  ): Promise<VehicleInGeofence[]> {
    const query = `
      SELECT *
      FROM find_vehicles_in_circular_geofence($1)
    `;

    const result = await this.pool.query(query, [geofenceId]);
    return result.rows;
  }

  /**
   * Get all vehicles with location data
   */
  async getVehiclesWithLocation(
    tenantId: string
  ): Promise<VehicleWithLocation[]> {
    const query = `
      SELECT *
      FROM v_vehicles_with_location
      WHERE tenant_id = $1
      ORDER BY last_update DESC
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Get vehicles within a radius of a point
   */
  async getVehiclesInRadius(
    tenantId: string,
    centerLat: number,
    centerLng: number,
    radiusMeters: number
  ): Promise<VehicleWithLocation[]> {
    const query = `
      SELECT v.*
      FROM v_vehicles_with_location v
      WHERE v.tenant_id = $1
        AND calculate_distance_haversine($2, $3, v.latitude, v.longitude) <= $4
      ORDER BY calculate_distance_haversine($2, $3, v.latitude, v.longitude)
    `;

    const result = await this.pool.query(query, [
      tenantId,
      centerLat,
      centerLng,
      radiusMeters,
    ]);

    return result.rows;
  }

  /**
   * Get vehicles near a specific address (after geocoding)
   */
  async getVehiclesNearAddress(
    tenantId: string,
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
  ): Promise<VehicleWithLocation[]> {
    return this.getVehiclesInRadius(
      tenantId,
      latitude,
      longitude,
      radiusMeters
    );
  }
}

export const geospatialRepository = new GeospatialRepository();
