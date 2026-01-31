/**
 * VehicleFactory - Generates fleet vehicles with realistic data
 */
import type { Vehicle, VehicleStatus, VehicleType, FuelType, FactoryOptions } from '../types';

import { BaseFactory } from './BaseFactory';

interface VehicleConfig {
  make: string;
  models: string[];
  types: VehicleType[];
  fuelTypes: FuelType[];
  yearRange: { min: number; max: number };
}

export class VehicleFactory extends BaseFactory {
  // Realistic vehicle configurations by make
  private readonly VEHICLE_CONFIGS: VehicleConfig[] = [
    {
      make: 'Ford',
      models: ['F-150', 'Transit', 'E-Series', 'Expedition', 'Explorer'],
      types: ['truck', 'van', 'suv'],
      fuelTypes: ['gasoline', 'diesel', 'hybrid'],
      yearRange: { min: 2018, max: 2025 },
    },
    {
      make: 'Chevrolet',
      models: ['Silverado', 'Express', 'Suburban', 'Tahoe', 'Colorado'],
      types: ['truck', 'van', 'suv'],
      fuelTypes: ['gasoline', 'diesel'],
      yearRange: { min: 2018, max: 2025 },
    },
    {
      make: 'Tesla',
      models: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
      types: ['sedan', 'suv', 'truck'],
      fuelTypes: ['electric'],
      yearRange: { min: 2020, max: 2025 },
    },
    {
      make: 'Toyota',
      models: ['Tacoma', 'Tundra', 'RAV4', 'Highlander', 'Sienna'],
      types: ['truck', 'suv', 'van'],
      fuelTypes: ['gasoline', 'hybrid'],
      yearRange: { min: 2018, max: 2025 },
    },
    {
      make: 'RAM',
      models: ['1500', '2500', '3500', 'ProMaster'],
      types: ['truck', 'van'],
      fuelTypes: ['gasoline', 'diesel'],
      yearRange: { min: 2019, max: 2025 },
    },
    {
      make: 'Freightliner',
      models: ['Sprinter', 'Cascadia', 'M2'],
      types: ['van', 'truck', 'construction'],
      fuelTypes: ['diesel', 'cng'],
      yearRange: { min: 2017, max: 2024 },
    },
  ];

  // US states for license plates
  private readonly US_STATES = [
    'CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI',
  ];

  // Major US cities for realistic locations
  private readonly US_CITIES = [
    { name: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
    { name: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
    { name: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918 },
    { name: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060 },
    { name: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
    { name: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
    { name: 'Columbus', state: 'OH', lat: 39.9612, lon: -82.9988 },
    { name: 'Atlanta', state: 'GA', lat: 33.7490, lon: -84.3880 },
    { name: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
    { name: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458 },
  ];

  /**
   * Generate a single vehicle
   */
  build(
    tenantId: string,
    index: number,
    assignedDriverId?: string,
    options: FactoryOptions = {}
  ): Vehicle {
    const { overrides = {} } = options;

    const config = this.faker.helpers.arrayElement(this.VEHICLE_CONFIGS);
    const model = this.faker.helpers.arrayElement(config.models);
    const vehicleType = this.faker.helpers.arrayElement(config.types);
    const fuelType = this.faker.helpers.arrayElement(config.fuelTypes);
    const year = this.faker.number.int(config.yearRange);

    const state = this.faker.helpers.arrayElement(this.US_STATES);
    const location = this.faker.helpers.arrayElement(this.US_CITIES);

    const id = this.generateDeterministicUUID(`vehicle-${tenantId}-${index}`);
    const vin = this.generateVIN(config.make, index);
    const licensePlate = this.generateLicensePlate(state);

    // Realistic status distribution
    const status = this.weightedRandom<VehicleStatus>([
      { value: 'active', weight: 80 },
      { value: 'maintenance', weight: 15 },
      { value: 'offline', weight: 3 },
      { value: 'retired', weight: 2 },
    ]);

    // Realistic mileage based on year
    const vehicleAge = 2026 - year;
    const baseMileage = vehicleAge * this.faker.number.int({ min: 8000, max: 15000 });
    const currentMileage = baseMileage + this.faker.number.int({ min: 0, max: 5000 });

    // Add slight randomization to location
    const latOffset = this.faker.number.float({ min: -0.1, max: 0.1, fractionDigits: 7 });
    const lonOffset = this.faker.number.float({ min: -0.1, max: 0.1, fractionDigits: 7 });

    return {
      id,
      tenant_id: tenantId,
      number: `VEH-${String(index + 1).padStart(4, '0')}`,
      vin,
      make: config.make,
      model,
      year,
      type: vehicleType,
      fuel_type: fuelType,
      status,
      license_plate: licensePlate,
      odometer: currentMileage,
      latitude: location.lat + latOffset,
      longitude: location.lon + lonOffset,

      assigned_driver_id: assignedDriverId || null,
      assigned_facility_id: null,
      metadata: {
        model3dUrl: this.get3DModelUrl(config.make, model),
        color: this.faker.vehicle.color(),
        purchaseDate: this.faker.date.past({ years: vehicleAge }),
        warrantyExpiry: this.faker.date.future({ years: Math.max(1, 5 - vehicleAge) }),
        insurancePolicy: `POL-${this.faker.string.alphanumeric(10).toUpperCase()}`,
        registrationExpiry: this.randomFutureDate(365),
        homeLocation: location.name,
      },
      created_at: this.randomPastDate(365 * vehicleAge),
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Build multiple vehicles for a tenant
   */
  buildList(tenantId: string, count: number, options: FactoryOptions = {}): Vehicle[] {
    return Array.from({ length: count }, (_, i) => this.build(tenantId, i, undefined, options));
  }

  /**
   * Build vehicle with specific status
   */
  buildWithStatus(
    tenantId: string,
    status: VehicleStatus,
    index: number = 0,
    assignedDriverId?: string
  ): Vehicle {
    return this.build(tenantId, index, assignedDriverId, { overrides: { status } });
  }

  /**
   * Build electric vehicle
   */
  buildElectric(tenantId: string, index: number = 0): Vehicle {
    const teslaConfig = this.VEHICLE_CONFIGS.find((c) => c.make === 'Tesla')!;
    const model = this.faker.helpers.arrayElement(teslaConfig.models);
    const year = this.faker.number.int(teslaConfig.yearRange);

    return this.build(tenantId, index, undefined, {
      overrides: {
        make: 'Tesla',
        model,
        year,
        fuel_type: 'electric',
        type: 'sedan',
      },
    });
  }

  /**
   * Build diesel truck
   */
  buildDieselTruck(tenantId: string, index: number = 0): Vehicle {
    return this.build(tenantId, index, undefined, {
      overrides: {
        make: 'Freightliner',
        model: 'Cascadia',
        type: 'truck',
        fuel_type: 'diesel',
      },
    });
  }

  /**
   * Get 3D model URL for virtual garage
   */
  private get3DModelUrl(make: string, model: string): string | null {
    // In production, these would be actual 3D model URLs
    const modelKey = `${make.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}`;
    return `https://cdn.fleet.example.com/models/${modelKey}.glb`;
  }
}
