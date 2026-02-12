/**
 * TenantFactory - Generates multi-tenant organization data
 */
import type { Tenant, FactoryOptions } from '../types';

import { BaseFactory } from './BaseFactory';

export class TenantFactory extends BaseFactory {
  /**
   * Generate a single tenant
   */
  build(index: number, options: FactoryOptions = {}): Tenant {
    const { overrides = {} } = options;

    const companyName = this.faker.company.name();
    const subdomain = this.faker.internet.domainWord();

    const id = this.generateDeterministicUUID(`tenant-${index}`);

    return {
      id,
      name: companyName,
      subdomain: `${subdomain}-${index}`,
      settings: {
        timezone: this.faker.location.timeZone(),
        locale: 'en-US',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        features: {
          gps_tracking: true,
          maintenance_alerts: true,
          fuel_tracking: true,
          driver_safety: true,
          route_optimization: true,
          ev_charging: this.faker.datatype.boolean({ probability: 0.3 }),
        },
        notifications: {
          email: true,
          sms: this.faker.datatype.boolean({ probability: 0.7 }),
          push: true,
        },
        billing: {
          plan: this.weightedRandom([
            { value: 'starter', weight: 20 },
            { value: 'professional', weight: 50 },
            { value: 'enterprise', weight: 30 },
          ]),
          vehicle_limit: this.faker.number.int({ min: 10, max: 500 }),
        },
      },
      is_active: this.faker.datatype.boolean({ probability: 0.95 }),
      created_at: this.randomPastDate(365),
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Build multiple tenants
   */
  buildList(count: number, options: FactoryOptions = {}): Tenant[] {
    return Array.from({ length: count }, (_, i) => this.build(i, options));
  }

  /**
   * Build with specific subdomain
   */
  buildWithSubdomain(subdomain: string, index: number = 0): Tenant {
    return this.build(index, { overrides: { subdomain } });
  }

  /**
   * Build inactive tenant
   */
  buildInactive(index: number): Tenant {
    return this.build(index, { overrides: { is_active: false } });
  }
}
