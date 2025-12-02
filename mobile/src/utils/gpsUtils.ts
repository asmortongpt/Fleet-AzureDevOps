/**
 * Fleet Mobile GPS Utilities
 *
 * Comprehensive GPS and location utilities for distance calculation,
 * geocoding, geofencing, and location tracking
 */

import Geolocation from 'react-native-geolocation-service';
import {
  GeoLocation,
  LocationError,
  LocationErrorCode,
  LocationPermissionStatus,
} from '../types';

// ============================================================================
// GPS Service
// ============================================================================

export class GPSService {
  private static instance: GPSService;
  private watchId: number | null = null;
  private currentLocation: GeoLocation | null = null;
  private locationCallbacks: ((location: GeoLocation) => void)[] = [];

  private constructor() {}

  public static getInstance(): GPSService {
    if (!GPSService.instance) {
      GPSService.instance = new GPSService();
    }
    return GPSService.instance;
  }

  /**
   * Get current location
   */
  public async getCurrentLocation(
    timeout: number = 15000,
    highAccuracy: boolean = true
  ): Promise<GeoLocation> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const location: GeoLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude ?? undefined,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
            timestamp: new Date(position.timestamp),
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          reject(
            new LocationError(
              error.message,
              this.mapErrorCode(error.code),
              error
            )
          );
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: 10000,
          showLocationDialog: true,
        }
      );
    });
  }

  /**
   * Start watching location changes
   */
  public startWatching(
    callback: (location: GeoLocation) => void,
    options?: {
      distanceFilter?: number;
      interval?: number;
      highAccuracy?: boolean;
    }
  ): void {
    if (this.watchId !== null) {
      this.stopWatching();
    }

    this.locationCallbacks.push(callback);

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location: GeoLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude ?? undefined,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: new Date(position.timestamp),
        };
        this.currentLocation = location;
        this.notifyCallbacks(location);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      {
        enableHighAccuracy: options?.highAccuracy ?? true,
        distanceFilter: options?.distanceFilter ?? 10,
        interval: options?.interval ?? 5000,
        fastestInterval: 2000,
        showLocationDialog: true,
      }
    );
  }

  /**
   * Stop watching location changes
   */
  public stopWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get cached location
   */
  public getCachedLocation(): GeoLocation | null {
    return this.currentLocation;
  }

  /**
   * Add location callback
   */
  public addCallback(callback: (location: GeoLocation) => void): void {
    this.locationCallbacks.push(callback);
  }

  /**
   * Remove location callback
   */
  public removeCallback(callback: (location: GeoLocation) => void): void {
    this.locationCallbacks = this.locationCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(location: GeoLocation): void {
    this.locationCallbacks.forEach((callback) => callback(location));
  }

  /**
   * Map error codes
   */
  private mapErrorCode(code: number): LocationErrorCode {
    switch (code) {
      case 1:
        return LocationErrorCode.PERMISSION_DENIED;
      case 2:
        return LocationErrorCode.LOCATION_UNAVAILABLE;
      case 3:
        return LocationErrorCode.TIMEOUT;
      default:
        return LocationErrorCode.UNKNOWN;
    }
  }

  /**
   * Check location permission status
   */
  public async checkPermission(): Promise<LocationPermissionStatus> {
    return new Promise((resolve) => {
      Geolocation.requestAuthorization('whenInUse').then((status) => {
        resolve({
          granted: status === 'granted',
          canAskAgain: status !== 'denied',
          status:
            status === 'granted'
              ? 'granted'
              : status === 'denied'
              ? 'blocked'
              : 'denied',
        });
      });
    });
  }
}

// ============================================================================
// Distance Calculations
// ============================================================================

