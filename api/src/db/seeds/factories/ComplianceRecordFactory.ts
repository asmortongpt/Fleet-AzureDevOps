/**
 * ComplianceRecordFactory - Generates compliance and certification records
 */
import type { ComplianceRecord, CertificationStatus, FactoryOptions } from '../types';

import { BaseFactory } from './BaseFactory';

interface CertificationType {
  type: string;
  entityType: 'driver' | 'vehicle';
  validityMonths: number;
  issuingAuthority: string;
}

export class ComplianceRecordFactory extends BaseFactory {
  private readonly CERTIFICATION_TYPES: CertificationType[] = [
    {
      type: 'CDL_CLASS_A',
      entityType: 'driver',
      validityMonths: 60,
      issuingAuthority: 'State DMV',
    },
    {
      type: 'CDL_CLASS_B',
      entityType: 'driver',
      validityMonths: 60,
      issuingAuthority: 'State DMV',
    },
    {
      type: 'HAZMAT_ENDORSEMENT',
      entityType: 'driver',
      validityMonths: 60,
      issuingAuthority: 'TSA',
    },
    {
      type: 'MEDICAL_CARD',
      entityType: 'driver',
      validityMonths: 24,
      issuingAuthority: 'Certified Medical Examiner',
    },
    {
      type: 'DEFENSIVE_DRIVING',
      entityType: 'driver',
      validityMonths: 36,
      issuingAuthority: 'NSC',
    },
    {
      type: 'DOT_INSPECTION',
      entityType: 'vehicle',
      validityMonths: 12,
      issuingAuthority: 'DOT Inspector',
    },
    {
      type: 'EMISSIONS_TEST',
      entityType: 'vehicle',
      validityMonths: 12,
      issuingAuthority: 'State EPA',
    },
    {
      type: 'VEHICLE_REGISTRATION',
      entityType: 'vehicle',
      validityMonths: 12,
      issuingAuthority: 'State DMV',
    },
    {
      type: 'INSURANCE_CERTIFICATE',
      entityType: 'vehicle',
      validityMonths: 12,
      issuingAuthority: 'Insurance Provider',
    },
  ];

  /**
   * Generate a single compliance record
   */
  build(
    tenantId: string,
    entityType: 'driver' | 'vehicle',
    entityId: string,
    index: number,
    options: FactoryOptions = {}
  ): ComplianceRecord {
    const { overrides = {} } = options;

    const id = this.generateDeterministicUUID(`compliance-${tenantId}-${entityId}-${index}`);

    // Filter certification types by entity type
    const availableTypes = this.CERTIFICATION_TYPES.filter(
      (ct) => ct.entityType === entityType
    );
    const certType = this.faker.helpers.arrayElement(availableTypes);

    const issueDate = this.randomPastDate(certType.validityMonths * 30);
    const expiryDate = new Date(
      issueDate.getTime() + certType.validityMonths * 30 * 24 * 60 * 60 * 1000
    );

    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    let status: CertificationStatus;
    if (daysUntilExpiry < 0) {
      status = this.weightedRandom<CertificationStatus>([
        { value: 'expired', weight: 70 },
        { value: 'pending', weight: 20 },
        { value: 'revoked', weight: 10 },
      ]);
    } else if (daysUntilExpiry < 30) {
      status = this.weightedRandom<CertificationStatus>([
        { value: 'active', weight: 80 },
        { value: 'pending', weight: 20 },
      ]);
    } else {
      status = this.weightedRandom<CertificationStatus>([
        { value: 'active', weight: 90 },
        { value: 'suspended', weight: 5 },
        { value: 'pending', weight: 5 },
      ]);
    }

    const certificationNumber = `${certType.type}-${this.faker.string.alphanumeric(12).toUpperCase()}`;

    return {
      id,
      tenant_id: tenantId,
      entity_type: entityType,
      entity_id: entityId,
      certification_type: certType.type,
      certification_number: certificationNumber,
      issuing_authority: certType.issuingAuthority,
      issue_date: issueDate,
      expiry_date: expiryDate,
      status,
      document_url: `https://documents.fleet.example.com/compliance/${id}.pdf`,
      notes:
        daysUntilExpiry < 30 && daysUntilExpiry > 0
          ? `Expiring in ${daysUntilExpiry} days - renewal required`
          : null,
      created_at: issueDate,
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Build multiple compliance records for an entity
   */
  buildList(
    tenantId: string,
    entityType: 'driver' | 'vehicle',
    entityId: string,
    count: number,
    options: FactoryOptions = {}
  ): ComplianceRecord[] {
    return Array.from({ length: count }, (_, i) =>
      this.build(tenantId, entityType, entityId, i, options)
    );
  }

  /**
   * Build expired compliance record
   */
  buildExpired(
    tenantId: string,
    entityType: 'driver' | 'vehicle',
    entityId: string,
    index: number = 0
  ): ComplianceRecord {
    const pastIssueDate = this.randomPastDate(730); // 2 years ago
    const pastExpiryDate = this.randomPastDate(90); // Expired 90 days ago

    return this.build(tenantId, entityType, entityId, index, {
      overrides: {
        issue_date: pastIssueDate,
        expiry_date: pastExpiryDate,
        status: 'expired',
      },
    });
  }
}
