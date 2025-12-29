import { ERPIntegrationError } from '../errors/erp-integration-error';
import { auditLog } from '../utils/audit-log';
import { logger } from '../utils/logger';
import { secureHttpClient } from '../utils/secure-http-client';
import { validateDepreciationEntries, validateRetirementData } from '../utils/validators';

import { ERPSystem } from './erp-systems';


// FedRAMP Compliance: Ensure secure connection and data handling

export interface ERPConnector {
  postDepreciationJournal(tenantId: string, entries: DepreciationEntry[]): Promise<void>;
  postRetirement(tenantId: string, retirementData: RetirementData): Promise<void>;
}

export class ERPConnectorImpl implements ERPConnector {
  private logger: typeof logger;
  private auditLog: AuditLog;
  private erpSystem: ERPSystem;

  constructor(logger: typeof logger, auditLog: AuditLog, erpSystem: ERPSystem) {
    this.logger = logger;
    this.auditLog = auditLog;
    this.erpSystem = erpSystem;
  }

  async postDepreciationJournal(tenantId: string, entries: DepreciationEntry[]): Promise<void> {
    try {
      // Validate input
      validateDepreciationEntries(entries);

      // FedRAMP Compliance: Use secure HTTP client
      await secureHttpClient.post(`${this.erpSystem.getEndpoint()}/depreciation`, {
        tenant_id: tenantId,
        entries
      });

      this.auditLog.log('Depreciation journal posted', { tenantId, entries });
    } catch (error) {
      this.logger.error('Failed to post depreciation journal', { tenantId, error });
      throw new ERPIntegrationError('Failed to post depreciation journal', error);
    }
  }

  async postRetirement(tenantId: string, retirementData: RetirementData): Promise<void> {
    try {
      // Validate input
      validateRetirementData(retirementData);

      // FedRAMP Compliance: Use secure HTTP client
      await secureHttpClient.post(`${this.erpSystem.getEndpoint()}/retirement`, {
        tenant_id: tenantId,
        retirementData
      });

      this.auditLog.log('Retirement posted', { tenantId, retirementData });
    } catch (error) {
      this.logger.error('Failed to post retirement', { tenantId, error });
      throw new ERPIntegrationError('Failed to post retirement', error);
    }
  }
}

// Example of DepreciationEntry and RetirementData interfaces
interface DepreciationEntry {
  assetId: string;
  amount: number;
  date: string;
}

interface RetirementData {
  assetId: string;
  disposedAt: string;
  proceeds: number;
  evidenceUrls: string[];
}