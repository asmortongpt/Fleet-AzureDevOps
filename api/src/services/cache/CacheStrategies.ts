// Cache Invalidation Strategies
// Implements various caching patterns for different data types

import logger from '../../config/logger';
import { cacheService } from './RedisService';

export class CacheStrategies {
  // Cache-aside pattern for vehicles
  static async getVehicle(id: string) {
    const cacheKey = `vehicle:${id}`;

    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const vehicle = await this.fetchVehicleFromDB(id);

    // Store in cache (TTL: 5 minutes)
    await cacheService.set(cacheKey, vehicle, 300);

    return vehicle;
  }

  // Write-through pattern for vehicle updates
  static async updateVehicle(id: string, data: any) {
    // Update database first
    const updated = await this.updateVehicleInDB(id, data);

    // Update cache
    await cacheService.set(`vehicle:${id}`, updated, 300);

    // Invalidate related caches
    await cacheService.invalidatePattern(`vehicle-list:*`);

    return updated;
  }

  // Time-based invalidation for lists
  static async getVehicleList(filters: any) {
    const cacheKey = `vehicle-list:${JSON.stringify(filters)}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const vehicles = await this.fetchVehiclesFromDB(filters);

    // Cache list for 1 minute (shorter TTL for dynamic data)
    await cacheService.set(cacheKey, vehicles, 60);

    return vehicles;
  }

  // Event-based invalidation for reservations
  static async invalidateReservationCaches(vehicleId: string) {
    await cacheService.invalidatePattern(`reservation:*:vehicle:${vehicleId}`);
    await cacheService.invalidatePattern(`availability:${vehicleId}:*`);
    await cacheService.invalidatePattern(`calendar:*`);
  }

  // Probabilistic early expiration (prevent cache stampede)
  static async getWithProbabilisticRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    delta: number = 60
  ): Promise<T> {
    const cached = await cacheService.get<{ data: T; expiry: number }>(key);

    if (cached) {
      const timeRemaining = cached.expiry - Date.now() / 1000;

      // Probabilistic refresh
      const refreshProbability = delta / timeRemaining;
      if (Math.random() < refreshProbability) {
        // Refresh in background
        this.refreshInBackground(key, fetcher, ttl);
      }

      return cached.data;
    }

    // Cache miss
    const data = await fetcher();
    await cacheService.set(key, { data, expiry: Date.now() / 1000 + ttl }, ttl);
    return data;
  }

  private static async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      await cacheService.set(key, { data, expiry: Date.now() / 1000 + ttl }, ttl);
    } catch (error) {
      logger.error('Background refresh failed:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  // Placeholder methods (would be real DB calls in production)
  private static async fetchVehicleFromDB(id: string): Promise<any> {
    const response = await fetch(`/api/v1/vehicles/${id}`);
    return response.json();
  }

  private static async updateVehicleInDB(id: string, data: any): Promise<any> {
    const response = await fetch(`/api/v1/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  private static async fetchVehiclesFromDB(filters: any): Promise<any[]> {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/v1/vehicles?${query}`);
    const json = await response.json();
    return json.vehicles || [];
  }
}
