import { BaseFactory } from './BaseFactory';
import type { OSHARecord } from '../types';

export class OSHARecordFactory extends BaseFactory<OSHARecord> {
  buildList(tenantId: string, count: number): OSHARecord[] {
    const records: OSHARecord[] = [];
    for (let i = 0; i < count; i++) {
      const date = this.randomDateWithinDays(120);
      records.push({
        tenant_id: tenantId,
        case_number: `OSHA-${date.getFullYear()}-${this.pad(i + 1, 4)}`,
        incident_date: date.toISOString().substring(0, 10),
        incident_description: this.faker.helpers.arrayElement([
          'Slip and fall in maintenance bay',
          'Minor laceration while changing tire',
          'Heat exhaustion during outdoor inspection',
          'Strain injury lifting equipment'
        ]),
        employee_name: this.faker.name.fullName(),
        job_title: this.faker.name.jobTitle(),
        body_part_affected: this.faker.helpers.arrayElement(['Arm', 'Leg', 'Back', 'Head', 'Hand']),
        injury_type: this.faker.helpers.arrayElement(['Sprain', 'Laceration', 'Contusion', 'Heat Stress']),
        is_recordable: true,
        is_lost_time: this.faker.datatype.boolean(),
        days_away_from_work: this.faker.number.int({ min: 0, max: 5 }),
        days_restricted_duty: this.faker.number.int({ min: 0, max: 10 }),
        location: this.faker.address.streetAddress(),
        status: this.faker.helpers.arrayElement(['open', 'investigating', 'closed']),
        metadata: {
          severity: this.faker.helpers.arrayElement(['minor', 'moderate', 'serious']),
          requiresMedicalAttention: true
        },
        reported_date: new Date().toISOString().substring(0, 10)
      });
    }
    return records;
  }

  private pad(num: number, width: number): string {
    return num.toString().padStart(width, '0');
  }

  private randomDateWithinDays(days: number): Date {
    const today = new Date();
    const offset = this.faker.number.int({ min: 0, max: days });
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    return d;
  }
}
