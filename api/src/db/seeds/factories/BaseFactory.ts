/**
 * Base Factory with deterministic UUID generation and seeded Faker
 */
import { createHash } from 'crypto';

import { faker } from '@faker-js/faker';

// UUIDv5 namespace for fleet-test deterministic IDs
const FLEET_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export class BaseFactory {
  protected faker: typeof faker;
  protected seed: string;

  constructor(seed: string = 'fleet-test-2026') {
    this.seed = seed;
    this.faker = faker;
    // Seed the faker instance for deterministic data
    this.faker.seed(this.hashSeed(seed));
  }

  /**
   * Convert string seed to numeric seed for Faker
   */
  private hashSeed(seed: string): number {
    const hash = createHash('sha256').update(seed).digest();
    return hash.readUInt32BE(0);
  }

  /**
   * Generate deterministic UUID v5 from namespace and name
   */
  protected generateDeterministicUUID(name: string, namespace: string = FLEET_NAMESPACE): string {
    // Create SHA-1 hash of namespace + name
    const hash = createHash('sha1')
      .update(namespace + name)
      .digest();

    // Set version (5) and variant bits per RFC 4122
    hash[6] = (hash[6] & 0x0f) | 0x50; // Version 5
    hash[8] = (hash[8] & 0x3f) | 0x80; // Variant 10

    // Format as UUID string
    return [
      hash.subarray(0, 4).toString('hex'),
      hash.subarray(4, 6).toString('hex'),
      hash.subarray(6, 8).toString('hex'),
      hash.subarray(8, 10).toString('hex'),
      hash.subarray(10, 16).toString('hex'),
    ].join('-');
  }

  /**
   * Generate a realistic VIN (Vehicle Identification Number)
   * Format: WMI (3) + VDS (6) + VIS (8) = 17 characters
   */
  protected generateVIN(make: string, index: number): string {
    // World Manufacturer Identifier (WMI) - 3 chars
    const wmiMap: Record<string, string> = {
      Ford: '1FA',
      Chevrolet: '1GC',
      Toyota: '4T1',
      Honda: '1HG',
      Nissan: '1N4',
      Tesla: '5YJ',
      GMC: '1GT',
      RAM: '1C6',
      Freightliner: '1FU',
      'International': '1HT',
    };
    const wmi = wmiMap[make] || '1XX';

    // Vehicle Descriptor Section (VDS) - 6 chars (only uppercase alphanumeric, no I,O,Q per VIN standard)
    const validChars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'; // Excludes I, O, Q
    let vds = '';
    for (let i = 0; i < 6; i++) {
      vds += validChars[this.faker.number.int({ min: 0, max: validChars.length - 1 })];
    }

    // Vehicle Identifier Section (VIS) - 8 chars (year code + plant + serial)
    const year = String(this.faker.date.past({ years: 10 }).getFullYear()).slice(-1); // 1 digit
    const plant = validChars[this.faker.number.int({ min: 0, max: validChars.length - 1 })]; // 1 char
    const serial = String(index).padStart(6, '0'); // 6 digits = 8 total

    return `${wmi}${vds}${year}${plant}${serial}`;
  }

  /**
   * Generate realistic US license plate
   */
  protected generateLicensePlate(state: string): string {
    const formats: Record<string, () => string> = {
      CA: () => `${this.faker.string.numeric(1)}${this.faker.string.alpha(3).toUpperCase()}${this.faker.string.numeric(3)}`,
      TX: () => `${this.faker.string.alpha(3).toUpperCase()}${this.faker.string.numeric(4)}`,
      FL: () => `${this.faker.string.alpha(3).toUpperCase()} ${this.faker.string.alpha(1).toUpperCase()}${this.faker.string.numeric(2)}`,
      NY: () => `${this.faker.string.alpha(3).toUpperCase()}${this.faker.string.numeric(4)}`,
      PA: () => `${this.faker.string.alpha(3).toUpperCase()}${this.faker.string.numeric(4)}`,
      IL: () => `${this.faker.string.alpha(2).toUpperCase()}${this.faker.string.numeric(5)}`,
      OH: () => `${this.faker.string.alpha(3).toUpperCase()}${this.faker.string.numeric(4)}`,
      GA: () => `${this.faker.string.alpha(3).toUpperCase()}${this.faker.string.numeric(4)}`,
      NC: () => `${this.faker.string.alpha(3).toUpperCase()}${this.faker.string.numeric(4)}`,
      MI: () => `${this.faker.string.alpha(3).toUpperCase()}${this.faker.string.numeric(4)}`,
    };

    const format = formats[state] || formats.CA;
    return format();
  }

  /**
   * Generate realistic employee number
   */
  protected generateEmployeeNumber(prefix: string, index: number): string {
    return `${prefix}-${String(index).padStart(6, '0')}`;
  }

  /**
   * Generate realistic work order number
   */
  protected generateWorkOrderNumber(prefix: string, year: number, index: number): string {
    return `${prefix}-${year}-${String(index).padStart(5, '0')}-${this.faker.string.alphanumeric(8).toUpperCase()}`;
  }

  /**
   * Generate US phone number
   */
  protected generatePhoneNumber(): string {
    const areaCode = this.faker.string.numeric(3);
    const prefix = this.faker.string.numeric(3);
    const lineNumber = this.faker.string.numeric(4);
    return `${areaCode}-${prefix}-${lineNumber}`;
  }

  /**
   * Pick weighted random item from array
   */
  protected weightedRandom<T>(items: Array<{ value: T; weight: number }>): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.faker.number.float({ min: 0, max: totalWeight });

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.value;
      }
    }

    return items[0].value;
  }

  /**
   * Get random date within range
   */
  protected randomDate(from: Date, to: Date): Date {
    return this.faker.date.between({ from, to });
  }

  /**
   * Get random past date
   */
  protected randomPastDate(days: number): Date {
    return this.faker.date.past({ years: days / 365 });
  }

  /**
   * Get random future date
   */
  protected randomFutureDate(days: number): Date {
    return this.faker.date.future({ years: days / 365 });
  }
}
