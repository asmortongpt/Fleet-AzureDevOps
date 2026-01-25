/**
 * MaintenanceScheduleFactory - Generates maintenance schedules
 */
import { BaseFactory } from './BaseFactory';
import type { MaintenanceSchedule, MaintenanceType, Priority, Status, FactoryOptions } from '../types';

export class MaintenanceScheduleFactory extends BaseFactory {
  /**
   * Generate a single maintenance schedule
   */
  build(
    tenantId: string,
    vehicleId: string,
    index: number,
    mechanicId?: string,
    workOrderId?: string,
    options: FactoryOptions = {}
  ): MaintenanceSchedule {
    const { overrides = {} } = options;

    const id = this.generateDeterministicUUID(`maintenance-${tenantId}-${vehicleId}-${index}`);

    const type = this.weightedRandom<MaintenanceType>([
      { value: 'preventive', weight: 60 },
      { value: 'corrective', weight: 20 },
      { value: 'inspection', weight: 15 },
      { value: 'recall', weight: 3 },
      { value: 'upgrade', weight: 2 },
    ]);

    const priority = this.weightedRandom<Priority>([
      { value: 'low', weight: 30 },
      { value: 'medium', weight: 50 },
      { value: 'high', weight: 15 },
      { value: 'critical', weight: 5 },
    ]);

    const status = this.weightedRandom<Status>([
      { value: 'pending', weight: 25 },
      { value: 'in_progress', weight: 20 },
      { value: 'completed', weight: 45 },
      { value: 'on_hold', weight: 7 },
      { value: 'cancelled', weight: 3 },
    ]);

    const isCompleted = status === 'completed';
    const scheduledDate = isCompleted
      ? this.faker.date.past({ years: 1 })
      : this.faker.date.soon({ days: 90 });

    const completedDate = isCompleted
      ? this.faker.date.between({ from: scheduledDate, to: new Date() })
      : null;

    const mileageAtService = this.faker.number.int({ min: 5000, max: 150000 });
    const cost = status === 'completed'
      ? this.faker.number.float({ min: 50, max: 3000, fractionDigits: 2 })
      : null;

    const descriptions = {
      preventive: [
        'Oil change and filter replacement',
        'Tire rotation and balancing',
        'Brake inspection and service',
        'Transmission fluid service',
        'Air filter replacement',
        'Coolant flush and fill',
      ],
      corrective: [
        'Engine repair',
        'Transmission repair',
        'Brake system repair',
        'Suspension repair',
        'Electrical system repair',
      ],
      inspection: [
        'Annual safety inspection',
        'DOT compliance inspection',
        'Emissions testing',
        'Pre-trip inspection',
      ],
      recall: ['Manufacturer safety recall service'],
      upgrade: ['Fleet tracking system installation', 'Camera system upgrade'],
    };

    const description = this.faker.helpers.arrayElement(descriptions[type]);

    return {
      id,
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      type,
      description,
      scheduled_date: scheduledDate,
      completed_date: completedDate,
      status,
      priority,
      assigned_mechanic_id: mechanicId || null,
      mileage_at_service: status === 'completed' ? mileageAtService : null,
      cost,
      work_order_id: workOrderId || null,
      notes: this.faker.datatype.boolean({ probability: 0.5 }) ? this.faker.lorem.sentence() : null,
      created_at: this.randomPastDate(180),
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Build multiple maintenance schedules
   */
  buildList(
    tenantId: string,
    vehicleId: string,
    count: number,
    options: FactoryOptions = {}
  ): MaintenanceSchedule[] {
    return Array.from({ length: count }, (_, i) => this.build(tenantId, vehicleId, i, undefined, undefined, options));
  }
}
