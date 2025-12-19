// src/agents/CTAFleetAgent47.ts
import { ComplianceAgent, ComplianceResult } from '../types/compliance';
import { PatientData } from '../types/patient';
import { Logger } from '../utils/logger';

export class CTAFleetAgent47 implements ComplianceAgent {
  private readonly name: string = 'CTAFleet Agent 47';
  private readonly version: string = '1.0.0';
  private logger: Logger;

  constructor(logger: Logger = new Logger()) {
    this.logger = logger;
  }

  public getName(): string {
    return this.name;
  }

  public getVersion(): string {
    return this.version;
  }

  public async checkCompliance(data: PatientData): Promise<ComplianceResult> {
    this.logger.info(`Starting HIPAA compliance check for patient ID: ${data.id}`);
    
    const issues: string[] = [];
    const checks = {
      isDataEncrypted: this.checkEncryption(data),
      isAccessControlled: this.checkAccessControl(data),
      isDataMinimized: this.checkDataMinimization(data),
      hasAuditTrail: this.checkAuditTrail(data),
    };

    if (!checks.isDataEncrypted) {
      issues.push('Data encryption standards not met');
    }
    if (!checks.isAccessControlled) {
      issues.push('Access control requirements not met');
    }
    if (!checks.isDataMinimized) {
      issues.push('Data minimization principles violated');
    }
    if (!checks.hasAuditTrail) {
      issues.push('Missing proper audit trail');
    }

    const isCompliant = issues.length === 0;
    this.logger.info(`HIPAA compliance check completed for patient ID: ${data.id}. Compliant: ${isCompliant}`);

    return {
      agentName: this.name,
      agentVersion: this.version,
      isCompliant,
      issues,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private checkEncryption(data: PatientData): boolean {
    return data.security?.isEncryptedAtRest === true && 
           data.security?.isEncryptedInTransit === true;
  }

  private checkAccessControl(data: PatientData): boolean {
    return data.access?.roles?.length > 0 && 
           data.access?.lastReviewDate !== undefined &&
           new Date(data.access.lastReviewDate).getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000;
  }

  private checkDataMinimization(data: PatientData): boolean {
    const requiredFields = ['id', 'dateOfBirth'];
    const hasRequiredFields = requiredFields.every(field => 
      data.personal && field in data.personal && data.personal[field] !== undefined
    );
    const hasExcessiveFields = Object.keys(data.personal || {}).length > 5;
    return hasRequiredFields && !hasExcessiveFields;
  }

  private checkAuditTrail(data: PatientData): boolean {
    return data.audit?.logs?.length > 0 && 
           data.audit?.lastUpdated !== undefined &&
           new Date(data.audit.lastUpdated).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
  }
}

// src/types/compliance.ts
export interface ComplianceAgent {
  getName(): string;
  getVersion(): string;
  checkCompliance(data: PatientData): Promise<ComplianceResult>;
}

export interface ComplianceResult {
  agentName: string;
  agentVersion: string;
  isCompliant: boolean;
  issues: string[];
  timestamp: string;
  checks: Record<string, boolean>;
}

// src/types/patient.ts
export interface PatientData {
  id: string;
  personal?: Record<string, any>;
  security?: {
    isEncryptedAtRest: boolean;
    isEncryptedInTransit: boolean;
  };
  access?: {
    roles: string[];
    lastReviewDate?: string;
  };
  audit?: {
    logs: string[];
    lastUpdated?: string;
  };
}

// src/utils/logger.ts
export class Logger {
  public info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  }

  public error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
  }
}

// src/tests/CTAFleetAgent47.test.ts
import { CTAFleetAgent47 } from '../agents/CTAFleetAgent47';

class MockLogger extends Logger {
  public infoMessages: string[] = [];
  public errorMessages: string[] = [];

  public info(message: string): void {
    this.infoMessages.push(message);
  }

  public error(message: string): void {
    this.errorMessages.push(message);
  }
}

describe('CTAFleetAgent47 - HIPAA Compliance', () => {
  let agent: CTAFleetAgent47;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    agent = new CTAFleetAgent47(mockLogger);
  });

  test('should return correct agent name and version', () => {
    expect(agent.getName()).toBe('CTAFleet Agent 47');
    expect(agent.getVersion()).toBe('1.0.0');
  });

  test('should pass compliance check for fully compliant data', async () => {
    const compliantData: PatientData = {
      id: '12345',
      personal: {
        id: '12345',
        dateOfBirth: '1990-01-01',
      },
      security: {
        isEncryptedAtRest: true,
        isEncryptedInTransit: true,
      },
      access: {
        roles: ['doctor', 'admin'],
        lastReviewDate: new Date().toISOString(),
      },
      audit: {
        logs: ['access on 2023-01-01'],
        lastUpdated: new Date().toISOString(),
      },
    };

    const result = await agent.checkCompliance(compliantData);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(mockLogger.infoMessages).toHaveLength(2);
  });

  test('should fail compliance check for non-compliant data', async () => {
    const nonCompliantData: PatientData = {
      id: '12345',
      personal: {
        id: '12345',
        dateOfBirth: '1990-01-01',
        extraField1: 'data',
        extraField2: 'data',
        extraField3: 'data',
        extraField4: 'data',
      },
      security: {
        isEncryptedAtRest: false,
        isEncryptedInTransit: false,
      },
      access: {
        roles: [],
      },
      audit: {
        logs: [],
      },
    };

    const result = await agent.checkCompliance(nonCompliantData);
    expect(result.isCompliant).toBe(false);
    expect(result.issues).toHaveLength(4);
    expect(result.issues).toContain('Data encryption standards not met');
    expect(result.issues).toContain('Access control requirements not met');
    expect(result.issues).toContain('Data minimization principles violated');
    expect(result.issues).toContain('Missing proper audit trail');
  });

  test('should log appropriate messages during compliance check', async () => {
    const data: PatientData = {
      id: '12345',
      personal: { id: '12345', dateOfBirth: '1990-01-01' },
      security: { isEncryptedAtRest: true, isEncryptedInTransit: true },
      access: { roles: ['doctor'], lastReviewDate: new Date().toISOString() },
      audit: { logs: ['log'], lastUpdated: new Date().toISOString() },
    };

    await agent.checkCompliance(data);
    expect(mockLogger.infoMessages[0]).toContain('Starting HIPAA compliance check');
    expect(mockLogger.infoMessages[1]).toContain('HIPAA compliance check completed');
  });
});
