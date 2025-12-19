// src/agents/CTAFleetAgent54.ts
import { AuditRecord } from '../models/AuditRecord';
import { ComplianceService } from '../services/ComplianceService';
import { DatabaseService } from '../services/DatabaseService';
import { Logger } from '../utils/Logger';

export class CTAFleetAgent54 {
  private logger: Logger;
  private databaseService: DatabaseService;
  private complianceService: ComplianceService;
  private agentId: string = 'CTAFleetAgent54';

  constructor(
    logger: Logger,
    databaseService: DatabaseService,
    complianceService: ComplianceService
  ) {
    this.logger = logger;
    this.databaseService = databaseService;
    this.complianceService = complianceService;
  }

  /**
   * Records an audit trail entry for a specific action
   * @param action The action being performed
   * @param entityId The ID of the entity being acted upon
   * @param userId The ID of the user performing the action
   * @param details Additional details about the action
   */
  async recordAuditTrail(
    action: string,
    entityId: string,
    userId: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      this.logger.info(`Recording audit trail for action: ${action}`, { entityId, userId });
      
      const auditRecord: AuditRecord = {
        id: this.generateAuditId(),
        agentId: this.agentId,
        action,
        entityId,
        userId,
        timestamp: new Date().toISOString(),
        details,
        complianceStatus: 'PENDING'
      };

      await this.databaseService.saveAuditRecord(auditRecord);
      await this.validateCompliance(auditRecord);
      
      this.logger.info(`Audit trail recorded successfully for action: ${action}`, { entityId });
    } catch (error) {
      this.logger.error(`Failed to record audit trail for action: ${action}`, { error, entityId });
      throw error;
    }
  }

  /**
   * Validates compliance for an audit record
   * @param auditRecord The audit record to validate
   */
  private async validateCompliance(auditRecord: AuditRecord): Promise<void> {
    try {
      const complianceResult = await this.complianceService.validate(auditRecord);
      auditRecord.complianceStatus = complianceResult.isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT';
      auditRecord.details.complianceDetails = complianceResult.details;
      
      await this.databaseService.updateAuditRecord(auditRecord);
    } catch (error) {
      this.logger.error(`Compliance validation failed for audit record: ${auditRecord.id}`, { error });
      auditRecord.complianceStatus = 'ERROR';
      auditRecord.details.error = error.message;
      await this.databaseService.updateAuditRecord(auditRecord);
    }
  }

  /**
   * Retrieves audit records for a specific entity
   * @param entityId The ID of the entity to retrieve audit records for
   * @returns Array of audit records
   */
  async getAuditRecords(entityId: string): Promise<AuditRecord[]> {
    try {
      this.logger.info(`Retrieving audit records for entity: ${entityId}`);
      return await this.databaseService.getAuditRecordsByEntityId(entityId);
    } catch (error) {
      this.logger.error(`Failed to retrieve audit records for entity: ${entityId}`, { error });
      throw error;
    }
  }

  /**
   * Generates a unique audit ID
   * @returns Unique audit ID
   */
  private generateAuditId(): string {
    return `${this.agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// src/models/AuditRecord.ts
export interface AuditRecord {
  id: string;
  agentId: string;
  action: string;
  entityId: string;
  userId: string;
  timestamp: string;
  details: Record<string, any>;
  complianceStatus: 'PENDING' | 'COMPLIANT' | 'NON_COMPLIANT' | 'ERROR';
}

// src/services/DatabaseService.ts
export class DatabaseService {
  private auditRecords: AuditRecord[] = [];

  async saveAuditRecord(record: AuditRecord): Promise<void> {
    this.auditRecords.push(record);
  }

  async updateAuditRecord(record: AuditRecord): Promise<void> {
    const index = this.auditRecords.findIndex(r => r.id === record.id);
    if (index !== -1) {
      this.auditRecords[index] = record;
    }
  }

  async getAuditRecordsByEntityId(entityId: string): Promise<AuditRecord[]> {
    return this.auditRecords.filter(r => r.entityId === entityId);
  }
}

// src/services/ComplianceService.ts
export class ComplianceService {
  async validate(auditRecord: AuditRecord): Promise<{ isCompliant: boolean; details: Record<string, any> }> {
    // Mock compliance validation logic
    return {
      isCompliant: auditRecord.action !== 'DELETE',
      details: {
        ruleSet: 'CTA_COMPLIANCE_V1',
        validationTime: new Date().toISOString()
      }
    };
  }
}

// src/utils/Logger.ts
export class Logger {
  info(message: string, context: Record<string, any> = {}): void {
    console.log(`[INFO] ${message}`, context);
  }

  error(message: string, context: Record<string, any> = {}): void {
    console.error(`[ERROR] ${message}`, context);
  }
}

// src/tests/CTAFleetAgent54.test.ts
import { CTAFleetAgent54 } from '../agents/CTAFleetAgent54';

describe('CTAFleetAgent54 - Audit Trail (Compliance)', () => {
  let agent: CTAFleetAgent54;
  let logger: Logger;
  let databaseService: DatabaseService;
  let complianceService: ComplianceService;

  beforeEach(() => {
    logger = new Logger();
    databaseService = new DatabaseService();
    complianceService = new ComplianceService();
    agent = new CTAFleetAgent54(logger, databaseService, complianceService);
  });

  test('should record audit trail successfully', async () => {
    const action = 'CREATE';
    const entityId = 'ENT_001';
    const userId = 'USER_001';
    const details = { source: 'TEST' };

    await agent.recordAuditTrail(action, entityId, userId, details);
    const records = await agent.getAuditRecords(entityId);

    expect(records.length).toBe(1);
    expect(records[0].action).toBe(action);
    expect(records[0].entityId).toBe(entityId);
    expect(records[0].userId).toBe(userId);
    expect(records[0].details.source).toBe(details.source);
  });

  test('should validate compliance for audit record', async () => {
    const action = 'UPDATE';
    const entityId = 'ENT_002';
    const userId = 'USER_002';

    await agent.recordAuditTrail(action, entityId, userId);
    const records = await agent.getAuditRecords(entityId);

    expect(records.length).toBe(1);
    expect(records[0].complianceStatus).toBe('COMPLIANT');
    expect(records[0].details.complianceDetails).toBeDefined();
  });

  test('should mark non-compliant actions', async () => {
    const action = 'DELETE';
    const entityId = 'ENT_003';
    const userId = 'USER_003';

    await agent.recordAuditTrail(action, entityId, userId);
    const records = await agent.getAuditRecords(entityId);

    expect(records.length).toBe(1);
    expect(records[0].complianceStatus).toBe('NON_COMPLIANT');
  });

  test('should handle errors during audit recording', async () => {
    const action = 'CREATE';
    const entityId = 'ENT_004';
    const userId = 'USER_004';

    // Mock database service to throw error
    jest.spyOn(databaseService, 'saveAuditRecord').mockImplementation(() => {
      throw new Error('Database error');
    });

    await expect(agent.recordAuditTrail(action, entityId, userId)).rejects.toThrow('Database error');
  });

  test('should retrieve audit records for entity', async () => {
    const entityId = 'ENT_005';
    const userId = 'USER_005';

    await agent.recordAuditTrail('CREATE', entityId, userId);
    await agent.recordAuditTrail('UPDATE', entityId, userId);
    const records = await agent.getAuditRecords(entityId);

    expect(records.length).toBe(2);
    expect(records.map(r => r.action)).toContain('CREATE');
    expect(records.map(r => r.action)).toContain('UPDATE');
  });
});
