```typescript
// src/agents/CTAFleetAgent050.ts
import { Logger } from '../utils/Logger';
import { DataRetentionPolicy } from '../models/DataRetentionPolicy';
import { ComplianceError } from '../errors/ComplianceError';
import { DatabaseService } from '../services/DatabaseService';
import { AuditService } from '../services/AuditService';
import { sanitizeInput } from '../utils/SecurityUtils';

/**
 * CTAFleet Agent 050: Manages data retention policies for compliance.
 * Ensures data is retained or purged based on defined policies.
 */
export class CTAFleetAgent050 {
  private readonly logger: Logger;
  private readonly databaseService: DatabaseService;
  private readonly auditService: AuditService;
  private readonly agentId: string = 'CTAFleetAgent050';

  constructor(
    logger: Logger,
    databaseService: DatabaseService,
    auditService: AuditService
  ) {
    this.logger = logger;
    this.databaseService = databaseService;
    this.auditService = auditService;
  }

  /**
   * Applies data retention policies to purge or archive data.
   * @param policy The retention policy to apply.
   * @returns Promise<void>
   * @throws ComplianceError if policy application fails.
   */
  public async applyRetentionPolicy(policy: DataRetentionPolicy): Promise<void> {
    try {
      this.logger.info(`Applying retention policy: ${policy.policyId}`, { agentId: this.agentId });

      // Sanitize policy inputs to prevent injection attacks
      const sanitizedPolicyId = sanitizeInput(policy.policyId);
      if (!sanitizedPolicyId) {
        throw new ComplianceError('Invalid policy ID provided');
      }

      // Validate policy
      if (!this.validatePolicy(policy)) {
        throw new ComplianceError('Invalid retention policy configuration');
      }

      // Fetch data subject to retention policy
      const dataToProcess = await this.databaseService.queryDataForRetention(
        policy.dataCategory,
        policy.retentionPeriodDays
      );

      if (!dataToProcess || dataToProcess.length === 0) {
        this.logger.info(`No data found for policy: ${policy.policyId}`, { agentId: this.agentId });
        return;
      }

      // Process data based on policy action (archive or delete)
      await this.processData(dataToProcess, policy);

      // Log compliance action for audit
      await this.auditService.logComplianceAction({
        agentId: this.agentId,
        policyId: policy.policyId,
        action: policy.action,
        dataCount: dataToProcess.length,
        timestamp: new Date().toISOString(),
      });

      this.logger.info(`Successfully applied policy: ${policy.policyId}`, { agentId: this.agentId });
    } catch (error) {
      this.logger.error(`Failed to apply retention policy: ${policy.policyId}`, {
        agentId: this.agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new ComplianceError(`Failed to apply retention policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates the retention policy configuration.
   * @param policy The policy to validate.
   * @returns boolean indicating if the policy is valid.
   */
  private validatePolicy(policy: DataRetentionPolicy): boolean {
    if (!policy.policyId || !policy.dataCategory || !policy.action) {
      return false;
    }
    if (policy.retentionPeriodDays <= 0) {
      return false;
    }
    if (!['archive', 'delete'].includes(policy.action)) {
      return false;
    }
    return true;
  }

  /**
   * Processes data based on the retention policy action.
   * @param data The data to process.
   * @param policy The retention policy.
   * @returns Promise<void>
   */
  private async processData(data: any[], policy: DataRetentionPolicy): Promise<void> {
    if (policy.action === 'archive') {
      await this.databaseService.archiveData(data, policy.dataCategory);
      this.logger.info(`Archived ${data.length} records for category: ${policy.dataCategory}`, {
        agentId: this.agentId,
      });
    } else if (policy.action === 'delete') {
      await this.databaseService.deleteData(data, policy.dataCategory);
      this.logger.info(`Deleted ${data.length} records for category: ${policy.dataCategory}`, {
        agentId: this.agentId,
      });
    }
  }
}

// src/models/DataRetentionPolicy.ts
export interface DataRetentionPolicy {
  policyId: string;
  dataCategory: string;
  retentionPeriodDays: number;
  action: 'archive' | 'delete';
}

// src/errors/ComplianceError.ts
export class ComplianceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComplianceError';
  }
}

// src/utils/Logger.ts (Mock for completeness)
export class Logger {
  public info(message: string, metadata: Record<string, any> = {}): void {
    console.log(`[INFO] ${message}`, metadata);
  }

  public error(message: string, metadata: Record<string, any> = {}): void {
    console.error(`[ERROR] ${message}`, metadata);
  }
}

// src/services/DatabaseService.ts (Mock for completeness)
export class DatabaseService {
  public async queryDataForRetention(category: string, retentionDays: number): Promise<any[]> {
    // Mock implementation
    return [];
  }

