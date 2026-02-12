/**
 * RouteFactory - Generates route data with GeoJSON waypoints
 */
import type { Route, Status, FactoryOptions } from '../types';

import { BaseFactory } from './BaseFactory';

interface Location {
  name: string;
  lat: number;
  lon: number;
}

export class RouteFactory extends BaseFactory {
  // Major US cities for route generation
  private readonly US_LOCATIONS: Location[] = [
    { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
    { name: 'San Diego, CA', lat: 32.7157, lon: -117.1611 },
    { name: 'Houston, TX', lat: 29.7604, lon: -95.3698 },
    { name: 'Dallas, TX', lat: 32.7767, lon: -96.7970 },
    { name: 'Miami, FL', lat: 25.7617, lon: -80.1918 },
    { name: 'Orlando, FL', lat: 28.5383, lon: -81.3792 },
    { name: 'New York, NY', lat: 40.7128, lon: -74.0060 },
    { name: 'Philadelphia, PA', lat: 39.9526, lon: -75.1652 },
    { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298 },
    { name: 'Detroit, MI', lat: 42.3314, lon: -83.0458 },
  ];

  private readonly ROUTE_TYPES = [
    'delivery',
    'pickup',
    'service_call',
    'transport',
    'patrol',
    'inspection',
  ];

  /**
   * Generate a single route
   */
  build(
    tenantId: string,
    vehicleId: string,
    driverId: string | null,
    index: number,
    options: FactoryOptions = {}
  ): Route {
    const { overrides = {} } = options;

    const id = this.generateDeterministicUUID(`route-${tenantId}-${vehicleId}-${index}`);

    const startLocation = this.faker.helpers.arrayElement(this.US_LOCATIONS);
    const endLocation = this.faker.helpers.arrayElement(
      this.US_LOCATIONS.filter(loc => loc.name !== startLocation.name)
    );

    const routeType = this.faker.helpers.arrayElement(this.ROUTE_TYPES);
    const routeName = `${routeType.replace('_', ' ')} - ${startLocation.name.split(',')[0]} to ${endLocation.name.split(',')[0]}`;

    const status = this.weightedRandom<Status>([
      { value: 'pending', weight: 15 },
      { value: 'in_progress', weight: 25 },
      { value: 'completed', weight: 50 },
      { value: 'cancelled', weight: 10 },
    ]);

    // Calculate approximate distance (simplified Haversine)
    const latDiff = endLocation.lat - startLocation.lat;
    const lonDiff = endLocation.lon - startLocation.lon;
    const totalDistance = this.faker.number.float({
      min: Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 60,
      max: Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 80,
      fractionDigits: 2,
    });

    // Estimated duration (assume 50 mph average)
    const estimatedDuration = Math.round((totalDistance / 50) * 60);

    const plannedStartTime = this.faker.date.recent({ days: 7 });
    const plannedEndTime = new Date(plannedStartTime.getTime() + estimatedDuration * 60 * 1000);

    let actualStartTime: Date | null = null;
    let actualEndTime: Date | null = null;
    let actualDuration: number | null = null;

    if (status === 'in_progress' || status === 'completed') {
      actualStartTime = this.faker.date.between({
        from: plannedStartTime,
        to: new Date(plannedStartTime.getTime() + 30 * 60 * 1000),
      });

      if (status === 'completed') {
        const variance = this.faker.number.float({ min: 0.9, max: 1.2 });
        actualDuration = Math.round(estimatedDuration * variance);
        actualEndTime = new Date(actualStartTime.getTime() + actualDuration * 60 * 1000);
      }
    }

    // Generate waypoints
    const waypointCount = this.faker.number.int({ min: 2, max: 6 });
    const waypoints = this.generateWaypoints(startLocation, endLocation, waypointCount);
    const optimizedWaypoints = status !== 'pending' ? this.optimizeWaypoints(waypoints) : null;

    // Generate route geometry (GeoJSON LineString)
    const routeGeometry = this.generateRouteGeometry(startLocation, endLocation, waypointCount);

    return {
      id,
      tenant_id: tenantId,
      route_name: routeName,
      vehicle_id: vehicleId,
      driver_id: driverId,
      status,
      route_type: routeType,
      start_location: startLocation.name,
      end_location: endLocation.name,
      planned_start_time: plannedStartTime,
      planned_end_time: plannedEndTime,
      actual_start_time: actualStartTime,
      actual_end_time: actualEndTime,
      total_distance: totalDistance,
      estimated_duration: estimatedDuration,
      actual_duration: actualDuration,
      waypoints,
      optimized_waypoints: optimizedWaypoints,
      route_geometry: routeGeometry,
      notes: this.faker.datatype.boolean({ probability: 0.4 }) ? this.faker.lorem.sentence() : null,
      created_at: this.randomPastDate(30),
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Build multiple routes
   */
  buildList(
    tenantId: string,
    vehicleId: string,
    driverId: string | null,
    count: number,
    options: FactoryOptions = {}
  ): Route[] {
    return Array.from({ length: count }, (_, i) =>
      this.build(tenantId, vehicleId, driverId, i, options)
    );
  }

  /**
   * Generate waypoints between start and end
   */
  private generateWaypoints(start: Location, end: Location, count: number): Record<string, any> {
    const stops = [];
    for (let i = 0; i < count; i++) {
      const ratio = (i + 1) / (count + 1);
      const lat = start.lat + (end.lat - start.lat) * ratio;
      const lon = start.lon + (end.lon - start.lon) * ratio;

      stops.push({
        sequence: i + 1,
        address: this.faker.location.streetAddress(),
        city: this.faker.location.city(),
        latitude: lat,
        longitude: lon,
        arrivalTime: null,
        departureTime: null,
        status: 'pending',
      });
    }
    return { stops };
  }

  /**
   * Simulate route optimization
   */
  private optimizeWaypoints(waypoints: Record<string, any>): Record<string, any> {
    // In reality, this would use a route optimization algorithm
    return { ...waypoints, optimized: true };
  }

  /**
   * Generate GeoJSON LineString for route
   */
  private generateRouteGeometry(start: Location, end: Location, segments: number): Record<string, any> {
    const coordinates = [];
    for (let i = 0; i <= segments; i++) {
      const ratio = i / segments;
      const lat = start.lat + (end.lat - start.lat) * ratio;
      const lon = start.lon + (end.lon - start.lon) * ratio;
      coordinates.push([lon, lat]); // GeoJSON uses [lon, lat]
    }

    return {
      type: 'LineString',
      coordinates,
    };
  }
}
