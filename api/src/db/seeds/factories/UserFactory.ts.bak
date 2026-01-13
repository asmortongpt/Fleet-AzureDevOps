/**
 * UserFactory - Generates user accounts with RBAC
 */
import { hashSync } from 'bcrypt';
import { BaseFactory } from './BaseFactory';
import type { User, UserRole, FactoryOptions } from '../types';

export class UserFactory extends BaseFactory {
  // Default password for all test users (hashed with bcrypt cost 12)
  private readonly DEFAULT_PASSWORD = 'FleetTest2026!';
  private readonly BCRYPT_ROUNDS = 12;

  /**
   * Generate a single user
   */
  build(
    tenantId: string,
    index: number,
    role?: UserRole,
    options: FactoryOptions = {}
  ): User {
    const { overrides = {} } = options;

    const firstName = this.faker.person.firstName();
    const lastName = this.faker.person.lastName();
    const email = this.faker.internet
      .email({
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
      })
      .toLowerCase();

    const id = this.generateDeterministicUUID(`user-${tenantId}-${index}`);

    // Determine role with realistic distribution
    const assignedRole: UserRole =
      role ||
      this.weightedRandom<UserRole>([
        { value: 'SuperAdmin', weight: 2 },
        { value: 'Admin', weight: 5 },
        { value: 'Manager', weight: 10 },
        { value: 'Supervisor', weight: 15 },
        { value: 'Driver', weight: 40 },
        { value: 'Dispatcher', weight: 10 },
        { value: 'Mechanic', weight: 10 },
        { value: 'Viewer', weight: 8 },
      ]);

    // Hash password using bcrypt (cost factor 12+)
    const passwordHash = hashSync(this.DEFAULT_PASSWORD, this.BCRYPT_ROUNDS);

    return {
      id,
      tenant_id: tenantId,
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role: assignedRole,
      is_active: this.faker.datatype.boolean({ probability: 0.92 }),
      last_login_at: this.faker.datatype.boolean({ probability: 0.75 })
        ? this.randomPastDate(30)
        : null,
      created_at: this.randomPastDate(180),
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Build multiple users for a tenant
   */
  buildList(tenantId: string, count: number, options: FactoryOptions = {}): User[] {
    return Array.from({ length: count }, (_, i) => this.build(tenantId, i, undefined, options));
  }

  /**
   * Build user with specific role
   */
  buildWithRole(tenantId: string, role: UserRole, index: number = 0): User {
    return this.build(tenantId, index, role);
  }

  /**
   * Build SuperAdmin user
   */
  buildSuperAdmin(tenantId: string, index: number = 0): User {
    return this.buildWithRole(tenantId, 'SuperAdmin', index);
  }

  /**
   * Build Admin user
   */
  buildAdmin(tenantId: string, index: number = 0): User {
    return this.buildWithRole(tenantId, 'Admin', index);
  }

  /**
   * Build Driver user
   */
  buildDriver(tenantId: string, index: number = 0): User {
    return this.buildWithRole(tenantId, 'Driver', index);
  }

  /**
   * Build Mechanic user
   */
  buildMechanic(tenantId: string, index: number = 0): User {
    return this.buildWithRole(tenantId, 'Mechanic', index);
  }

  /**
   * Build inactive user
   */
  buildInactive(tenantId: string, index: number = 0): User {
    return this.build(tenantId, index, undefined, { overrides: { is_active: false } });
  }

  /**
   * Get the default password used for all test users
   */
  getDefaultPassword(): string {
    return this.DEFAULT_PASSWORD;
  }
}