  public async archiveData(data: any[], category: string): Promise<void> {
    // Mock implementation
  }

  public async deleteData(data: any[], category: string): Promise<void> {
    // Mock implementation
  }
}

// src/services/AuditService.ts (Mock for completeness)
export class AuditService {
  public async logComplianceAction(action: Record<string, any>): Promise<void> {
    // Mock implementation
  }
}

// src/utils/SecurityUtils.ts
export function sanitizeInput(input: string): string {
  if (!input) return '';
  // Basic sanitization to prevent injection (can be enhanced with libraries like DOMPurify)
  return input.replace(/[<>{}();]/g, '');
}

// src/tests/CTAFleetAgent050.test.ts
import { CTAFleetAgent050 } from '../agents/CTAFleetAgent050';
import { Logger } from '../utils/Logger';
import { DatabaseService } from '../services/DatabaseService';
import { AuditService } from '../services/AuditService';
import { ComplianceError } from '../errors/ComplianceError';

describe('CTAFleetAgent050 - Data Retention Policies', () => {
  let agent: CTAFleetAgent050;
  let mockLogger: Logger;
  let mockDatabaseService: DatabaseService;
  let mockAuditService: AuditService;

  beforeEach(() => {
    mockLogger = new Logger();
    mockDatabaseService = new DatabaseService();
    mockAuditService = new AuditService();
    agent = new CTAFleetAgent050(mockLogger, mockDatabaseService, mockAuditService);

    // Mock database service methods
    jest.spyOn(mockDatabaseService, 'queryDataForRetention').mockResolvedValue([]);
    jest.spyOn(mockDatabaseService, 'archiveData').mockResolvedValue();
    jest.spyOn(mockDatabaseService, 'deleteData').mockResolvedValue();
    jest.spyOn(mockAuditService, 'logComplianceAction').mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should apply retention policy successfully with no data to process', async () => {
    const policy = {
      policyId: 'POLICY_001',
      dataCategory: 'user_data',
      retentionPeriodDays: 30,
      action: 'delete' as const,
    };

    await expect(agent.applyRetentionPolicy(policy)).resolves.toBeUndefined();
    expect(mockDatabaseService.queryDataForRetention).toHaveBeenCalledWith('user_data', 30);
  });

  test('should throw ComplianceError for invalid policy configuration', async () => {
    const policy = {
      policyId: 'POLICY_001',
      dataCategory: 'user_data',
      retentionPeriodDays: -1, // Invalid
      action: 'delete' as const,
    };

    await expect(agent.applyRetentionPolicy(policy)).rejects.toThrow(ComplianceError);
  });

  test('should throw ComplianceError for invalid policy ID', async () => {
    const policy = {
      policyId: '<script>malicious</script>',
      dataCategory: 'user_data',
      retentionPeriodDays: 30,
      action: 'delete' as const,
    };

    await expect(agent.applyRetentionPolicy(policy)).rejects.toThrow(ComplianceError);
  });

  test('should process data for archive action', async () => {
    const policy = {
      policyId: 'POLICY_001',
      dataCategory: 'user_data',
      retentionPeriodDays: 30,
      action: 'archive' as const,
    };

    const mockData = [{ id: 1 }, { id: 2 }];
    jest.spyOn(mockDatabaseService, 'queryDataForRetention').mockResolvedValue(mockData);

    await agent.applyRetentionPolicy(policy);
    expect(mockDatabaseService.archiveData).toHaveBeenCalledWith(mockData, 'user_data');
    expect(mockAuditService.logComplianceAction).toHaveBeenCalled();
  });

  test('should process data for delete action', async () => {
    const policy = {
      policyId: 'POLICY_001',
      dataCategory: 'user_data',
      retentionPeriodDays: 30,
      action: 'delete' as const,
    };

    const mockData = [{ id: 1 }, { id: 2 }];
    jest.spyOn(mockDatabaseService, 'queryDataForRetention').mockResolvedValue(mockData);

    await agent.applyRetentionPolicy(policy);
    expect(mockDatabaseService.deleteData).toHaveBeenCalledWith(mockData, 'user_data');
    expect(mockAuditService.logComplianceAction).toHaveBeenCalled();
  });

  test('should handle database service errors', async () => {
    const policy = {
      policyId: 'POLICY_001',
      dataCategory: 'user_data',
      retentionPeriodDays: 30,
      action: 'delete' as const,
    };

    jest.spyOn(mockDatabaseService, 'queryDataForRetention').mockRejectedValue(new Error('DB Error'));

    await expect(agent.applyRetentionPolicy(policy)).rejects.toThrow(ComplianceError);
  });
});
```
