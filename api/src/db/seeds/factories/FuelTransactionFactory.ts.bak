/**
 * FuelTransactionFactory - Generates fuel purchase records
 */
import { BaseFactory } from './BaseFactory';
import type { FuelTransaction, FuelType, FactoryOptions } from '../types';

interface FuelVendor {
  name: string;
  priceMultiplier: number; // Relative to base price
}

export class FuelTransactionFactory extends BaseFactory {
  // Major fuel vendors
  private readonly FUEL_VENDORS: FuelVendor[] = [
    { name: 'Shell', priceMultiplier: 1.02 },
    { name: 'Chevron', priceMultiplier: 1.03 },
    { name: 'BP', priceMultiplier: 1.0 },
    { name: 'ExxonMobil', priceMultiplier: 1.01 },
    { name: 'Valero', priceMultiplier: 0.98 },
    { name: 'Marathon', priceMultiplier: 0.99 },
    { name: 'Speedway', priceMultiplier: 0.97 },
    { name: '76', priceMultiplier: 1.01 },
    { name: 'Circle K', priceMultiplier: 0.96 },
  ];

  // Base fuel prices (per gallon in USD)
  private readonly BASE_FUEL_PRICES: Record<FuelType, number> = {
    gasoline: 3.45,
    diesel: 3.85,
    electric: 0.15, // per kWh
    hybrid: 3.45,
    propane: 2.75,
    cng: 2.25,
    hydrogen: 12.0,
  };

  /**
   * Generate a single fuel transaction
   */
  build(
    tenantId: string,
    vehicleId: string,
    driverId: string | null,
    fuelType: FuelType,
    index: number,
    options: FactoryOptions = {}
  ): FuelTransaction {
    const { overrides = {} } = options;

    const id = this.generateDeterministicUUID(`fuel-${tenantId}-${vehicleId}-${index}`);

    const vendor = this.faker.helpers.arrayElement(this.FUEL_VENDORS);
    const baseCost = this.BASE_FUEL_PRICES[fuelType];
    const costPerGallon = this.faker.number.float({
      min: baseCost * vendor.priceMultiplier * 0.95,
      max: baseCost * vendor.priceMultiplier * 1.05,
      fractionDigits: 3,
    });

    // Realistic fuel amounts by type
    const gallonsRange = {
      gasoline: { min: 8, max: 20 },
      diesel: { min: 25, max: 100 },
      electric: { min: 30, max: 85 }, // kWh
      hybrid: { min: 6, max: 12 },
      propane: { min: 15, max: 50 },
      cng: { min: 5, max: 25 },
      hydrogen: { min: 4, max: 12 },
    };

    const range = gallonsRange[fuelType];
    const gallons = this.faker.number.float({
      min: range.min,
      max: range.max,
      fractionDigits: 3,
    });

    // Calculate total cost directly (no need for faker here)
    const totalCost = parseFloat((gallons * costPerGallon).toFixed(2));

    const transactionDate = this.randomPastDate(90);
    const odometer = this.faker.number.int({ min: 5000, max: 150000 });

    // Generate realistic location
    const city = this.faker.location.city();
    const state = this.faker.location.state({ abbreviated: true });
    const location = `${vendor.name} - ${city}, ${state}`;

    // Last 4 digits of fuel card
    const cardLast4 = this.faker.string.numeric(4);

    return {
      id,
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      driver_id: driverId,
      transaction_date: transactionDate,
      gallons,
      cost_per_gallon: costPerGallon,
      total_cost: totalCost,
      fuel_type: fuelType,
      vendor: vendor.name,
      location,
      odometer,
      card_number_last_4: cardLast4,
      receipt_url: `https://receipts.fleet.example.com/${id}.pdf`,
      created_at: transactionDate,
      ...overrides,
    };
  }

  /**
   * Build multiple fuel transactions for a vehicle
   */
  buildList(
    tenantId: string,
    vehicleId: string,
    driverId: string | null,
    fuelType: FuelType,
    count: number,
    options: FactoryOptions = {}
  ): FuelTransaction[] {
    return Array.from({ length: count }, (_, i) =>
      this.build(tenantId, vehicleId, driverId, fuelType, i, options)
    );
  }
}
