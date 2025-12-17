// src/dataRetentionPolicies.ts
import { Logger } from './logger';

export interface RetentionPolicy {
  dataType: string;
  retentionDays: number;
  complianceRequirement: string;
  lastReviewed: Date;
}

export class DataRetentionManager {
  private policies: RetentionPolicy[] = [];
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    this.policies = [
      {
        dataType: 'UserActivity',
        retentionDays: 90,
        complianceRequirement: 'GDPR Article 5',
        lastReviewed: new Date('2023-01-01'),
      },
      {
        dataType: 'TransactionLogs',
        retentionDays: 180,
        complianceRequirement: 'SOX Section 802',
        lastReviewed: new Date('2023-01-01'),
      },
      {
        dataType: 'AuditRecords',
        retentionDays: 365,
        complianceRequirement: 'HIPAA Security Rule',
        lastReviewed: new Date('2023-01-01'),
      },
    ];
    this.logger.info('Default retention policies initialized');
  }

  public getPolicy(dataType: string): RetentionPolicy | undefined {
    return this.policies.find((policy) => policy.dataType === dataType);
  }

  public addPolicy(policy: RetentionPolicy): boolean {
    if (this.policies.some((p) => p.dataType === policy.dataType)) {
      this.logger.error(`Policy for ${policy.dataType} already exists`);
      return false;
    }
    this.policies.push(policy);
    this.logger.info(`Added retention policy for ${policy.dataType}`);
    return true;
  }

  public updatePolicy(dataType: string, updates: Partial<RetentionPolicy>): boolean {
    const policyIndex = this.policies.findIndex((p) => p.dataType === dataType);
    if (policyIndex === -1) {
      this.logger.error(`Policy for ${dataType} not found`);
      return false;
    }
    this.policies[policyIndex] = { ...this.policies[policyIndex], ...updates };
    this.logger.info(`Updated retention policy for ${dataType}`);
    return true;
  }

  public deletePolicy(dataType: string): boolean {
    const policyIndex = this.policies.findIndex((p) => p.dataType === dataType);
    if (policyIndex === -1) {
      this.logger.error(`Policy for ${dataType} not found`);
      return false;
    }
    this.policies.splice(policyIndex, 1);
    this.logger.info(`Deleted retention policy for ${dataType}`);
    return true;
  }

  public getAllPolicies(): RetentionPolicy[] {
    return [...this.policies];
  }

  public isDataCompliant(dataType: string, dataAgeInDays: number): boolean {
    const policy = this.getPolicy(dataType);
    if (!policy) {
      this.logger.warn(`No policy found for ${dataType}`);
      return false;
    }
    return dataAgeInDays <= policy.retentionDays;
  }
}

// src/logger.ts
export class Logger {
  public info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  }

  public warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  }

  public error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
  }
}

// tests/dataRetentionPolicies.test.ts
import { DataRetentionManager, RetentionPolicy } from '../src/dataRetentionPolicies';
import { Logger } from '../src/logger';

describe('DataRetentionManager', () => {
  let manager: DataRetentionManager;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
    manager = new DataRetentionManager(logger);
  });

  test('should initialize with default policies', () => {
    const policies = manager.getAllPolicies();
    expect(policies.length).toBe(3);
    expect(policies[0].dataType).toBe('UserActivity');
    expect(policies[1].dataType).toBe('TransactionLogs');
    expect(policies[2].dataType).toBe('AuditRecords');
  });

  test('should get specific policy', () => {
    const policy = manager.getPolicy('UserActivity');
    expect(policy).toBeDefined();
    expect(policy?.retentionDays).toBe(90);
    expect(policy?.complianceRequirement).toBe('GDPR Article 5');
  });

  test('should return undefined for non-existent policy', () => {
    const policy = manager.getPolicy('NonExistent');
    expect(policy).toBeUndefined();
  });

  test('should add new policy successfully', () => {
    const newPolicy: RetentionPolicy = {
      dataType: 'NewDataType',
      retentionDays: 30,
      complianceRequirement: 'Test Rule',
      lastReviewed: new Date(),
    };
    const result = manager.addPolicy(newPolicy);
    expect(result).toBe(true);
    expect(manager.getPolicy('NewDataType')).toBeDefined();
  });

  test('should not add duplicate policy', () => {
    const duplicatePolicy: RetentionPolicy = {
      dataType: 'UserActivity',
      retentionDays: 60,
      complianceRequirement: 'Test Rule',
      lastReviewed: new Date(),
    };
    const result = manager.addPolicy(duplicatePolicy);
    expect(result).toBe(false);
    const policy = manager.getPolicy('UserActivity');
    expect(policy?.retentionDays).toBe(90); // Original value should remain
  });

  test('should update existing policy', () => {
    const updates: Partial<RetentionPolicy> = {
      retentionDays: 120,
      complianceRequirement: 'Updated Rule',
    };
    const result = manager.updatePolicy('UserActivity', updates);
    expect(result).toBe(true);
    const policy = manager.getPolicy('UserActivity');
    expect(policy?.retentionDays).toBe(120);
    expect(policy?.complianceRequirement).toBe('Updated Rule');
  });

  test('should not update non-existent policy', () => {
    const updates: Partial<RetentionPolicy> = {
      retentionDays: 120,
    };
    const result = manager.updatePolicy('NonExistent', updates);
    expect(result).toBe(false);
  });

  test('should delete existing policy', () => {
    const result = manager.deletePolicy('UserActivity');
    expect(result).toBe(true);
    expect(manager.getPolicy('UserActivity')).toBeUndefined();
  });

  test('should not delete non-existent policy', () => {
    const result = manager.deletePolicy('NonExistent');
    expect(result).toBe(false);
  });

  test('should check data compliance correctly', () => {
    const isCompliant = manager.isDataCompliant('UserActivity', 30);
    expect(isCompliant).toBe(true);

    const isNotCompliant = manager.isDataCompliant('UserActivity', 100);
    expect(isNotCompliant).toBe(false);

    const noPolicy = manager.isDataCompliant('NonExistent', 10);
    expect(noPolicy).toBe(false);
  });
});