export class DistanceCalculator {
  /**
   * Calculate distance between two points using Haversine formula (in meters)
   */
  public static calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Format distance for display
   */
  public static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(meters / 1000)}km`;
    }
  }

  /**
   * Calculate bearing between two points (in degrees)
   */
  public static calculateBearing(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return ((θ * 180) / Math.PI + 360) % 360;
  }

  /**
   * Get compass direction from bearing
   */
  public static bearingToDirection(bearing: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  /**
   * Calculate speed (m/s to km/h)
   */
  public static metersPerSecondToKmh(speed: number): number {
    return speed * 3.6;
  }

  /**
   * Calculate speed (m/s to mph)
   */
  public static metersPerSecondToMph(speed: number): number {
    return speed * 2.237;
  }

  /**
   * Format speed
   */
  public static formatSpeed(
    metersPerSecond: number,
    unit: 'kmh' | 'mph' = 'kmh'
  ): string {
    const speed =
      unit === 'kmh'
        ? this.metersPerSecondToKmh(metersPerSecond)
        : this.metersPerSecondToMph(metersPerSecond);
    return `${Math.round(speed)} ${unit}`;
  }
}

// ============================================================================
// Geofencing
// ============================================================================

export interface Geofence {
  id: string;
  name: string;
  center: { latitude: number; longitude: number };
  radius: number; // in meters
  active: boolean;
}

export interface GeofenceEvent {
  geofence: Geofence;
  type: 'enter' | 'exit';
  location: GeoLocation;
  timestamp: Date;
}

export class GeofenceManager {
  private geofences: Map<string, Geofence> = new Map();
  private insideGeofences: Set<string> = new Set();
  private callbacks: ((event: GeofenceEvent) => void)[] = [];

  /**
   * Add geofence
   */
  public addGeofence(geofence: Geofence): void {
    this.geofences.set(geofence.id, geofence);
  }

  /**
   * Remove geofence
   */
  public removeGeofence(id: string): void {
    this.geofences.delete(id);
    this.insideGeofences.delete(id);
  }

  /**
   * Get all geofences
   */
  public getGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Check if location is inside geofence
   */
  public isInsideGeofence(
    location: { latitude: number; longitude: number },
    geofence: Geofence
  ): boolean {
    const distance = DistanceCalculator.calculateDistance(location, geofence.center);
    return distance <= geofence.radius;
  }

  /**
   * Check location against all geofences
   */
  public checkLocation(location: GeoLocation): GeofenceEvent[] {
    const events: GeofenceEvent[] = [];

    this.geofences.forEach((geofence) => {
      if (!geofence.active) return;

      const isInside = this.isInsideGeofence(location, geofence);
      const wasInside = this.insideGeofences.has(geofence.id);

      if (isInside && !wasInside) {
        // Entered geofence
        this.insideGeofences.add(geofence.id);
        const event: GeofenceEvent = {
          geofence,
          type: 'enter',
          location,
          timestamp: new Date(),
        };
        events.push(event);
        this.notifyCallbacks(event);
      } else if (!isInside && wasInside) {
        // Exited geofence
        this.insideGeofences.delete(geofence.id);
        const event: GeofenceEvent = {
          geofence,
          type: 'exit',
          location,
          timestamp: new Date(),
        };
        events.push(event);
        this.notifyCallbacks(event);
      }
    });

    return events;
  }

  /**
   * Add callback for geofence events
   */
  public addCallback(callback: (event: GeofenceEvent) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove callback
   */
  public removeCallback(callback: (event: GeofenceEvent) => void): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  /**
   * Notify callbacks
   */
  private notifyCallbacks(event: GeofenceEvent): void {
    this.callbacks.forEach((callback) => callback(event));
  }
}

// ============================================================================
// Route Tracking
// ============================================================================

export interface RoutePoint {
  location: GeoLocation;
  timestamp: Date;
}

export interface Route {
  id: string;
  points: RoutePoint[];
  totalDistance: number;
  duration: number;
  averageSpeed: number;
}

export class RouteTracker {
  private points: RoutePoint[] = [];
  private isTracking: boolean = false;
  private startTime: Date | null = null;

  /**
   * Start tracking route
   */
  public startTracking(): void {
    this.isTracking = true;
    this.startTime = new Date();
    this.points = [];
  }

  /**
   * Stop tracking route
   */
  public stopTracking(): Route | null {
    if (!this.isTracking) return null;

    this.isTracking = false;
    const endTime = new Date();

    if (this.points.length < 2) return null;

    const totalDistance = this.calculateTotalDistance();
    const duration = endTime.getTime() - (this.startTime?.getTime() || 0);
    const averageSpeed = totalDistance / (duration / 1000); // m/s

    return {
      id: `route_${Date.now()}`,
      points: this.points,
      totalDistance,
      duration,
      averageSpeed,
    };
  }

  /**
   * Add location point
   */
  public addPoint(location: GeoLocation): void {
    if (!this.isTracking) return;

    this.points.push({
      location,
      timestamp: new Date(),
    });
  }

  /**
   * Calculate total distance
   */
  private calculateTotalDistance(): number {
    let distance = 0;
    for (let i = 1; i < this.points.length; i++) {
      distance += DistanceCalculator.calculateDistance(
        this.points[i - 1].location,
        this.points[i].location
      );
    }
    return distance;
  }

  /**
   * Get current route
   */
  public getCurrentRoute(): RoutePoint[] {
    return [...this.points];
  }

  /**
   * Clear route
   */
  public clear(): void {
    this.points = [];
    this.startTime = null;
  }
}

// ============================================================================
// Coordinate Utilities
// ============================================================================

export class CoordinateUtils {
  /**
   * Validate coordinates
   */
  public static isValidCoordinate(
    latitude: number,
    longitude: number
  ): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Format coordinates for display
   */
  public static formatCoordinates(
    latitude: number,
    longitude: number,
    precision: number = 6
  ): string {
    return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
  }

  /**
   * Convert decimal degrees to DMS (Degrees Minutes Seconds)
   */
  public static toDMS(
    decimal: number,
    isLatitude: boolean
  ): string {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesDecimal = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

    const direction = isLatitude
      ? decimal >= 0
        ? 'N'
        : 'S'
      : decimal >= 0
      ? 'E'
      : 'W';

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  }

  /**
   * Calculate bounding box
   */
  public static calculateBoundingBox(
    locations: { latitude: number; longitude: number }[],
    padding: number = 0.1
  ): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    if (locations.length === 0) {
      return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
    }

    let minLat = locations[0].latitude;
    let maxLat = locations[0].latitude;
    let minLng = locations[0].longitude;
    let maxLng = locations[0].longitude;

    locations.forEach((loc) => {
      minLat = Math.min(minLat, loc.latitude);
      maxLat = Math.max(maxLat, loc.latitude);
      minLng = Math.min(minLng, loc.longitude);
      maxLng = Math.max(maxLng, loc.longitude);
    });

    const latPadding = (maxLat - minLat) * padding;
    const lngPadding = (maxLng - minLng) * padding;

    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding,
    };
  }

  /**
   * Calculate center point
   */
  public static calculateCenter(
    locations: { latitude: number; longitude: number }[]
  ): { latitude: number; longitude: number } {
    if (locations.length === 0) {
      return { latitude: 0, longitude: 0 };
    }

    let totalLat = 0;
    let totalLng = 0;

    locations.forEach((loc) => {
      totalLat += loc.latitude;
      totalLng += loc.longitude;
    });

    return {
      latitude: totalLat / locations.length,
      longitude: totalLng / locations.length,
    };
  }

  /**
   * Generate Google Maps URL
   */
  public static toGoogleMapsUrl(
    latitude: number,
    longitude: number,
    label?: string
  ): string {
    const coords = `${latitude},${longitude}`;
    const query = label ? `${label}@${coords}` : coords;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      query
    )}`;
  }

  /**
   * Generate Apple Maps URL
   */
  public static toAppleMapsUrl(
    latitude: number,
    longitude: number,
    label?: string
  ): string {
    const coords = `${latitude},${longitude}`;
    const query = label ? `${label}&ll=${coords}` : `ll=${coords}`;
    return `http://maps.apple.com/?${query}`;
  }
}

// ============================================================================
// Exported Singletons
// ============================================================================

export const gpsService = GPSService.getInstance();
export const geofenceManager = new GeofenceManager();
export const routeTracker = new RouteTracker();
