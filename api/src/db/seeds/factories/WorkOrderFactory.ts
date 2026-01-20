/**
 * WorkOrderFactory - Generates maintenance work orders
 */
import type { WorkOrder, MaintenanceType, Priority, Status, FactoryOptions } from '../types';

import { BaseFactory } from './BaseFactory';

export class WorkOrderFactory extends BaseFactory {
  /**
   * Generate a single work order
   */
  build(
    tenantId: string,
    vehicleId: string,
    index: number,
    mechanicId?: string,
    options: FactoryOptions = {}
  ): WorkOrder {
    const { overrides = {} } = options;

    const id = this.generateDeterministicUUID(`workorder-${tenantId}-${vehicleId}-${index}`);
    const year = new Date().getFullYear();
    const workOrderNumber = this.generateWorkOrderNumber('WO', year, index);

    const type = this.weightedRandom<MaintenanceType>([
      { value: 'preventive', weight: 50 },
      { value: 'corrective', weight: 30 },
      { value: 'inspection', weight: 15 },
      { value: 'recall', weight: 3 },
      { value: 'upgrade', weight: 2 },
    ]);

    const priority = this.weightedRandom<Priority>([
      { value: 'low', weight: 30 },
      { value: 'medium', weight: 40 },
      { value: 'high', weight: 20 },
      { value: 'critical', weight: 8 },
      { value: 'emergency', weight: 2 },
    ]);

    const status = this.weightedRandom<Status>([
      { value: 'pending', weight: 20 },
      { value: 'in_progress', weight: 30 },
      { value: 'completed', weight: 40 },
      { value: 'on_hold', weight: 7 },
      { value: 'cancelled', weight: 3 },
    ]);

    const scheduledStart = this.faker.date.recent({ days: 30 });
    const scheduledEnd = new Date(scheduledStart.getTime() + this.faker.number.int({ min: 2, max: 48 }) * 60 * 60 * 1000);

    let actualStart: Date | null = null;
    let actualEnd: Date | null = null;

    if (status === 'in_progress' || status === 'completed') {
      actualStart = this.faker.date.between({ from: scheduledStart, to: new Date() });
      if (status === 'completed') {
        actualEnd = new Date(actualStart.getTime() + this.faker.number.int({ min: 1, max: 72 }) * 60 * 60 * 1000);
      }
    }

    const estimatedCost = this.faker.number.float({ min: 100, max: 5000, fractionDigits: 2 });
    const actualCost = status === 'completed'
      ? this.faker.number.float({ min: estimatedCost * 0.8, max: estimatedCost * 1.3, fractionDigits: 2 })
      : null;

    const descriptions = {
      preventive: 'Routine maintenance service',
      corrective: 'Repair identified issue',
      inspection: 'Safety and compliance inspection',
      recall: 'Manufacturer recall service',
      upgrade: 'System upgrade or enhancement',
    };

    return {
      id,
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      work_order_number: workOrderNumber,
      type,
      priority,
      status,
      description: descriptions[type],
      assigned_to: mechanicId || null,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      actual_start: actualStart,
      actual_end: actualEnd,
      estimated_cost: estimatedCost,
      actual_cost: actualCost,
      notes: this.faker.datatype.boolean({ probability: 0.6 }) ? this.faker.lorem.sentence() : null,
      created_at: this.randomPastDate(60),
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Build multiple work orders for a vehicle
   */
  buildList(
    tenantId: string,
    vehicleId: string,
    count: number,
    mechanicId?: string,
    options: FactoryOptions = {}
  ): WorkOrder[] {
    return Array.from({ length: count }, (_, i) => this.build(tenantId, vehicleId, i, mechanicId, options));
  }

  /**
   * Build emergency work order
   */
  buildEmergency(tenantId: string, vehicleId: string, index: number = 0): WorkOrder {
    return this.build(tenantId, vehicleId, index, undefined, {
      overrides: {
        priority: 'emergency',
        status: 'in_progress',
        type: 'corrective',
      },
    });
  }
}
