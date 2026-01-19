/**
 * Redis Service
 * Stub implementation for TypeScript compilation
 */

export class RedisService {
  static getInstance(): RedisService {
    return new RedisService();
  }

  async get(key: string): Promise<string | null> {
    return null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    // Stub implementation
  }

  async del(key: string): Promise<void> {
    // Stub implementation
  }
}

export default RedisService;
