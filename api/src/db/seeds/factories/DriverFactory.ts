/**
 * DriverFactory - Generates driver records with valid license data
 */
import type { Driver, DriverStatus, FactoryOptions } from '../types';

import { BaseFactory } from './BaseFactory';

export class DriverFactory extends BaseFactory {
  // US states for driver's licenses
  private readonly US_STATES = [
    'CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI',
  ];

  /**
   * Generate a single driver
   */
  build(
    tenantId: string,
    userId: string,
    index: number,
    options: FactoryOptions = {}
  ): Driver {
    const { overrides = {} } = options;

    const id = this.generateDeterministicUUID(`driver-${tenantId}-${index}`);
    const firstName = this.faker.person.firstName();
    const lastName = this.faker.person.lastName();
    const state = this.faker.helpers.arrayElement(this.US_STATES);
    const licenseNumber = this.generateDriverLicenseNumber(state);
    const employeeNumber = this.generateEmployeeNumber('DRV', index);

    // Realistic status distribution
    const status = this.weightedRandom<DriverStatus>([
      { value: 'active', weight: 85 },
      { value: 'on_leave', weight: 10 },
      { value: 'suspended', weight: 3 },
      { value: 'terminated', weight: 2 },
    ]);

    // Generate realistic hire date (1-10 years ago)
    const hireDate = this.faker.date.past({ years: 10 });
    const yearsEmployed = (new Date().getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);



    // License expiry (1-5 years from now for active drivers)
    const licenseExpiry =
      status === 'active' || status === 'on_leave'
        ? this.randomFutureDate(365 * this.faker.number.int({ min: 1, max: 5 }))
        : this.randomPastDate(365); // Expired for inactive/terminated

    return {
      id,
      tenant_id: tenantId,
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      employee_number: employeeNumber,
      license_number: licenseNumber,
      license_state: state,
      license_expiration: licenseExpiry,
      status,

      hire_date: hireDate,
      phone: this.generatePhoneNumber(),
      email: this.faker.internet.email({ firstName, lastName }).toLowerCase(),
      created_at: hireDate,
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Build multiple drivers for a tenant
   */
  buildList(
    tenantId: string,
    userIds: string[],
    options: FactoryOptions = {}
  ): Driver[] {
    return userIds.map((userId, i) => this.build(tenantId, userId, i, options));
  }

  /**
   * Build driver with specific status
   */
  buildWithStatus(
    tenantId: string,
    userId: string,
    status: DriverStatus,
    index: number = 0
  ): Driver {
    return this.build(tenantId, userId, index, { overrides: { status } });
  }

  /**
   * Build active driver with high safety score
   */
  buildSafeDriver(tenantId: string, userId: string, index: number = 0): Driver {
    return this.build(tenantId, userId, index, {
      overrides: {
        status: 'active',
      },
    });
  }

  /**
   * Build driver with expired license
   */
  buildExpiredLicense(tenantId: string, userId: string, index: number = 0): Driver {
    return this.build(tenantId, userId, index, {
      overrides: {
        license_expiration: this.randomPastDate(365),
        status: 'suspended',
      },
    });
  }

  /**
   * Build new driver (recently hired, in training)
   */
  buildNewDriver(tenantId: string, userId: string, index: number = 0): Driver {
    const recentHireDate = this.faker.date.recent({ days: 90 });
    return this.build(tenantId, userId, index, {
      overrides: {
        status: 'active',
        hire_date: recentHireDate,
        created_at: recentHireDate,
      },
    });
  }

  /**
   * Generate realistic driver's license number by state
   */
  private generateDriverLicenseNumber(state: string): string {
    const formats: Record<string, () => string> = {
      CA: () => this.faker.string.alpha(1).toUpperCase() + this.faker.string.numeric(7),
      TX: () => this.faker.string.numeric(8),
      FL: () => this.faker.string.alpha(1).toUpperCase() + this.faker.string.numeric(12),
      NY: () => this.faker.string.numeric(9),
      PA: () => this.faker.string.numeric(8),
      IL: () => this.faker.string.alpha(1).toUpperCase() + this.faker.string.numeric(11),
      OH: () => this.faker.string.alpha(2).toUpperCase() + this.faker.string.numeric(6),
      GA: () => this.faker.string.numeric(9),
      NC: () => this.faker.string.numeric(12),
      MI: () => this.faker.string.alpha(1).toUpperCase() + this.faker.string.numeric(12),
    };

    const format = formats[state] || formats.CA;
    return format();
  }
}
