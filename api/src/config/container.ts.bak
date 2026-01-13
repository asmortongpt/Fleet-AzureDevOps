import { Pool } from 'pg';

import { CacheService } from '../config/cache';
import { DriverService } from '../services/DriverService';
import { VehicleService } from '../services/VehicleService';

export class Container {
  private static instances = new Map<string, any>();

  static register<T>(key: string, factory: () => T): void {
    this.instances.set(key, factory());
  }

  static resolve<T>(key: string): T {
    if (!this.instances.has(key)) {
      throw new Error(`Service '${key}' not registered in container`);
    }
    return this.instances.get(key);
  }

  static initialize(pool: Pool): void {
    // Register services
    this.register('VehicleService', () => new VehicleService(pool));
    this.register('DriverService', () => new DriverService(pool));
    this.register('CacheService', () => new CacheService());

    // Register database pool
    this.register('DatabasePool', () => pool);
  }
}

export function inject<T>(serviceName: string): T {
  return Container.resolve<T>(serviceName);
}
