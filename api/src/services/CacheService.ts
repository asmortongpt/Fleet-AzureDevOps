
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get(key: string) {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl = 3600) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Cache vehicle data with 5 minute TTL
  async cacheVehicle(vehicleId: number, data: any) {
    await this.set(`vehicle:${vehicleId}`, data, 300);
  }

  // Invalidate all vehicle cache when updated
  async invalidateVehicle(vehicleId: number) {
    await this.invalidate(`vehicle:${vehicleId}*`);
  }
}
