
import { injectable } from 'inversify';
import Redis from 'ioredis';

export const CacheKeys = {
  vehicle: (id: number) => `vehicle:${id}`,
  vehicles: (tenantId: number) => `vehicles:${tenantId}:*`
};

@injectable()
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async get(key: string) {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl = 3600) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async delete(key: string) {
    await this.redis.del(key);
  }

  async deletePattern(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl = 3600): Promise<T> {
    const cached = await this.get(key);
    if (cached) return cached;
    const value = await fetcher();
    if (value) await this.set(key, value, ttl);
    return value;
  }

  // Legacy methods (aliases)
  async invalidate(pattern: string) {
    return this.deletePattern(pattern);
  }

  async cacheVehicle(vehicleId: number, data: any) {
    await this.set(CacheKeys.vehicle(vehicleId), data, 300);
  }

  async invalidateVehicle(vehicleId: number) {
    await this.delete(CacheKeys.vehicle(vehicleId));
  }
}
