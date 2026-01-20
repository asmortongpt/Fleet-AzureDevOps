/**
 * IncidentFactory - Generates incident/accident records
 */
import type { Incident, IncidentSeverity, Status, FactoryOptions } from '../types';

import { BaseFactory } from './BaseFactory';

export class IncidentFactory extends BaseFactory {
  private readonly INCIDENT_TYPES = [
    'collision',
    'property_damage',
    'mechanical_failure',
    'theft',
    'vandalism',
    'weather_damage',
    'driver_injury',
    'citation',
  ];

  /**
   * Generate a single incident
   */
  build(
    tenantId: string,
    vehicleId: string | null,
    driverId: string | null,
    index: number,
    options: FactoryOptions = {}
  ): Incident {
    const { overrides = {} } = options;

    const id = this.generateDeterministicUUID(`incident-${tenantId}-${index}`);

    const severity = this.weightedRandom<IncidentSeverity>([
      { value: 'minor', weight: 50 },
      { value: 'moderate', weight: 30 },
      { value: 'major', weight: 15 },
      { value: 'critical', weight: 4 },
      { value: 'fatal', weight: 1 },
    ]);

    const type = this.faker.helpers.arrayElement(this.INCIDENT_TYPES);

    const status = this.weightedRandom<Status>([
      { value: 'pending', weight: 15 },
      { value: 'in_progress', weight: 35 },
      { value: 'completed', weight: 45 },
      { value: 'on_hold', weight: 5 },
    ]);

    const incidentDate = this.randomPastDate(180);

    // Generate realistic location
    const city = this.faker.location.city();
    const state = this.faker.location.state();
    const street = this.faker.location.streetAddress();
    const location = `${street}, ${city}, ${state}`;

    const latitude = this.faker.location.latitude();
    const longitude = this.faker.location.longitude();

    // Severity determines injuries/fatalities
    let injuriesCount = 0;
    let fatalitiesCount = 0;

    switch (severity) {
      case 'minor':
        injuriesCount = 0;
        break;
      case 'moderate':
        injuriesCount = this.faker.number.int({ min: 0, max: 2 });
        break;
      case 'major':
        injuriesCount = this.faker.number.int({ min: 1, max: 5 });
        break;
      case 'critical':
        injuriesCount = this.faker.number.int({ min: 2, max: 8 });
        break;
      case 'fatal':
        injuriesCount = this.faker.number.int({ min: 1, max: 5 });
        fatalitiesCount = this.faker.number.int({ min: 1, max: 3 });
        break;
    }

    const policeReportNumber = this.faker.datatype.boolean({ probability: 0.7 })
      ? `PR-${this.faker.string.alphanumeric(10).toUpperCase()}`
      : null;

    const insuranceClaimNumber = this.faker.datatype.boolean({ probability: 0.8 })
      ? `CLM-${this.faker.string.alphanumeric(12).toUpperCase()}`
      : null;

    // Estimated cost based on severity
    const costRanges = {
      minor: { min: 500, max: 5000 },
      moderate: { min: 5000, max: 25000 },
      major: { min: 25000, max: 100000 },
      critical: { min: 100000, max: 500000 },
      fatal: { min: 500000, max: 2000000 },
    };

    const costRange = costRanges[severity];
    const estimatedCost = this.faker.number.float({
      min: costRange.min,
      max: costRange.max,
      fractionDigits: 2,
    });

    const descriptions = {
      collision: 'Vehicle collision with another vehicle',
      property_damage: 'Damage to property or infrastructure',
      mechanical_failure: 'Mechanical failure resulting in incident',
      theft: 'Vehicle or equipment theft',
      vandalism: 'Vandalism to vehicle',
      weather_damage: 'Weather-related damage',
      driver_injury: 'Driver injury incident',
      citation: 'Traffic citation or violation',
    };

    return {
      id,
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      driver_id: driverId,
      incident_date: incidentDate,
      severity,
      type,
      description: descriptions[type as keyof typeof descriptions] || 'Incident occurred',
      location,
      latitude,
      longitude,
      injuries_count: injuriesCount,
      fatalities_count: fatalitiesCount,
      police_report_number: policeReportNumber,
      insurance_claim_number: insuranceClaimNumber,
      status,
      estimated_cost: estimatedCost,
      created_at: incidentDate,
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Build multiple incidents
   */
  buildList(
    tenantId: string,
    count: number,
    vehicleIds: string[],
    driverIds: string[],
    options: FactoryOptions = {}
  ): Incident[] {
    return Array.from({ length: count }, (_, i) => {
      const vehicleId = this.faker.helpers.arrayElement([...vehicleIds, null]);
      const driverId = this.faker.helpers.arrayElement([...driverIds, null]);
      return this.build(tenantId, vehicleId, driverId, i, options);
    });
  }
}
